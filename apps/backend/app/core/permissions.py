from libs.db_shared.enums import UserRole
from typing import Set, Dict

# Permission Constants
CASE_CREATE = "CASE_CREATE"
CASE_VIEW_OWN = "CASE_VIEW_OWN"
CASE_VIEW_ASSIGNED = "CASE_VIEW_ASSIGNED"
CASE_VIEW_ALL = "CASE_VIEW_ALL"

EVIDENCE_UPLOAD = "EVIDENCE_UPLOAD"
EVIDENCE_VIEW = "EVIDENCE_VIEW"

FRAUD_REVIEW = "FRAUD_REVIEW"
POLICY_VIEW = "POLICY_VIEW"
POLICY_MANAGE = "POLICY_MANAGE"

RESOLUTION_REVIEW = "RESOLUTION_REVIEW"
RESOLUTION_APPROVE = "RESOLUTION_APPROVE"

USER_MANAGE = "USER_MANAGE"
ANALYTICS_VIEW = "ANALYTICS_VIEW"
AUDIT_VIEW = "AUDIT_VIEW"
SYSTEM_MANAGE = "SYSTEM_MANAGE"
APPEAL_CREATE = "APPEAL_CREATE"

# Role Permission Map
ROLE_PERMISSIONS: Dict[str, Set[str]] = {
    UserRole.CUSTOMER: {
        CASE_CREATE,
        CASE_VIEW_OWN,
        EVIDENCE_UPLOAD,
        EVIDENCE_VIEW,
        APPEAL_CREATE,
    },
    UserRole.SUPPORT_AGENT: {
        CASE_VIEW_ASSIGNED,
        EVIDENCE_VIEW,
        EVIDENCE_UPLOAD,
        POLICY_VIEW,
    },
    UserRole.FRAUD_ANALYST: {
        CASE_VIEW_ASSIGNED,
        EVIDENCE_VIEW,
        FRAUD_REVIEW,
        POLICY_VIEW,
        ANALYTICS_VIEW,
    },
    UserRole.POLICY_ANALYST: {
        POLICY_VIEW,
        POLICY_MANAGE,
        ANALYTICS_VIEW,
    },
    UserRole.RESOLUTION_MANAGER: {
        CASE_VIEW_ASSIGNED,
        EVIDENCE_VIEW,
        POLICY_VIEW,
        RESOLUTION_REVIEW,
        RESOLUTION_APPROVE,
        ANALYTICS_VIEW,
        AUDIT_VIEW,
    },
    UserRole.ADMIN: {
        CASE_CREATE,
        CASE_VIEW_OWN,
        CASE_VIEW_ASSIGNED,
        CASE_VIEW_ALL,
        EVIDENCE_UPLOAD,
        EVIDENCE_VIEW,
        FRAUD_REVIEW,
        POLICY_VIEW,
        POLICY_MANAGE,
        RESOLUTION_REVIEW,
        RESOLUTION_APPROVE,
        USER_MANAGE,
        ANALYTICS_VIEW,
        AUDIT_VIEW,
        SYSTEM_MANAGE,
        APPEAL_CREATE,
    },
}

def has_permission(role: str, permission: str) -> bool:
    """Check if a canonical role possesses a specific permission."""
    # Normalize role string (e.g. "Admin", "admin", "ADMIN")
    role_upper = str(role).upper()
    return permission in ROLE_PERMISSIONS.get(role_upper, set())
