# Phase 2 — Authentication & Role-Based Access Control (RBAC)

## Objective
Phase 2 implemented a complete, secure Authentication & Role-Based Access Control (RBAC) framework for Resolve-AI. The system protects REST API endpoints using signed JWT Bearer tokens, enforces granular role permissions, prevents privilege escalation during public registration, and implements resource-level ownership validation to eliminate Insecure Direct Object Reference (IDOR) vulnerabilities.

---

## Authentication Architecture

```
[Client] ──► POST /api/v1/auth/login ──► [Verify Passlib/Bcrypt Hash] ──► [Generate Signed JWT]
                                                                                   │
[Client Storage: Bearer Token] ◄───────────────────────────────────────────────────┘
         │
         ▼
[HTTP Request Header: "Authorization: Bearer <JWT>"]
         │
         ▼
[FastAPI Dependency: get_current_user] ──► Decodes Token & Checks is_active
         │
         ▼
[RBAC Permission Check: require_permission] ──► Validates UserRole against Permission Matrix
         │
         ▼
[Resource Ownership Check: check_case_ownership] ──► Restricts CUSTOMER to own cases
         │
         ▼
[Authorized Business Endpoint]
```

---

## JWT Architecture
- **Algorithm**: `HS256`
- **Secret Key**: Configured via `settings.SECRET_KEY`
- **Expiration**: Configured via `settings.ACCESS_TOKEN_EXPIRE_MINUTES` (Default: 24 Hours)
- **Token Claims Payload**:
  - `sub`: User email address
  - `user_id`: Database primary key
  - `role`: Canonical role string (`CUSTOMER`, `SUPPORT_AGENT`, `FRAUD_ANALYST`, `POLICY_ANALYST`, `RESOLUTION_MANAGER`, `ADMIN`)
  - `iat`: Issued-at timestamp
  - `exp`: Expiration timestamp
  - `jti`: Unique token identifier UUID

---

## Password Security
- **Algorithm**: Direct `bcrypt` hashing with salt rounds.
- Passwords are strictly hashed before saving to SQLite/PostgreSQL.
- Plaintext passwords are never logged or stored.
- Password hashes are excluded from API schema outputs (`UserSchema`).

---

## Canonical Roles (`UserRole` Enum)
1. `CUSTOMER`
2. `SUPPORT_AGENT`
3. `FRAUD_ANALYST`
4. `POLICY_ANALYST`
5. `RESOLUTION_MANAGER`
6. `ADMIN`

---

## RBAC Permission Matrix

| Permission | Customer | Support Agent | Fraud Analyst | Policy Analyst | Resolution Manager | Admin |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `CASE_CREATE` | ✓ | - | - | - | - | ✓ |
| `CASE_VIEW_OWN` | ✓ | - | - | - | - | ✓ |
| `CASE_VIEW_ASSIGNED` | - | ✓ | ✓ | - | ✓ | ✓ |
| `CASE_VIEW_ALL` | - | - | - | - | - | ✓ |
| `EVIDENCE_UPLOAD` | ✓ | ✓ | - | - | - | ✓ |
| `EVIDENCE_VIEW` | ✓ | ✓ | ✓ | - | ✓ | ✓ |
| `FRAUD_REVIEW` | - | - | ✓ | - | - | ✓ |
| `POLICY_VIEW` | - | ✓ | ✓ | ✓ | ✓ | ✓ |
| `POLICY_MANAGE` | - | - | - | ✓ | - | ✓ |
| `RESOLUTION_REVIEW` | - | - | - | - | ✓ | ✓ |
| `RESOLUTION_APPROVE` | - | - | - | - | ✓ | ✓ |
| `USER_MANAGE` | - | - | - | - | - | ✓ |
| `ANALYTICS_VIEW` | - | - | ✓ | ✓ | ✓ | ✓ |
| `AUDIT_VIEW` | - | - | - | - | ✓ | ✓ |

---

## Resource-Level Authorization (IDOR Protection)
- Enforced via helper function `check_case_ownership(case, current_user)` in `apps/backend/app/api/deps.py`.
- If `current_user.role == "CUSTOMER"`, access is granted **only if** `case.customer_email == current_user.email` or `case.customer_id == current_user.id`.
- Attempts to query or upload evidence to another customer's dispute return `HTTP 403 Forbidden`.

---

## User Registration
- Endpoint: `POST /api/v1/auth/register`
- Inputs: `email`, `password`, `full_name`.
- **Privilege Escalation Protection**: Public registration **always** forces `role = CUSTOMER`. Attempts to submit `role: "ADMIN"` in JSON payloads are discarded.

---

## Login
- Endpoint: `POST /api/v1/auth/login`
- Accepts both `application/json` payloads and `application/x-www-form-urlencoded` OAuth2 form data.
- Returns `access_token`, `token_type` ("bearer"), `expires_in` (seconds), and `user` profile data.
- Creates `LOGIN_SUCCESS` or `LOGIN_FAILURE` security audit log entries.

---

## Current User Profile
- Endpoint: `GET /api/v1/auth/me`
- Requires `Authorization: Bearer <token>` header.
- Returns logged-in user profile details (`id`, `email`, `full_name`, `role`, `is_active`, `created_at`).

---

## Logout
- Endpoint: `POST /api/v1/auth/logout`
- Records `LOGOUT` security audit trail and returns instructions to remove token from client storage.

---

## Admin User Management
Endpoints in `apps/backend/app/api/v1/admin.py` protected by `require_permission(USER_MANAGE)`:
- `GET /api/v1/admin/users`: List all platform users.
- `GET /api/v1/admin/users/{user_id}`: Fetch single user profile.
- `PATCH /api/v1/admin/users/{user_id}/role`: Elevate or modify user roles (creates `ROLE_CHANGED` audit log).
- `PATCH /api/v1/admin/users/{user_id}/status`: Enable or disable user accounts (creates `USER_STATUS_CHANGED` audit log).
- `GET /api/v1/admin/audit-logs`: Query security audit events.

---

## Security Audit Events
All security-relevant actions create records in `audit_logs`:
- `USER_REGISTERED`
- `LOGIN_SUCCESS`
- `LOGIN_FAILURE`
- `LOGOUT`
- `ROLE_CHANGED`
- `USER_STATUS_CHANGED`

---

## Role-Based Demo Accounts
Seeded in `seed_demo.py` with password `"password123"`:
- **Customer**: `customer@resolveai.demo` (`CUSTOMER`)
- **Sarah Jenkins**: `sarah.j@example.com` (`CUSTOMER`)
- **Support Agent**: `support@resolveai.demo` (`SUPPORT_AGENT`)
- **Fraud Analyst**: `fraud@resolveai.demo` (`FRAUD_ANALYST`)
- **Policy Analyst**: `policy@resolveai.demo` (`POLICY_ANALYST`)
- **Resolution Manager**: `manager@resolveai.demo` (`RESOLUTION_MANAGER`)
- **Admin**: `admin@resolveai.demo` / `admin@resolve.ai` (`ADMIN`)

---

## Testing
Executed via `test_auth_rbac.py` and `test_deploy_local.py`:
1. Customer & Admin login verification.
2. Incorrect password rejection (HTTP 401).
3. Current user profile fetching (`/auth/me`).
4. Privilege escalation prevention during registration.
5. Customer blocked from Admin APIs (HTTP 403 Forbidden).
6. Admin accessing User Management.
7. Customer accessing own case (`DISP-9842`).
8. IDOR Protection: Hacker blocked from accessing Sarah's case (`DISP-9842`).

---

## Files Created
- `apps/backend/app/core/permissions.py`
- `apps/backend/app/schemas/auth.py`
- `apps/backend/app/api/deps.py`
- `apps/backend/app/api/v1/admin.py`
- `test_auth_rbac.py`
- `docs/PHASE_2_AUTH_RBAC.md`

---

## Files Modified
- `libs/db_shared/enums.py` (added `UserRole`)
- `libs/db_shared/models/user.py` (added `last_login_at`)
- `apps/backend/app/core/security.py` (added `decode_access_token`, direct `bcrypt` hashing)
- `apps/backend/app/api/v1/auth.py` (updated registration, login, profile, and logout)
- `apps/backend/app/api/v1/cases.py` (added auth & ownership checks)
- `apps/backend/app/api/v1/customers.py` (added profile authorization)
- `apps/backend/app/api/v1/orders.py` (added authentication)
- `apps/backend/app/api/v1/evidence.py` (added ownership checks)
- `apps/backend/app/main.py` (registered admin router)
- `seed_demo.py` (seeded 6 role-based demo accounts)
- `test_deploy_local.py` (added Bearer headers to API tests)

---

## Phase 3 Preparation
The backend authentication and authorization layer is now fully secured, paving the way for **Phase 3: Multi-Agent Engine & Gemini LLM / Vision Integration**.
