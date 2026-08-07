# Resolve-AI: Enterprise Autonomous Customer Dispute Resolution Platform

**Resolve-AI** is an enterprise-grade, multi-agent AI system built with **LangGraph**, **FastAPI**, **React**, **PostgreSQL/SQLite**, and **RAG (Retrieval-Augmented Generation)**. It automates customer claim processing, OCR evidence analysis, hybrid fraud detection, policy evaluation, and decision synthesis with Explainable AI reasoning and Human-in-the-Loop approval workflows.

---

## 🌟 Key Platform Features

1. **Multi-Agent LangGraph Orchestration**:
   - **Customer Interaction Agent**: NLP intent classification & category extraction.
   - **Evidence Verification Agent**: Vision AI & OCR invoice/receipt extraction.
   - **Fraud Detection Agent**: Hybrid fraud risk heuristics & anomaly scoring.
   - **Policy Intelligence Agent**: ChromaDB RAG similarity search matching company policies.
   - **Resolution Strategy Agent**: Explainable decision synthesis with confidence scoring.
   - **Workflow Execution Agent**: Integrates with ERP, CRM, and Payment Gateway APIs.
   - **Human Approval Agent**: Routes high-risk claims (>60% fraud or low confidence) to admin queue.
   - **Learning Agent**: Refines future graph weights via historical case storage.

2. **Explainable AI (XAI)**:
   - Every resolution decision provides an audit summary showing the exact policy clause reference, OCR evidence match, fraud risk breakdown, and confidence percentage.

3. **Hackathon Demo Scenarios**:
   - **Scenario 1 (Damaged Product)**: "My smartphone screen arrived cracked" -> Vision AI verifies fracture -> Policy RAG approves replacement -> Auto-dispatched.
   - **Scenario 2 (Repeat Fraud Claim)**: Customer with 5 previous claims -> Fraud Agent flags 88% risk -> Escalated to Human Admin Approval Queue.
   - **Scenario 3 (Wrong Product)**: Fulfillment error verified via packing scan log -> Auto-refund approved.

---

## 📂 Project Architecture

```
Resolve-AI/
├── apps/
│   ├── frontend/             # React + TypeScript + Tailwind CSS UI
│   ├── backend/              # FastAPI REST API Gateway & Authentication
│   └── ai_engine/            # LangGraph multi-agent state graph engine
├── libs/
│   └── db_shared/            # Dual SQLite/PostgreSQL models & repository pattern
├── deployment/               # Dockerfiles, Docker-Compose, Kubernetes manifests
├── monitoring/               # Prometheus & Grafana configuration targets
├── docs/                     # Platform architecture specification & diagrams
├── seed_demo.py              # Instant demo database reset & seeder
├── pyproject.toml            # Poetry monorepo workspace configuration
├── package.json              # Frontend workspace dependencies
└── Makefile                  # Shortcut commands for running services
```

---

## 🚀 Quick Start Instructions

### 1. Initialize & Seed Demo Database
```bash
python seed_demo.py
```

### 2. Run AI Engine Test Workflow
```bash
python apps/ai_engine/main.py
```

### 3. Launch Backend API Gateway
```bash
poetry run uvicorn apps.backend.app.main:app --reload --port 8000
```
*API Swagger Documentation will be available at: [http://localhost:8000/docs](http://localhost:8000/docs)*

### 4. Launch React SaaS Frontend
```bash
npm run frontend:dev
```
*Frontend Portal will be available at: [http://localhost:3000](http://localhost:3000)*

---

## 🛡️ License & Copyright
© 2026 Resolve-AI Systems, Inc. All rights reserved.
