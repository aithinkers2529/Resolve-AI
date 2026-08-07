from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import disputes, auth
from app.core.config import settings

app = FastAPI(
    title="Resolve-AI API Gate",
    description="Backend API Gateway for Enterprise Dispute Resolution Platform",
    version="1.0.0",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(disputes.router, prefix="/api/v1/disputes", tags=["Disputes"])

@app.get("/health")
def health_check():
    return {"status": "healthy", "version": settings.VERSION}
