# Phase 4 — Multimodal Evidence & Policy RAG Reasoning Engine

## Objective
Phase 4 upgraded the dispute investigation engine with multimodal evidence processing (Photos, Invoices, Documents), deterministic order correlation, weighted evidence confidence scoring, policy RAG knowledge retrieval with explicit clause citations, and policy conflict detection.

---

## 1. Multimodal Evidence Architecture

```
                                  [Customer Claim Intake]
                                             │
                                             ▼
                             [Multimodal Evidence Collection]
                           (Uploaded Photos + Invoices + Messages)
                                             │
                                             ▼
                              [Evidence Normalizer & Quality Check]
                             (Validate MIME, Size, Schema Normalization)
                                             │
                                             ▼
                       ┌─────────────────────┴─────────────────────┐
                       ▼                                           ▼
             [Image Evidence Analyzer]                  [Document/Invoice Extractor]
          (Object, damage, severity, relevance)        (Invoice #, Order ID, SKU, Amount)
                       │                                           │
                       └─────────────────────┬─────────────────────┘
                                             │
                                             ▼
                          [Evidence-to-Order Correlation Engine]
                     (Matches Invoice & Image data vs Database Orders)
                                             │
                                             ▼
                           [Deterministic Evidence Confidence]
                     (Weighted signals: Order, Product, Doc, Image)
                                             │
                                             ▼
                             [Policy RAG Knowledge Base]
                  (Retrieves REFUND-2.1, HIGHVALUE-1.2, WARRANTY-4.2)
                                             │
                                             ▼
                            [Policy Conflict Detection Engine]
                   (Detects conflicts e.g. Return Policy vs >INR 50k Rule)
                                             │
                                             ▼
                               [Multi-Signal Fraud Agent]
                      (Consumes Evidence Consistency & History)
                                             │
                                             ▼
                             [Resolution Strategy & Risk Check]
                                             │
                 ┌───────────────────────────┼───────────────────────────┐
                 ▼                           ▼                           ▼
            [SCENARIO A]                [SCENARIO B]                [SCENARIO C]
             Low Risk                    High Risk                  High Value (>INR 50k)
                 │                           │                           │
                 ▼                           ▼                           ▼
           [AUTO APPROVE]            [HUMAN REVIEW]              [MANUAL VERIFICATION]
                 │                           │                           │
                 └───────────────────────────┼───────────────────────────┘
                                             │
                                             ▼
                         [Multimodal Explainable Decision Passport]
```

---

## 2. Fact / Policy / AI Interpretation Separation
- **FACTS**: Hard ground truth from the enterprise database (Order ID `ORD-58493-29`, SKU `SKU-LAPTOP-PRO-15`, purchase price INR 25,000).
- **EVIDENCE**: Normalized data extracted from customer uploads (Invoice matches order & SKU; photo confirms screen fracture).
- **POLICY**: Corporate rules (`WARRANTY-4.2`, `HIGHVALUE-1.2`, `REFUND-2.1`).
- **AI INTERPRETATION**: Vision AI damage detection (Confidence: 94%).
- **RISK**: Multi-signal fraud assessment (8% Low Risk).
- **DECISION**: `Replacement Authorized`.

---

## 3. Services & Components Implemented
1. **Evidence Normalizer & Quality Check** (`apps/ai_engine/services/evidence_normalizer.py`): Validates file sizes (<15MB), MIME types, and formats evidence items into a standardized `NormalizedEvidence` schema.
2. **Image Evidence Analyzer** (`apps/ai_engine/services/image_analyzer.py`): Performs vision damage detection heuristics, object identification, severity scoring, and claim relevance calculation.
3. **Document / Invoice Extractor** (`apps/ai_engine/services/document_extractor.py`): Extracts invoice number, order ID, product SKU, purchase amount, and verified fields.
4. **Evidence Correlation Engine** (`apps/ai_engine/services/evidence_correlation.py`): Cross-references extracted invoice data against database order facts. Assigns consistency status (`CONSISTENT`, `MOSTLY_CONSISTENT`, `INCONSISTENT`, `INSUFFICIENT_EVIDENCE`).
5. **Deterministic Evidence Confidence Scorer** (`apps/ai_engine/services/evidence_confidence.py`): Weighted signal calculation:
   - `EVIDENCE_ORDER_MATCH_WEIGHT = 0.35`
   - `EVIDENCE_PRODUCT_MATCH_WEIGHT = 0.25`
   - `EVIDENCE_IMAGE_WEIGHT = 0.25`
   - `EVIDENCE_DOCUMENT_WEIGHT = 0.15`
6. **Policy RAG Knowledge Base** (`apps/ai_engine/knowledge/policy_kb.py`): Structured policy repository containing `WARRANTY-4.2`, `REFUND-2.1`, `EXCHANGE-2.3`, `HIGHVALUE-1.2`, and `FRAUD-3.0`.
7. **Policy Citation & Conflict Engine** (`apps/ai_engine/agents/policy/agent.py`): Generates section citations and identifies policy conflicts (e.g. standard return policy permits replacement, but `HIGHVALUE-1.2` mandates manual manager verification for claims >= INR 50,000).

---

## 4. API Endpoints Added
- `GET /api/v1/cases/{id}/evidence-analysis`: Detailed evidence correlation and consistency report.
- `GET /api/v1/cases/{id}/policies`: Policy citations and policy conflict checks.
- `GET /api/v1/cases/{id}/decision-passport`: Multimodal Explainable AI Decision Passport.

---

## 5. Demo Scenarios Verified
- **Scenario A (`DISP-9842`)**: INR 25,000 laptop claim for Sarah Jenkins. Valid photo + invoice. Correlation = `CONSISTENT` (0.95), Policy = `WARRANTY-4.2`. Outcome: **Auto-Approved Replacement**.
- **Scenario B (`DISP-9843`)**: INR 25,000 claim for Alex Rivera (5 past claims). Correlation = `INCONSISTENT`, Fraud = `0.99`. Outcome: **Halted for Human Review** (`Requires_Review`).
- **Scenario C (`DISP-9845`)**: INR 75,000 workstation laptop claim for Elena Rostova. Valid evidence + invoice. Correlation = `CONSISTENT` (0.96). Conflict: `HIGHVALUE-1.2` mandates manual manager verification for claims >= INR 50,000. Outcome: **Policy Conflict Escalation -> Manual Review Required** (`Requires_Review`).

---

## 6. Testing Results
- `test_phase4_multimodal.py`: 100% Passed.
- `test_phase3_agents.py`: 100% Passed.
- `test_deploy_local.py`: 100% Passed.
- `test_auth_rbac.py`: 100% Passed.
