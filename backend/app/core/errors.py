import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.core.database import SessionLocal
from app.core.logging import request_id_var

log = logging.getLogger(__name__)


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(Exception)
    async def unhandled(request: Request, exc: Exception) -> JSONResponse:
        rid = request_id_var.get()
        log.exception("Unhandled error on %s %s", request.method, request.url.path)
        _record(request, exc, rid)
        # Never leak internals; the request ID lets support find the full trace.
        return JSONResponse(status_code=500, content={"detail": "Internal server error", "request_id": rid})


def _record(request: Request, exc: Exception, rid: str) -> None:
    from app.models import ErrorLog

    try:
        with SessionLocal() as db:
            db.add(ErrorLog(source="api", message=f"{type(exc).__name__}: {exc}"[:2000],
                            context={"path": request.url.path, "method": request.method, "request_id": rid}))
            db.commit()
    except Exception:  # the database itself may be the problem
        log.exception("Could not write error log")
