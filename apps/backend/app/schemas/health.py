from pydantic import BaseModel

class HealthResponse(BaseModel):
    status: str
    service: str
    version: str

class ReadinessResponse(BaseModel):
    status: str
    database: str

class VersionResponse(BaseModel):
    version: str
    environment: str
