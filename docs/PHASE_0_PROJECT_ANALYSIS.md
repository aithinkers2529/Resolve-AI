# Resolve-AI Existing Project Analysis

This document provides a comprehensive analysis of the existing codebase in `E:\NeuroBots-Hackathon\Resolve-AI`, detailing current implementations, partial capabilities, architectural gaps, and the recommended roadmap.

---

## 1. Current Project Structure

The project is structured as a monorepo containing application modules, shared libraries, infrastructure definitions, and root-level orchestration scripts:

```
Resolve-AI/
├── apps/
│   ├── ai_engine/            # Multi-agent graph orchestrator and agent modules
│   │   ├── agents/           # 8 Agent subdirectories (interaction, evidence, fraud, policy, resolution, workflow, escalation, learning)
│   │   ├── graph/            # LangGraph state graph definitions, state.py, routing.py, recovery.py
│   │   ├── knowledge/        # RAG pipeline, OCR, embedding, vector store abstraction
│   │   └── main.py           # Standalone AI orchestrator test runner
│   ├── backend/              # FastAPI backend API Gateway
│   │   └── app/
│   │       ├── api/v1/       # Routers (auth.py, disputes.py)
│   │       ├── core/         # Settings (config.py), Security JWT (security.py)
│   │       ├── middleware/   # Audit logging and PII masking middleware (audit.py)
│   │       ├── schemas/      # Pydantic validation schemas (dispute.py)
│   │       └── main.py       # FastAPI application entrypoint
│   └── frontend/             # Single-Page Application (React 18 + TypeScript + Vite + Tailwind)
│       └── src/
│           ├── App.tsx       # Main dashboard & customer portal UI component
│           ├── services/     # Axios REST client (api.ts)
│           └── types/        # TypeScript interfaces (index.ts)
├── libs/
│   └── db_shared/            # Shared Database Abstraction Layer
│       ├── models/           # SQLAlchemy ORM entities (user.py, dispute.py, agent_log.py, audit.py)
│       ├── repositories/     # Repository pattern data access (dispute_repo.py)
│       ├── base.py           # SQLAlchemy Base class
│       └── session.py        # Dual PostgreSQL / SQLite engine session manager
├── deployment/               # Containerization & Kubernetes (Dockerfile.frontend, Dockerfile.backend, docker-compose.yml, k8s/)
├── docs/                     # System architecture specification (architecture.md)
├── monitoring/               # Prometheus & Grafana configurations
├── generate_ai_engine.py    # Code generation helper for agent skeletons
├── seed_demo.py              # Database seeding script for demo scenarios
├── test_deploy_local.py      # Automated deployment and verification script
├── package.json              # Monorepo NPM workspace configuration
├── pyproject.toml            # Monorepo Python dependencies (Poetry format)
└── Makefile                  # Developer shortcut commands
```

---

## 2. Existing Backend

The backend is built with **FastAPI** located in `apps/backend/app/`.

### Key Files:
- [main.py](file:///e:/NeuroBots-Hackathon/Resolve-AI/apps/backend/app/main.py): Initializes FastAPI, CORS middleware, and includes routers for `auth` and `disputes`.
- [config.py](file:///e:/NeuroBots-Hackathon/Resolve-AI/apps/backend/app/core/config.py): BaseSettings class loading environment variables (Database URL, Redis URL, JWT Secret).
- [security.py](file:///e:/NeuroBots-Hackathon/Resolve-AI/apps/backend/app/core/security.py): Password hashing (passlib/bcrypt) and JWT creation.
- [audit.py](file:///e:/NeuroBots-Hackathon/Resolve-AI/apps/backend/app/middleware/audit.py): Audit logging middleware with regex PII masking for emails and credit cards.
- [disputes.py](file:///e:/NeuroBots-Hackathon/Resolve-AI/apps/backend/app/api/v1/disputes.py): REST endpoints for complaints, agent execution, dashboard stats, resolution retrieval, and human approval/rejection.
- [auth.py](file:///e:/NeuroBots-Hackathon/Resolve-AI/apps/backend/app/api/v1/auth.py): Mock user registration and token generation endpoints.

---

## 3. Existing Frontend

The frontend is a **React 18 + TypeScript + Tailwind CSS** app located in `apps/frontend/`.

### Key Files:
- [App.tsx](file:///e:/NeuroBots-Hackathon/Resolve-AI/apps/frontend/src/App.tsx): Single monolithic component containing:
  - Top Banner Navigation with View Switcher (Admin Dashboard vs Customer Portal).
  - Quick Hackathon Demo Scenario toolbar (Scenario 1: Broken Phone, Scenario 2: Fraud Alert, Scenario 3: Wrong Product).
  - Admin Dashboard KPI cards, Active Claims list, Explainable AI Decision card, and 4-step Agent execution trace.
  - Customer Portal complaint submission form.
- [api.ts](file:///e:/NeuroBots-Hackathon/Resolve-AI/apps/frontend/src/services/api.ts): Axios client wrapper connecting to `/api/v1/disputes`.
- [index.ts](file:///e:/NeuroBots-Hackathon/Resolve-AI/apps/frontend/src/types/index.ts): TypeScript type definitions for `Dispute`, `AgentLog`, `Message`.

---

## 4. Existing Database

The data layer uses **SQLAlchemy 2.0** located in `libs/db_shared/`.

### Storage & Engine:
- Dual PostgreSQL / SQLite engine in `session.py`. Automatically falls back to `sqlite:///./resolve_ai_demo.db` if `DATABASE_URL` is not provided.
- `Base` declarative base class in `base.py`.

### ORM Models (`libs/db_shared/models/`):
- `User` ([user.py](file:///e:/NeuroBots-Hackathon/Resolve-AI/libs/db_shared/models/user.py)): `id`, `email`, `hashed_password`, `full_name`, `is_active`, `role`.
- `Dispute` ([dispute.py](file:///e:/NeuroBots-Hackathon/Resolve-AI/libs/db_shared/models/dispute.py)): `id`, `customer_id`, `customer_name`, `customer_email`, `order_id`, `category`, `claim_amount`, `complaint_text`, `status`, `fraud_score`, `fraud_risk_level`, `fraud_reasons` (JSON), `policy_eligible`, `policy_reference`, `policy_notes`, `evidence_urls` (JSON), `evidence_summary` (JSON), `ocr_text`, `resolution_action`, `resolution_reason`, `confidence`, `customer_history_count`.
- `AgentLog` ([agent_log.py](file:///e:/NeuroBots-Hackathon/Resolve-AI/libs/db_shared/models/agent_log.py)): `id`, `dispute_id`, `agent_name`, `action_taken`, `log_details`, `created_at`.
- `AuditLog` ([audit.py](file:///e:/NeuroBots-Hackathon/Resolve-AI/libs/db_shared/models/audit.py)): `id`, `operator`, `action`, `ip_address`, `details`, `created_at`.

---

## 5. Existing Agents

Located in `apps/ai_engine/agents/`. Each agent has a standard folder structure containing `agent.py`, `prompts.py`, `tools.py`, `models.py`, `validators.py`, and `tests/test_agent.py`.

1. **Customer Interaction Agent**: Intent classification and category extraction via keyword rules.
2. **Evidence Verification Agent**: Simulated Vision / OCR parsing of uploaded files.
3. **Fraud Detection Agent**: Heuristic rule calculations based on claim frequency, claim value, and email patterns.
4. **Policy Intelligence Agent**: Policy matching via in-memory list in `knowledge/rag_pipeline.py`.
5. **Resolution Strategy Agent**: Decision synthesis combining evidence, fraud score, and policy status.
6. **Workflow Execution Agent**: Simulates enterprise API log generation for refunds, replacements, or rejections.
7. **Human Approval Agent**: Halts execution state and sets `human_approval_required = True`.
8. **Learning Agent**: Log recorder for completed dispute cases.

---

## 6. Existing APIs

Backend REST API endpoints in `apps/backend/app/api/v1/disputes.py` & `auth.py`:
- `POST /api/v1/auth/register`: Mock user registration.
- `POST /api/v1/auth/token`: Mock OAuth2 password form login.
- `GET /api/v1/disputes/` / `/api/v1/disputes/complaints`: Returns all disputes.
- `GET /api/v1/disputes/{id}` / `/api/v1/disputes/complaints/{id}`: Returns dispute details.
- `POST /api/v1/disputes/` / `/api/v1/disputes/complaints/create`: Submits a complaint, triggers `app_graph.ainvoke`, updates DB, and saves agent logs.
- `POST /api/v1/disputes/agent/process/{complaint_id}`: Re-runs the multi-agent graph against an existing dispute.
- `GET /api/v1/disputes/dashboard/stats`: Returns KPI analytics dictionary.
- `GET /api/v1/disputes/agents/status`: Returns status list of 8 agents.
- `GET /api/v1/disputes/resolution/{complaint_id}`: Returns Explainable AI breakdown dictionary.
- `POST /api/v1/disputes/{id}/approve` & `POST /api/v1/disputes/{id}/reject`: Human approval override controllers.

---

## 7. Existing Mock Enterprise Services

Currently, enterprise API operations (Refunds, Shipping, Inventory, CRM) are simulated via inline log strings in `WorkflowAgent.execute()` (`apps/ai_engine/agents/workflow/agent.py`). Standalone mock services (e.g. `OrderService`, `PaymentService`, `InventoryService`, `ShippingService`, `NotificationService`) do not exist as dedicated classes or endpoints.

---

## 8. Existing Authentication

- Basic password hashing routines in `apps/backend/app/core/security.py` using `passlib` bcrypt and `python-jose` for JWTs.
- `POST /api/v1/auth/token` returns a static bearer token string without validating against the database.
- Backend API endpoints are unauthenticated (they do not enforce `Depends(get_current_user)` or RBAC role checks).

---

## 9. Existing Configuration

- `apps/backend/app/core/config.py` defines `Settings` reading `DATABASE_URL`, `REDIS_URL`, `SECRET_KEY`, `CHROMA_DB_PATH`.
- Missing configuration fields: `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_KEY`, `OPENTELEMETRY_ENDPOINT`.

---

## 10. Existing Monitoring

- Basic OpenTelemetry / Prometheus dependencies declared in `pyproject.toml`.
- Configuration files in `monitoring/prometheus/prometheus.yml` and `monitoring/grafana/datasources.yml`.
- Active OpenTelemetry instrumentation code is not wired inside FastAPI middleware or LangGraph nodes.

---

## 11. Working Components

1. **Dual DB Engine**: SQLite fallback (`resolve_ai_demo.db`) works cleanly without external PostgreSQL dependencies.
2. **Demo Seeding Script**: `seed_demo.py` successfully seeds 3 demo scenarios and agent logs.
3. **Automated Integration Test Runner**: `test_deploy_local.py` boots backend, seeds DB, tests APIs, verifies Explainable AI output, and installs frontend dependencies.
4. **LangGraph State Graph Execution**: Multi-agent state machine executes 7 sequential agents cleanly (`python apps/ai_engine/main.py`).
5. **FastAPI Endpoints**: CRUD endpoints for complaints, agent triggers, stats, and resolution summaries respond correctly.

---

## 12. Partially Working Components

1. **AI Agents**: Implement rule-based heuristic checks instead of actual Gemini LLM prompt calls.
2. **Policy RAG**: Uses hardcoded Python list matching (`POLICIES_DATABASE` in `rag_pipeline.py`) rather than vector embeddings in ChromaDB / pgvector.
3. **Frontend Dashboard**: Visualizes agent traces and complaints, but relies on a single monolithic `App.tsx` file without routing or dedicated pages.
4. **OCR & Evidence Processing**: Performs text matching on category strings rather than running Gemini Vision or OCR on actual image files.

---

## 13. Broken Components

None currently broken. The local deployment test (`python test_deploy_local.py`) runs with 0 errors.

---

## 14. Missing Components

1. **Case Coordinator Agent**: Dedicated orchestrator agent managing parallel investigation nodes.
2. **Challenge Agent**: Verification agent that validates resolution decisions prior to execution.
3. **Dedicated Mock Enterprise APIs**: Standalone service modules for Order, Payment/Refund, Inventory, Shipping, and Notification APIs.
4. **Gemini API Integration**: `google.generativeai` client wiring for LLM reasoning and Vision analysis.
5. **Standalone DB Entities**: Individual SQL tables for `Evidence`, `Transaction`, `FraudAnalysis`, `PolicyResult`, `Resolution` (currently merged as JSON fields in `Dispute`).
6. **JWT Authentication & RBAC Middleware**: Protection layer enforcing `Customer`, `Admin`, and `Support_Agent` roles on API endpoints.
7. **Recharts Visualizations**: Analytics charts in Admin Dashboard.

---

## 15. Reusable Components

- All 8 existing agent directory skeletons in `apps/ai_engine/agents/`.
- LangGraph state machine definitions in `apps/ai_engine/graph/`.
- Dual SQLite/Postgres DB session architecture in `libs/db_shared/session.py`.
- Seed data script `seed_demo.py` and test runner `test_deploy_local.py`.
- Tailwind design system and CSS utilities in `apps/frontend/`.

---

## 16. Components Requiring Modification

- `apps/ai_engine/agents/*/agent.py`: Enhance heuristic rules with Gemini LLM calls and structured tool usage.
- `apps/ai_engine/knowledge/rag_pipeline.py`: Wire vector embeddings via ChromaDB / pgvector.
- `apps/backend/app/api/v1/disputes.py`: Add authentication dependencies and connect to mock enterprise APIs.
- `apps/frontend/src/App.tsx`: Modularize into distinct page components (`CustomerPortal`, `AdminDashboard`, `ComplaintDetails`, `ExplainableAIView`).

---

## 17. Dependency Analysis

- Python: Global Python 3.13.9 + pip 25.3. Dependencies declared in `pyproject.toml` (FastAPI, SQLAlchemy, LangChain, LangGraph, Pydantic, Uvicorn).
- Frontend: Node.js packages in `apps/frontend/package.json` (React 18, Vite 5, Tailwind 3, Lucide-React, Axios).
- **Rule Compliance**: Poetry is NOT required for execution. Standard `pip` and `python -m uvicorn` commands operate cleanly.

---

## 18. Database Analysis

- SQLite database `resolve_ai_demo.db` provides robust local persistence.
- Table schema includes `users`, `disputes`, `agent_logs`, `audit_logs`.
- To support complex digital twin history, separate tables for `transactions` and `evidence_items` can be added while retaining SQLite compatibility.

---

## 19. Agent Architecture Gap Analysis

| Agent Name | Prompt Spec Status | Current Implementation Status | Gap |
| :--- | :--- | :--- | :--- |
| Customer Interaction Agent | Required | Functional Heuristics | Add Gemini LLM intent extraction |
| Case Coordinator Agent | Required | Missing (Implicit in Graph) | Create explicit coordinator node |
| Evidence Verification Agent | Required | Functional Mock | Integrate Gemini Vision API |
| Policy Intelligence Agent | Required | In-Memory List RAG | Connect ChromaDB vector index |
| Fraud Detection Agent | Required | Functional Heuristics | Expand digital twin history rules |
| Resolution Strategy Agent | Required | Functional Decision Tree | Add Explainable Passport synthesis |
| Workflow Execution Agent | Required | Log Strings | Connect to Mock Enterprise APIs |
| Escalation Agent | Required | Functional Interruption | Connect to Admin Approval Queue |
| Case Memory / Learning Agent | Required | Functional Log Recorder | Persist case resolution vectors |
| Challenge Agent | Optional | Missing | Add verification node |

---

## 20. Security Gap Analysis

- API Endpoints currently lack JWT authorization checks.
- Least-privilege agent tool scoping needs formal tool function wrappers (e.g. Fraud Agent tool cannot execute refunds).

---

## 21. API Gap Analysis

- Missing standalone `/api/v1/mock/orders`, `/api/v1/mock/payments`, `/api/v1/mock/inventory`, `/api/v1/mock/shipping` endpoints.

---

## 22. Frontend Gap Analysis

- `App.tsx` contains 450+ lines combining Customer and Admin views. Needs separation into modular page files.
- Recharts integration needed for analytics graphs.

---

## 23. Integration Gap Analysis

- Integration between FastAPI background tasks and LangGraph execution is currently synchronous inside the API thread. Can be optimized for asynchronous streaming responses.

---

## 24. Risks

1. **External Dependency Failure**: Over-relying on live Gemini API calls could cause latency or quota failures during live hackathon demos.
   *Mitigation*: Retain fast, fallback heuristic logic alongside Gemini API calls.
2. **Schema Drift**: Deleting SQLite DB files could break local demo states.
   *Mitigation*: Ensure `seed_demo.py` always recreates full test states.

---

## 25. Recommended Implementation Order

1. **Phase 1**: Core Data Layer Enhancement & Mock Enterprise APIs.
2. **Phase 2**: Multi-Agent State Machine Refinement & Gemini LLM / Vision Integration.
3. **Phase 3**: RAG Policy Vector Database (ChromaDB) Setup.
4. **Phase 4**: Security, JWT Auth & Least-Privilege Agent Tools.
5. **Phase 5**: Modular Frontend Expansion (Customer Portal + Admin Dashboard + Recharts).
6. **Phase 6**: Verification & Demo Packaging.

---

## 26. Phase 1 Requirements

- Create dedicated Mock Enterprise API Services (`apps/backend/app/services/mock_enterprise.py`) for Order, Payment/Refund, Inventory, Shipping, and Notifications.
- Expand Database ORM models (`libs/db_shared/models/`) to include `Transaction` and `EvidenceItem`.
- Update `seed_demo.py` to seed Indian rupee demo transactions (e.g. ₹25,000 laptop claim for Scenario 1).
- Enforce JWT authentication on API endpoints.
