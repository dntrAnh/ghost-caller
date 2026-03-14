from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.api.calendar import router as calendar_router
from app.api.call import router as call_router
from app.api.websocket import router as ws_router
from app.api.v1.router import router as v1_router
from app.core.config import settings
from app.core.exceptions import GhostCallerError
from app.core.logging import configure_logging, logger


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()
    logger.info("app.startup", env=settings.app_env)
    yield
    logger.info("app.shutdown")


app = FastAPI(
    title="Ghost Caller",
    description="AI-powered travel agent — itinerary building and agentic phone booking.",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs" if not settings.is_production else None,
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$" if not settings.is_production else None,
    allow_origins=[] if not settings.is_production else [],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)


@app.exception_handler(GhostCallerError)
async def ghost_caller_error_handler(request: Request, exc: GhostCallerError) -> JSONResponse:
    logger.error("unhandled_app_error", error=str(exc), path=request.url.path)
    return JSONResponse(status_code=500, content={"detail": str(exc)})


app.include_router(v1_router, prefix="/api")
app.include_router(call_router, prefix="/api/call")
app.include_router(calendar_router, prefix="/api/calendar")
app.include_router(ws_router)


@app.get("/health", tags=["health"])
async def health() -> dict:
    return {"status": "ok", "env": settings.app_env}
