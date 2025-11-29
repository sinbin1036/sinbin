from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Integer, String, func

from .db import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    github_id = Column(String, unique=True, nullable=False, index=True)
    github_login = Column(String, unique=True, nullable=False, index=True)
    avatar_url = Column(String, nullable=True)
    created_at = Column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    last_login_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    def touch_login(self) -> None:
        """Update the last_login_at timestamp to now."""
        self.last_login_at = datetime.now(timezone.utc)
