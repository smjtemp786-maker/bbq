"""Brain Bonds API server."""
from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

from core import client  # noqa: E402
from seed import run_seed  # noqa: E402
import routes_auth, routes_mgmt, routes_learning, routes_analytics, routes_sync, routes_ai  # noqa: E402

app = FastAPI(title="Brain Bonds API")
api_router = APIRouter(prefix="/api")


@api_router.get("/")
async def root():
    return {"message": "Brain Bonds API", "status": "ok"}


@api_router.get("/health")
async def health():
    return {"status": "healthy"}


api_router.include_router(routes_auth.router)
api_router.include_router(routes_mgmt.router)
api_router.include_router(routes_learning.router)
api_router.include_router(routes_analytics.router)
api_router.include_router(routes_sync.router)
api_router.include_router(routes_ai.router)

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=False,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def on_startup():
    try:
        await run_seed()
        logger.info("Seed completed")
    except Exception as e:
        logger.exception(f"Seed failed: {e}")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
