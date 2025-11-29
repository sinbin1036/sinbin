from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .db import Base, engine
from .routers import auth

settings = get_settings()

app = FastAPI(title="Personalized Dashboard API")

# Allow browser requests from the configured frontend origin.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables automatically for early development; switch to migrations later.
Base.metadata.create_all(bind=engine)

app.include_router(auth.router)


@app.get("/health")
async def health_check():
    return {"ok": True}

