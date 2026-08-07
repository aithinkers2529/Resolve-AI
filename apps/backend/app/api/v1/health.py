from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from libs.db_shared.session import get_db
from app.schemas.health import HealthResponse, ReadinessResponse, VersionResponse
from app.core.config import settings

router = APIRouter()

@router.get("/health", response_model=HealthResponse)
def get_health():
    """Unauthenticated health status verification."""
    return HealthResponse(
        status="healthy",
        service=settings.APP_NAME,
        version=settings.APP_VERSION
    )

@router.get("/ready", response_model=ReadinessResponse)
def get_readiness(db: Session = Depends(get_db)):
    """Readiness probe verifying DB connection pool connectivity."""
    try:
        # Perform simple low-cost query check
        db.execute(text("SELECT 1"))
        return ReadinessResponse(status="ready", database="connected")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection pool unavailable"
        )

@router.get("/version", response_model=VersionResponse)
def get_version():
    """Retrieves deployment environmental runtime details."""
    return VersionResponse(
        version=settings.APP_VERSION,
        environment=settings.ENVIRONMENT
    )
