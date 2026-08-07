# Resolve-AI System Architecture & Technical Specification

Resolve-AI is an enterprise-grade, multi-agent autonomous customer dispute resolution platform. Built as a monorepo, it guarantees independent module development, continuous integration, and seamless scaling.

---

## 1. Domain Component Architecture

```
Resolve-AI/
├── apps/
│   ├── frontend/             # Single-Page Web Dashboard (React + TypeScript + Tailwind)
│   ├── backend/              # Core API Gateway (FastAPI + SQLAlchemy)
│   └── ai_engine/            # LangGraph multi-agent decision orchestrator
└── libs/
    └── db_shared/            # Data Layer (PostgreSQL Models & Repository Pattern)
```

---

## 2. Multi-Agent System Design

The system runs a **LangGraph StateGraph** that encapsulates customer dispute workflows. The nodes represent specialized AI agents:

### Agent Directories & Skeleton Files
For every agent (e.g. `interaction/`, `evidence/`), files are structured consistently:
- `agent.py`: Agent execution node taking and returning state updates.
- `prompts.py`: Systems instructions and few-shot formatting.
- `tools.py`: Actions annotated with `@tool` (e.g. database querying, document retrieval).
- `models.py`: Input/Output Pydantic data schemas.
- `validators.py`: Custom logic verifying response compliance.
- `tests/`: Isolated agent unit tests.

### 8 Core AI Agents
1. **Customer Interaction Agent**: Intent classification, complaint parsing, sentiment monitoring.
2. **Evidence Verification Agent**: Multi-modal vision analysis, invoices OCR extraction.
3. **Policy Intelligence Agent**: Dynamic policy reasoning matching claims with warranties/SLAs via RAG.
4. **Fraud Detection Agent**: ML-driven behavioral heuristics and anomaly evaluations.
5. **Resolution Strategy Agent**: Recommends appropriate action strategies balancing policy compliance and customer LTV.
6. **Workflow Execution Agent**: Integrates with ERP, CRM, and Stripe APIs to perform actions automatically.
7. **Escalation Agent**: Holds execution path and passes state details to the dashboard for manual human agent review.
8. **Learning Agent**: Distills closed cases into vector embeddings to optimize future decision graphs.

---

## 3. Data & State Pipeline Flow

### User Interaction & Transactional Pipeline
```
[React Dashboard] ──(REST API)──► [FastAPI Backend] ──► [PostgreSQL] (Record created)
                                      │
                               (Async Spawn)
                                      ▼
                             [LangGraph Engine]
                                      │
       ┌──────────────────────────────┼──────────────────────────────┐
       ▼                              ▼                              ▼
 [OCR & Vision]                 [Fraud Agent]                 [RAG retrieval]
 (Evidence extraction)        (Anomaly evaluate)             (Warranty checks)
       │                              │                              │
       └──────────────────────────────┼──────────────────────────────┘
                                      ▼
                         [Resolution Strategy Agent]
                                      │
                     ┌────────────────┴────────────────┐
                     ▼                                 ▼
             [Auto Execution]                [Escalation Agent]
          (Stripe / ERP refunds)         (Flag for manual approval)
```

### LangGraph Interruption (Human-in-the-Loop)
If a dispute requires human confirmation (e.g. claim amount exceeds $1,000 or fraud score > 70%), the graph triggers an interruption checkpoint:
1. `EscalationAgent` flags `human_action_required = True`.
2. Graph halts execution and writes state checkpointing to **Redis**.
3. State is exposed to human review page on **React Frontend** via FastAPI `/api/v1/disputes/{id}` endpoint.
4. When a human reviews and approves/rejects, a POST request resumes the graph thread from the checkpoint.

---

## 4. RAG Knowledge Ingestion
- **Document Ingestion**: Parsing SLA and warranty PDFs into clean text chunks.
- **Embedding Generation**: Text chunks converted to dense vectors using Google Gemini Embeddings.
- **Vector Indexing**: Stored in a database (FAISS / ChromaDB).
- **Retrieval System**: Semantic query processing matching customer complaint intents with corresponding warranty clauses.

---

## 5. Deployment and Observability
- **Containerization**: Separate Docker containers for frontend, backend, and agent engines.
- **Orchestration**: Kubernetes manifests for deployments, configurations, and internal routing.
- **Monitoring**: OpenTelemetry traces, Prometheus metrics, and Grafana dashboard indicators.
