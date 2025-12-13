from __future__ import annotations

import os
import uuid
from typing import Any, Dict

import httpx
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

router = APIRouter(prefix="/quick-links", tags=["quick-links"])


class QuickLink(BaseModel):
    id: str | None = None
    label: str
    href: str
    description: str
    symbol: str | None = None


SUPABASE_URL = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_ANON_KEY") or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
TABLE_PATH = "/quick_links"
BASE_REST_PATH = "/rest/v1"
DEFAULT_SELECT = "id,label,href,description,symbol"


def _require_supabase_config():
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Supabase 환경 변수를 확인하세요.")


def _headers(extra: Dict[str, str] | None = None) -> Dict[str, str]:
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
    }
    if extra:
        headers.update(extra)
    return headers


def _rest_url(path: str) -> str:
    return f"{SUPABASE_URL}{BASE_REST_PATH}{path}"


async def _request(method: str, path: str, *, params: Dict[str, Any] | None = None, json: Any = None, prefer: str | None = None):
    _require_supabase_config()
    headers = _headers({"Prefer": prefer} if prefer else None)
    url = _rest_url(path)
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.request(method, url, params=params, json=json, headers=headers)
    if resp.status_code >= 400:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    if resp.content:
        return resp.json()
    return None


@router.get("")
async def list_links():
    data = await _request(
        "GET",
        TABLE_PATH,
        params={"select": DEFAULT_SELECT, "order": "label.asc"},
    )
    return {"ok": True, "data": data}


@router.post("")
async def create_link(payload: QuickLink):
    link_id = payload.id or str(uuid.uuid4())
    body = {**payload.dict(), "id": link_id}
    data = await _request(
        "POST",
        TABLE_PATH,
        json=body,
        prefer="return=representation",
    )
    return {"ok": True, "data": data[0] if isinstance(data, list) and data else data}


@router.put("/{link_id}")
async def update_link(link_id: str, payload: QuickLink):
    body = {**payload.dict(), "id": link_id}
    data = await _request(
        "PATCH",
        f"{TABLE_PATH}",
        params={"id": f"eq.{link_id}"},
        json=body,
        prefer="return=representation",
    )
    if not data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="not found")
    return {"ok": True, "data": data[0] if isinstance(data, list) and data else data}


@router.delete("/{link_id}")
async def delete_link(link_id: str):
    await _request("DELETE", f"{TABLE_PATH}", params={"id": f"eq.{link_id}"})
    return {"ok": True}
