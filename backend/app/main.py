from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.api.websocket import router as websocket_router
from app.core.access_log import install_access_log_filter
from app.core.config import get_settings
from app.core.exceptions import AppError
from app.core.handlers import app_error_handler
from app.db.session import engine

settings = get_settings()
install_access_log_filter()


@asynccontextmanager
async def lifespan(_: FastAPI):
    yield
    await engine.dispose()


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(AppError, app_error_handler)
app.include_router(api_router, prefix="/api")
app.include_router(websocket_router)
