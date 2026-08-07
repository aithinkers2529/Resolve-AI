from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from app.api.v1 import disputes, auth, health, cases, customers, orders, evidence, admin, escalations, analytics, learning_routes, assistant, uploads
from app.services.health_service import HealthService
from libs.db_shared.session import get_db
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.exceptions import (
    ResolveAIException,
    resolve_ai_exception_handler,
    unhandled_exception_handler
)
from app.middleware.request_id import RequestIDMiddleware
from app.middleware.audit import AuditLoggingMiddleware
from app.core.logging import setup_logging

# Setup Logging
setup_logging()

app = FastAPI(
    title=settings.APP_NAME,
    description="Backend API Gateway for Enterprise Dispute Resolution Platform",
    version=settings.APP_VERSION,
    debug=settings.DEBUG
)

# Static Files Directory for Evidence Uploads
UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Exception Handlers
app.add_exception_handler(ResolveAIException, resolve_ai_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)

# Middleware Pipeline
app.add_middleware(RequestIDMiddleware)
app.add_middleware(AuditLoggingMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers (Legacy & Backwards Compatible)
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(disputes.router, prefix="/api/v1/disputes", tags=["Disputes"])

# Include Routers (New Layered API Foundation)
app.include_router(uploads.router, prefix="/api/v1/disputes", tags=["Uploads"])
app.include_router(uploads.router, prefix="/api/v1/uploads", tags=["Uploads"])
app.include_router(health.router, prefix="/api/v1", tags=["System Status"])
app.include_router(cases.router, prefix="/api/v1/cases", tags=["Cases"])
app.include_router(customers.router, prefix="/api/v1/customers", tags=["Customers"])
app.include_router(orders.router, prefix="/api/v1/orders", tags=["Orders"])
app.include_router(evidence.router, prefix="/api/v1/cases", tags=["Evidence"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin User Management"])
app.include_router(escalations.router, prefix="/api/v1/escalations", tags=["Human Escalation & Approval"])
app.include_router(analytics.router, prefix="/api/v1/admin/analytics", tags=["Executive Analytics"])
app.include_router(learning_routes.router, prefix="/api/v1/admin/learning", tags=["Learning & Memory"])
app.include_router(assistant.router, prefix="/api/v1/assistant", tags=["Agentic AI Support Assistant"])

# Production Health Observability Endpoints
@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    hs = HealthService(db)
    return hs.get_full_health_status()

@app.get("/health/database")
def health_db(db: Session = Depends(get_db)):
    hs = HealthService(db)
    return hs.check_database()

@app.get("/health/redis")
def health_redis():
    return {"status": "HEALTHY", "cache": "ACTIVE", "type": "IN_MEMORY_REDIS_MOCK"}

@app.get("/health/ai")
def health_ai(db: Session = Depends(get_db)):
    hs = HealthService(db)
    return hs.check_ai_engine()

@app.get("/health/services")
def health_services(db: Session = Depends(get_db)):
    hs = HealthService(db)
    return hs.get_full_health_status()

@app.get("/api/v1/admin/system/health")
def admin_system_health(db: Session = Depends(get_db)):
    hs = HealthService(db)
    return hs.get_full_health_status()

@app.get("/api/v1/admin/system/errors")
def admin_system_errors(db: Session = Depends(get_db)):
    hs = HealthService(db)
    return hs.get_recent_errors()
