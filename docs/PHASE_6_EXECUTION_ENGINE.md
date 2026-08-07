# Phase 6: Workflow Execution Engine & Controlled Enterprise Tool Layer

## Overview

Phase 6 implements the **Workflow Execution Agent**, **Secure Tool Permission Layer**, **Mock Enterprise APIs**, **Human Escalation Workflow**, **Immutable Audit Trail**, **Execution Status Tracking**, and **Admin Execution Monitoring UI** for Resolve-AI.

## Architecture

```
                        Resolution Agent
                               │
                     ┌─────────┴─────────┐
                     ▼                   ▼
              [LOW RISK / AUTO]    [HIGH RISK / ESCALATED]
                     │                   │
                     ▼                   ▼
          Workflow Execution     Human Escalation Agent
              Agent                      │
                     │            Admin Approval Queue
                     │           (Approve/Reject/Info)
                     └──────────┬────────┘
                                │
                    [Tool Permission Registry]
                  (Per-agent authorized tools)
                                │
                   [Idempotency Check Engine]
                   (key: case_id:action_type)
                                │
                 [Mock Enterprise Services Layer]
         Order | Refund | Inventory | Shipping | Notification
                                │
                  [Immutable Audit Trail Service]
                       (Append-only events)
                                │
                     [Decision Passport]
                    (Full execution history)
```

## Files Created / Modified

### New Files
| File | Purpose |
|------|---------|
| `apps/ai_engine/tools/registry.py` | Tool Permission Registry & authorization enforcement |
| `apps/ai_engine/tools/idempotency.py` | Idempotency Engine (key: `case_id:action_type`) |
| `apps/backend/app/services/audit.py` | Immutable append-only Audit Trail Service |
| `apps/backend/app/api/v1/escalations.py` | Human Escalation & Approval Workflow REST API |
| `test_phase6_execution.py` | 28-scenario automated test suite (28/28 passed) |

### Modified Files
| File | Change |
|------|--------|
| `apps/ai_engine/agents/workflow/agent.py` | Full rewrite with Tool Permission + Idempotency |
| `apps/ai_engine/agents/escalation/agent.py` | Full rewrite with HIGH_FRAUD_RISK/HIGH_VALUE routing |
| `apps/backend/app/services/mock_enterprise.py` | Added `update_order_status`, `schedule_pickup`, `reserve_inventory`, normalized all response schemas |
| `apps/backend/app/api/v1/cases.py` | Fixed import (`WorkflowExecutionAgent`), added `/execute`, `/execution`, `/execution/timeline`, `/audit`, `/notifications` endpoints |
| `apps/backend/app/main.py` | Registered escalations router |
| `apps/frontend/src/App.tsx` | Added Execution Timeline, Human Approval Panel, Execution Monitoring Metrics |

## Tool Permission Matrix

| Agent | Authorized Tools |
|-------|-----------------|
| `InteractionAgent` | `get_customer`, `get_order` |
| `EvidenceAgent` | `get_order`, `get_delivery`, `analyze_vision`, `extract_invoice` |
| `PolicyAgent` | `search_policy` |
| `FraudAgent` | `get_customer_history`, `get_claim_history` |
| `ResolutionAgent` | `get_order`, `check_inventory`, `calculate_refund` |
| `WorkflowExecutionAgent` | `verify_order`, `create_refund`, `reserve_inventory`, `create_shipment`, `schedule_pickup`, `update_order_status`, `send_notification` |
| `EscalationAgent` | `create_escalation`, `request_human_review` |

Unauthorized tool calls immediately raise `PermissionError`.

## Idempotency Engine

Uses idempotency key `case_id:action_type` stored in an in-memory execution registry.

- **Cache miss**: Action executes normally and result is stored.
- **Cache hit**: Cached result is returned without re-executing the financial or logistics action.
- **Prevents**: Duplicate refunds, duplicate shipment creation on retries.

## Mock Enterprise APIs

All APIs return deterministic responses without any real third-party integration:

| Mock API | Method | Key Fields Returned |
|---------|--------|---------------------|
| Order API | `GET order_details` | `order_id`, `status: "DELIVERED"`, `sku`, `price` |
| Refund API | `POST process_refund` | `refund_id`, `amount`, `status: "processed"` |
| Inventory API | `POST reserve_inventory` | `reservation_id`, `status: "reserved"`, `warehouse` |
| Shipping API | `POST create_replacement_shipment` | `shipment_id`, `tracking_number`, `status: "created"` |
| Shipping API | `POST schedule_pickup` | `pickup_id`, `status: "SCHEDULED"` |
| Notification API | `POST send_customer_notice` | `notification_id`, `channel: "email"`, `status: "sent"` |

## REST API Endpoints Added

### Case Execution
- `POST /api/v1/cases/{id}/execute` — Trigger Workflow Execution Agent
- `GET /api/v1/cases/{id}/execution` — Get execution plan and action statuses
- `GET /api/v1/cases/{id}/execution/timeline` — Get timestamped event timeline
- `GET /api/v1/cases/{id}/audit` — Get immutable audit trail events
- `GET /api/v1/cases/{id}/notifications` — Get customer notification history

### Human Escalation
- `GET /api/v1/escalations/` — List pending human review cases
- `POST /api/v1/escalations/{id}/approve` — Approve and execute workflow
- `POST /api/v1/escalations/{id}/reject` — Reject claim with customer notification
- `POST /api/v1/escalations/{id}/request-info` — Request additional documentation

## Escalation Thresholds

| Threshold | Value | Trigger |
|-----------|-------|---------|
| Fraud escalation | `fraud_score >= 0.60` | HIGH_FRAUD_RISK |
| High-value transaction | `claim_amount >= INR 50,000` | HIGH_VALUE_TRANSACTION |
| Evidence weakness | `evidence_confidence < 0.80` | WEAK_EVIDENCE |

## Audit Trail Events

The audit service records only via `POST`. No `PUT` or `DELETE` operations exist:

`CASE_CREATED` → `EVIDENCE_ANALYZED` → `POLICY_RETRIEVED` → `FRAUD_ANALYZED` → `RESOLUTION_GENERATED` → `AUTO_APPROVAL` / `HUMAN_REVIEW_REQUESTED` → `HUMAN_APPROVED` / `HUMAN_REJECTED` / `INFO_REQUESTED` → `ORDER_VERIFIED` → `INVENTORY_RESERVED` / `REFUND_CREATED` → `SHIPMENT_CREATED` → `CUSTOMER_NOTIFIED` → `CASE_RESOLVED`

## Frontend UI Additions (App.tsx)

1. **Admin Execution Monitoring Metrics Row**: Automation Rate (83%), Human Review (17%), Execution Success (98%), Avg Resolution (42s).
2. **Real-time Workflow Execution Timeline Card**: Per-case step-by-step timeline with timestamps. Green = complete, Amber (animated pulse) = awaiting human.
3. **Human Approval Panel**: Appears for all `Requires_Review` cases and high-value/high-fraud cases. Provides [Approve Resolution], [Reject Claim], [Request Info] controls.

## Test Results

```
RESULTS: 28 PASSED  |  0 FAILED
```

| Section | Tests |
|---------|-------|
| Tool Permission Registry | TC01–TC05 (5 tests) |
| Idempotency Engine | TC06–TC09 (4 tests) |
| Mock Enterprise Services | TC10–TC14 (5 tests) |
| Workflow Execution Agent | TC15–TC21 (7 tests) |
| Human Escalation Agent | TC22–TC24 (3 tests) |
| Immutable Audit Trail | TC25–TC28 (4 tests) |
