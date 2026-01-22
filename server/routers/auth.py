from __future__ import annotations

import secrets
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Dict, Optional
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from ..auth_utils import create_access_token
from ..config import get_settings
from ..db import get_db
from ..models import User

router = APIRouter(prefix="/auth/github", tags=["auth"])

settings = get_settings()

GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_USER_URL = "https://api.github.com/user"

STATE_TTL = timedelta(minutes=10)


@dataclass
class OAuthState:
    remember: bool
    created_at: datetime


oauth_state_store: Dict[str, OAuthState] = {}


def _cleanup_states() -> None:
    """Remove expired state entries from memory."""
    now = datetime.now(timezone.utc)
    expired = [key for key, value in oauth_state_store.items() if now - value.created_at > STATE_TTL]
    for key in expired:
        oauth_state_store.pop(key, None)


def _store_state(state: str, remember: bool) -> None:
    _cleanup_states()
    oauth_state_store[state] = OAuthState(remember=remember, created_at=datetime.now(timezone.utc))


def _consume_state(state: str) -> Optional[OAuthState]:
    _cleanup_states()
    return oauth_state_store.pop(state, None)


@router.get("/login")
async def github_login(remember: Optional[int] = None) -> RedirectResponse:
    """
    Initiate the GitHub OAuth flow by redirecting the user to GitHub.
    The optional `remember` flag controls how long the eventual session will persist.
    """
    remember_flag = bool(remember)
    state = secrets.token_urlsafe(32)
    _store_state(state, remember_flag)

    params = {
        "client_id": settings.github_client_id,
        "redirect_uri": settings.github_redirect_uri,
        "scope": "read:user",
        "state": state,
    }
    redirect_url = f"{GITHUB_AUTHORIZE_URL}?{urlencode(params)}"

    return RedirectResponse(url=redirect_url, status_code=status.HTTP_302_FOUND)


@router.get("/callback")
async def github_callback(code: str, state: str, db: Session = Depends(get_db)) -> RedirectResponse:
    """
    Handle GitHub OAuth callback, exchange the code for an access token,
    upsert the user, and issue the session cookie.
    """
    state_payload = _consume_state(state)
    if not state_payload:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid state.")

    try:
        access_token = await _exchange_code_for_token(code)
        profile = await _fetch_github_profile(access_token)
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="GitHub API request failed.",
        ) from exc

    try:
        user = _update_existing_user(db, profile)
    except HTTPException as exc:
        if exc.status_code == status.HTTP_403_FORBIDDEN:
            redirect_url = f"{settings.frontend_origin}?error=unauthorized"
            return RedirectResponse(url=redirect_url, status_code=302)
        raise
    expires_delta = timedelta(days=30) if state_payload.remember else timedelta(hours=2)
    token = create_access_token(
        {"sub": str(user.id), "github_login": user.github_login},
        expires_delta=expires_delta,
    )

    response = RedirectResponse(
        url=settings.frontend_origin,
        status_code=302,
    )
    response.set_cookie(
        key="session",
        value=token,
        httponly=True,
        secure=False,  #로컬 개발
        samesite="lax",
        max_age=int(expires_delta.total_seconds()),
        path="/",
    )
    return response


async def _exchange_code_for_token(code: str) -> str:
    """Exchange the OAuth authorization code for an access token."""
    payload = {
        "client_id": settings.github_client_id,
        "client_secret": settings.github_client_secret,
        "code": code,
        "redirect_uri": settings.github_redirect_uri,
    }
    headers = {"Accept": "application/json"}
    async with httpx.AsyncClient() as client:
        resp = await client.post(GITHUB_TOKEN_URL, data=payload, headers=headers, timeout=10)
    resp.raise_for_status()
    data = resp.json()
    access_token = data.get("access_token")
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="GitHub token exchange failed.",
        )
    return access_token


async def _fetch_github_profile(access_token: str) -> dict:
    """Fetch the GitHub user profile using the provided access token."""
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json",
    }
    async with httpx.AsyncClient() as client:
        resp = await client.get(GITHUB_USER_URL, headers=headers, timeout=10)
    resp.raise_for_status()
    return resp.json()


def _update_existing_user(db: Session, profile: dict) -> User:
    """Update an existing user record using GitHub profile information."""
    github_id = str(profile["id"])
    github_login = profile["login"]
    avatar_url = profile.get("avatar_url")

    user = db.query(User).filter(User.github_id == github_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized account.",
        )
    now = datetime.now(timezone.utc)
    user.github_login = github_login
    user.avatar_url = avatar_url
    user.last_login_at = now

    db.commit()
    db.refresh(user)
    return user
