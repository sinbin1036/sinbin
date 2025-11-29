import os
from functools import lru_cache
from dotenv import load_dotenv
load_dotenv()

class Settings:
    """Simple settings helper that reads configuration from environment variables."""

    def __init__(self) -> None:
        self.github_client_id = self._get_env("GITHUB_CLIENT_ID")
        self.github_client_secret = self._get_env("GITHUB_CLIENT_SECRET")
        self.github_redirect_uri = self._get_env("GITHUB_REDIRECT_URI")
        self.database_url = self._get_env("DATABASE_URL")
        self.jwt_secret = self._get_env("JWT_SECRET")
        # Optional values allow fallbacks when not explicitly configured.
        self.frontend_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")

    @staticmethod
    def _get_env(key: str) -> str:
        value = os.getenv(key)
        if not value:
            raise RuntimeError(f"Environment variable '{key}' is required but missing.")
        return value


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance so env lookups only happen once."""
    return Settings()

