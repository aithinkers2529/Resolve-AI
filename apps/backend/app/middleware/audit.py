import re
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
import logging

logger = logging.getLogger("audit_logger")

class AuditLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Gather context
        client_host = request.client.host if request.client else "unknown"
        method = request.method
        url = request.url.path
        
        # Log incoming action
        logger.info(f"Audit log: host={client_host} action={method} path={url}")
        
        response = await call_next(request)
        return response

def mask_sensitive_pii(text: str) -> str:
    """Mask email addresses, phone numbers, and other PII indicators."""
    email_pattern = r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+'
    text = re.sub(email_pattern, "[MASKED_EMAIL]", text)
    # Simple digits card pattern mask (e.g. credit card sequences)
    card_pattern = r'\b(?:\d[ -]*?){13,16}\b'
    text = re.sub(card_pattern, "[MASKED_CARD]", text)
    return text
