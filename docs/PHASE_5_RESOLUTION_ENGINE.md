# Phase 5 — Resolution Strategy Agent + Decision Engine

## Objective
Phase 5 introduced the **Resolution Strategy Agent + Explainable Decision Engine** to Resolve-AI. It transforms verified case evidence and policy data into ranked candidate resolution options (`REFUND`, `REPLACEMENT`, `PARTIAL_REFUND`, `COUPON`, `ESCALATION`, `REJECT`), validates them against deterministic business & inventory rules, applies safety decision gate constraints (`AUTO_APPROVED`, `HUMAN_REVIEW`, `REJECTED`), and generates the complete **Resolve-AI Decision Passport**.

---

## 1. Phase 5 Architecture & Decision Pipeline

```
                       [Verified Case Context (Phases 1-4)]
                  (Customer, Order, Evidence, Policy, Fraud)
                                     │
                                     ▼
                     [Resolution Strategy Agent Engine]
                                     │
                                     ▼
                     [Candidate Resolutions Generation]
             (REFUND, REPLACEMENT, PARTIAL_REFUND, COUPON, ESCALATION, REJECT)
                                     │
                                     ▼
                  [Deterministic Eligibility Rules Engine]
              (Policy coverage, Inventory stock, Return window)
                                     │
                                     ▼
                [Transparent Resolution Scoring Engine]
         (Policy 30%, Evidence 20%, Customer 15%, Feasibility 15%,
          Preference 10%, Cost Efficiency 10% - Fraud Safety Penalty)
                                     │
                                     ▼
                  [Best Resolution Selection & Ranking]
              (e.g., Replacement: 95%, Refund: 82%, Partial: 64%)
                                     │
                                     ▼
                       [Deterministic Decision Gate]
         Evaluates: Fraud < 0.60 AND Evidence >= 0.80 AND Confidence >= 0.80
                  AND Claim < 50,000 AND Policy == Eligible
                                     │
             ┌───────────────────────┼───────────────────────┐
             ▼                       ▼                       ▼
      [AUTO_APPROVED]          [HUMAN_REVIEW]            [REJECTED]
             │                       │                       │
             └───────────────────────┼───────────────────────┘
                                     │
                                     ▼
                 [Complete Resolve-AI Decision Passport]
               (Full Audit Trail, Safety Signals & Explanations)
```

---

## 2. Components & Services Implemented
1. **Resolution Types & Schemas** (`apps/ai_engine/agents/resolution/schemas.py`): Enums for `ResolutionType` (`REFUND`, `REPLACEMENT`, `PARTIAL_REFUND`, `COUPON`, `ESCALATION`, `REJECT`) and `DecisionStatus` (`AUTO_APPROVED`, `HUMAN_REVIEW`, `REJECTED`).
2. **Deterministic Rules Engine** (`apps/ai_engine/agents/resolution/rules.py`): Validates candidates against inventory stock (e.g. stock=0 makes `REPLACEMENT` ineligible), return windows, and policy bounds.
3. **Mock Inventory Service** (`apps/backend/app/services/mock_inventory.py`): Real-time stock lookup service (e.g., `SKU-LAPTOP-PRO-15`: 12 items available; `SKU-OUT-OF-STOCK`: 0 items).
4. **Resolution Scoring Engine** (`apps/ai_engine/agents/resolution/scoring.py`): Multi-factor weighted matrix:
   - Policy Compliance (30%)
   - Evidence Confidence (20%)
   - Customer Fit (15%)
   - Operational Feasibility (15%)
   - Customer Preference (10%)
   - Cost Efficiency (10%)
   - Fraud Risk Penalty (up to -50 points for fraud score >= 0.60)
5. **Deterministic Decision Gate** (`apps/ai_engine/decision/decision_gate.py`): Evaluates safety thresholds:
   - `RESOLVE_FRAUD_ESCALATION_THRESHOLD = 0.60`
   - `RESOLVE_EVIDENCE_MIN_CONFIDENCE = 0.80`
   - `RESOLVE_DECISION_AUTO_APPROVAL_THRESHOLD = 0.80`
   - `RESOLVE_HIGH_VALUE_ORDER_THRESHOLD = 50000.0`
6. **Decision Passport Generator** (`apps/ai_engine/decision/decision_passport.py`): Generates audit passport payload containing facts, evidence breakdown, policy citations, candidate scores, selected resolution, decision status, and human review reasons.

---

## 3. REST API Endpoints Added
- `POST /api/v1/cases/{id}/resolution/analyze` - Triggers candidate scoring and decision gate evaluation.
- `GET /api/v1/cases/{id}/resolution` - Retrieves candidate options, scores, and recommended action.
- `GET /api/v1/cases/{id}/decision-passport` - Retrieves full Resolve-AI Decision Passport payload.

---

## 4. Frontend Visualizations (`apps/frontend/src/App.tsx`)
- **Resolution Options Comparison Card**: Visual bar graph comparing `Replacement (95% Recommended)`, `Refund (82%)`, `Partial Refund (64%)`.
- **Decision Gate Status Badge**: Displays `AUTO APPROVED` or `HUMAN REVIEW REQUIRED`.

---

## 5. Automated Scenario Testing (`test_phase5_resolution.py`)
1. **Scenario 1 (Normal Case)**: Valid evidence, low fraud, valid policy, replacement available -> `AUTO_APPROVED / REPLACEMENT`.
2. **Scenario 2 (High Fraud)**: Fraud risk 88% -> `HUMAN_REVIEW`.
3. **Scenario 3 (Weak Evidence)**: Evidence confidence 48% -> `HUMAN_REVIEW`.
4. **Scenario 4 (Policy Ineligible)**: Out of policy window -> `REJECTED`.
5. **Scenario 5 (High Value Order)**: INR 75,000 claim -> `HUMAN_REVIEW`.
6. **Scenario 6 (Replacement Stock 0)**: Replacement unavailable -> `REFUND`.
7. **Scenario 7 (Stock 0 & Partial Allowed)**: Customer requested replacement, unavailable, partial refund allowed -> `PARTIAL_REFUND`.

All 7 scenarios passed 100%.
