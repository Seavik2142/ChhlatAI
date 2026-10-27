import asyncio
import contextlib
import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.database import engine
from app.core.errors import register_exception_handlers
from app.core.logging import RequestContextMiddleware, configure_logging
from app.core.redis import get_redis
from app.realtime.hub import hub

log = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    settings = get_settings()
    hub.bind_loop(asyncio.get_running_loop())
    listener = asyncio.create_task(hub.run_redis_listener(settings.redis_url)) if settings.redis_url else None
    from app.services.telegram_user import telegram_user_manager
    asyncio.create_task(telegram_user_manager.start_all())
    if settings.telegram_bot_token and settings.public_base_url.startswith("https://"):
        from app.services.admin_bot import register_admin_bot_webhook
        asyncio.get_running_loop().run_in_executor(None, register_admin_bot_webhook)
    log.info("API started (%s, realtime=%s)", settings.environment, "redis" if listener else "in-process")
    yield
    if listener:
        listener.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await listener
    with contextlib.suppress(Exception):
        await telegram_user_manager.stop_all()
    engine.dispose()


def create_app() -> FastAPI:
    settings = get_settings()
    configure_logging()
    app = FastAPI(title=settings.app_name, version="1.1.0", lifespan=lifespan, docs_url="/api/docs",
                  openapi_url="/api/openapi.json", redoc_url=None)
    app.add_middleware(GZipMiddleware, minimum_size=1024)
    app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins,
                       allow_origin_regex=r"https://.*\.trycloudflare\.com", allow_credentials=True,
                       allow_methods=["*"], allow_headers=["*"], expose_headers=["X-Request-ID"])
    app.add_middleware(RequestContextMiddleware)
    from app.api.oauth_routes import router as oauth_router

    register_exception_handlers(app)
    app.include_router(api_router, prefix="/api/v1")
    app.include_router(oauth_router, prefix="/api/auth")
    app.include_router(oauth_router, prefix="/api/v1/auth")

    if settings.storage_backend == "local":
        Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
        app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")

    @app.get("/api/health", tags=["health"])
    def health() -> dict:
        """Liveness: the process is up."""
        return {"status": "ok"}

    @app.get("/api/ready", tags=["health"])
    def ready() -> JSONResponse:
        """Readiness: dependencies reachable — load balancers should only route here when this is 200."""
        checks: dict[str, str] = {}
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            checks["database"] = "ok"
        except Exception as e:
            checks["database"] = f"error: {type(e).__name__}"
        r = get_redis()
        if r is not None:
            try:
                r.ping()
                checks["redis"] = "ok"
            except Exception as e:
                checks["redis"] = f"error: {type(e).__name__}"
        healthy = all(v == "ok" for v in checks.values())
        return JSONResponse({"status": "ok" if healthy else "degraded", "checks": checks,
                             "websockets": hub.connection_count}, status_code=200 if healthy else 503)

    return app


app = create_app()
