# Phase 1 — Backend Foundation

## Objective
The primary objective of Phase 1 was to establish the complete backend foundation for Resolve-AI, implementing a strict 4-tier layered architecture (**API Gateway → Business Service → Repository Layer → Database ORM**) using FastAPI, Pydantic, and SQLAlchemy, with SQLite compatibility for local testing and PostgreSQL compatibility for production.

---

## Existing Architecture Reused
- **FastAPI Gateway**: Enhanced the existing FastAPI setup in `apps/backend/app/` while maintaining backwards compatibility with legacy routes (`/health`, `/api/v1/disputes/*`).
- **Shared DB Layer**: Integrated with the declarative base and DB session in `libs/db_shared/` (dynamically falls back to SQLite `resolve_ai_demo.db`).
- **Agent Integrations**: Preserved automated invocation of the LangGraph orchestrator inside the case creation flow.

---

## Backend Structure
```
apps/backend/app/
├── api/v1/
│   ├── cases.py            # Case creation, retrieval, listing REST API
│   ├── customers.py        # Customer lookup API
│   ├── orders.py           # Order lookup API
│   ├── evidence.py         # Case evidence upload & fetch API
│   ├── health.py           # Health, readiness, version checks
│   ├── auth.py             # Backwards compatible auth router
│   └── disputes.py         # Backwards compatible disputes router
├── core/
│   ├── config.py           # Centralized configuration (BaseSettings)
│   ├── exceptions.py       # Custom exceptions & global HTTP handler
│   └── logging.py          # Structured stdout application logger
├── middleware/
│   └── request_id.py       # X-Request-ID trace middleware
├── schemas/
│   ├── health.py           # Health & readiness schemas
│   ├── customer.py         # Customer schemas
│   ├── order.py            # Order & Product schemas
│   ├── case.py             # Case schemas
│   ├── evidence.py         # Evidence schemas
│   ├── resolution.py       # Resolution schemas
│   └── agent_run.py        # AgentRun schemas
├── services/
│   ├── case_service.py     # Dispute case coordinator service
│   ├── customer_service.py # Customer operations service
│   ├── order_service.py    # Order retrieval service
│   └── evidence_service.py # Evidence registration service
└── main.py                 # Core app entrypoint with middleware pipeline
```

---

## Configuration
Managed in `apps/backend/app/core/config.py` using Pydantic `BaseSettings`:
- `APP_NAME` & `APP_VERSION`
- `ENVIRONMENT` & `DEBUG`
- `DATABASE_URL` (dynamic SQLite/PostgreSQL)
- `CORS_ORIGINS` (lists allowed origins)
- `SECRET_KEY`, `ALGORITHM`, `GEMINI_API_KEY`, `REDIS_URL`

---

## Database Architecture
The data access layer consists of declarative models in `libs/db_shared/models/` and repository classes in `libs/db_shared/repositories/`:

### Models:
1. **User** (`user.py`): Identity, password hash, and roles.
2. **Customer** (`customer.py`): Account history, risk rating.
3. **Product** (`product.py`): SKU, item category, price, warranty.
4. **Order** (`order.py`): Transactions linked to products and customers.
5. **Dispute** (`dispute.py`): Digital twin representing case details, fraud levels, and resolutions.
6. **EvidenceItem** (`evidence.py`): File attachments, OCR results, and detection metadata.
7. **PolicyRule** (`policy.py`): Retrieved warranty and coverage rules.
8. **FraudAssessment** (`fraud.py`): Fraud heuristics risk score and reasoning tags.
9. **ResolutionRecord** (`resolution.py`): Explanations and authorized refunds/replacements.
10. **AgentRun** (`agent_run.py`): Orchestration step history.
11. **AuditLog** (`audit.py`): Security records of operator operations.

### Relationships:
```
Customer ──► Order ──► Product
Customer ──► Dispute ──► EvidenceItem
Dispute ──► FraudAssessment
Dispute ──► ResolutionRecord
Dispute ──► AgentRun
Dispute ──► AuditLog
```

---

## API Architecture
RESTful interfaces are versioned under `/api/v1/`:
- `GET /api/v1/health`: Basic system check (unauthenticated)
- `GET /api/v1/ready`: Connection status to SQLite/PostgreSQL
- `GET /api/v1/version`: API version details
- `POST /api/v1/cases`: Case creation (triggers LangGraph auto-analyses)
- `GET /api/v1/cases/{id}`: Dispute detail retrieval
- `GET /api/v1/customers/{id}`: Customer details
- `GET /api/v1/orders/{id}`: Order items and amounts
- `POST /api/v1/cases/{id}/evidence`: Attachment registrations
- `GET /api/v1/cases/{id}/evidence`: Fetch registered attachments

---

## Service Layer
Pure business functions orchestrating repository operations:
- `CaseService`: Coordinates case creations, invokes LangGraph pipelines, and commits logs/outcomes.
- `CustomerService`: Exposes customer lookup checks.
- `OrderService`: Exposes order query lookups.
- `EvidenceService`: Registers file details and appends items to active cases.

---

## Repository Layer
Pure SQLAlchemy database interactions:
- `CustomerRepository`: Customer lookups.
- `OrderRepository`: Order & Product lookups.
- `DisputeRepository`: Dispute CRUD and log listings.
- `EvidenceRepository`: Evidence insertions.

---

## Error Handling
Centralized FastAPI exception handling defined in `core/exceptions.py`.
Custom exceptions like `CaseNotFoundException` map to standard client response formats:
```json
{
  "success": false,
  "error": {
    "code": "CASE_NOT_FOUND",
    "message": "Dispute case 'DISP-XXXX' was not found."
  }
}
```

---

## Logging
Structured standard logging setup in `core/logging.py`. Audit middleware handles automatic request/response logging and masks sensitive identifiers (credit cards, email formats, private keys).

---

## CORS
Configured in `main.py` using `CORSMiddleware` restricted to allowed hosts defined under `settings.CORS_ORIGINS`.

---

## Health Check
- Endpoint: `GET /api/v1/health`
- Requires no authentication or DB connections.

---

## Readiness Check
- Endpoint: `GET /api/v1/ready`
- Evaluates active session pool health via `SELECT 1` query verification.

---

## Testing
Comprehensive integration tests in `test_deploy_local.py` verify imports, health checks, readiness database queries, case creations, customer listings, custom 404 response schemas, and OpenAPI swagger availability.

---

## Commands to Run

### Seed Database
```powershell
python seed_demo.py
```

### Start Backend
```powershell
python -m uvicorn apps.backend.app.main:app --reload --port 8000
```

### Run Tests
```powershell
python test_deploy_local.py
```

---

## Environment Variables
- `ENVIRONMENT` (default: `development`)
- `DATABASE_URL` (default: `sqlite:///./resolve_ai_demo.db`)
- `SECRET_KEY` (default: `RESOLVE_AI_ENTERPRISE_SECRET_KEY_2026`)

---

## Files Created
- `libs/db_shared/enums.py`
- `libs/db_shared/models/customer.py`
- `libs/db_shared/models/product.py`
- `libs/db_shared/models/order.py`
- `libs/db_shared/models/evidence.py`
- `libs/db_shared/models/policy.py`
- `libs/db_shared/models/fraud.py`
- `libs/db_shared/models/resolution.py`
- `libs/db_shared/models/agent_run.py`
- `libs/db_shared/repositories/customer_repo.py`
- `libs/db_shared/repositories/order_repo.py`
- `libs/db_shared/repositories/evidence_repo.py`
- `apps/backend/app/core/exceptions.py`
- `apps/backend/app/core/logging.py`
- `apps/backend/app/middleware/request_id.py`
- `apps/backend/app/schemas/health.py`
- `apps/backend/app/schemas/customer.py`
- `apps/backend/app/schemas/order.py`
- `apps/backend/app/schemas/case.py`
- `apps/backend/app/schemas/evidence.py`
- `apps/backend/app/schemas/resolution.py`
- `apps/backend/app/schemas/agent_run.py`
- `apps/backend/app/services/customer_service.py`
- `apps/backend/app/services/order_service.py`
- `apps/backend/app/services/case_service.py`
- `apps/backend/app/services/evidence_service.py`
- `apps/backend/app/api/v1/health.py`
- `apps/backend/app/api/v1/cases.py`
- `apps/backend/app/api/v1/customers.py`
- `apps/backend/app/api/v1/orders.py`
- `apps/backend/app/api/v1/evidence.py`

---

## Files Modified
- `libs/db_shared/models/dispute.py` (added `ocr_text` field)
- `apps/backend/app/core/config.py`
- `apps/backend/app/main.py`
- `seed_demo.py`
- `test_deploy_local.py`
- `task.md`

---

## Known Limitations
- Background task executions are currently handled synchronously. Future enhancements will enable asynchronous task runners.

---

## Phase 2 Preparation
The backend is now prepared for implementing **Authentication, User Registration, JWT validation, and RBAC Permission controls** in Phase 2.
