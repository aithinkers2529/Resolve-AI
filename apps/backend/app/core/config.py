import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Resolve-AI"
    VERSION: str = "1.0.0"
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]
    
    # Database Settings
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/resolve_ai")
    
    # Redis Cache Settings
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # JWT Secrets
    SECRET_KEY: str = os.getenv("SECRET_KEY", "SUPER_SECRET_SECURITY_KEY_FOR_ENTERPRISE_RESOLVE_AI")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    # Vector DB
    CHROMA_DB_PATH: str = os.getenv("CHROMA_DB_PATH", "chroma_db")

    class Config:
        case_sensitive = True

settings = Settings()
