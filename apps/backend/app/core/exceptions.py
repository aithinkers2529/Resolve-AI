from fastapi import Request, status
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger("resolve_exceptions")

class ResolveAIException(Exception):
    def __init__(self, code: str, message: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        self.code = code
        self.message = message
        self.status_code = status_code
        super().__init__(message)

class CaseNotFoundException(ResolveAIException):
    def __init__(self, case_id: str):
        super().__init__(
            code="CASE_NOT_FOUND",
            message=f"Dispute case '{case_id}' was not found.",
            status_code=status.HTTP_404_NOT_FOUND
        )

class CustomerNotFoundException(ResolveAIException):
    def __init__(self, customer_id: str):
        super().__init__(
            code="CUSTOMER_NOT_FOUND",
            message=f"Customer '{customer_id}' was not found.",
            status_code=status.HTTP_404_NOT_FOUND
        )

class OrderNotFoundException(ResolveAIException):
    def __init__(self, order_id: str):
        super().__init__(
            code="ORDER_NOT_FOUND",
            message=f"Order '{order_id}' was not found.",
            status_code=status.HTTP_404_NOT_FOUND
        )

class EntityValidationException(ResolveAIException):
    def __init__(self, message: str):
        super().__init__(
            code="VALIDATION_ERROR",
            message=message,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY
        )

class DatabaseException(ResolveAIException):
    def __init__(self, message: str = "Database transaction failed"):
        super().__init__(
            code="DATABASE_ERROR",
            message=message,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

async def resolve_ai_exception_handler(request: Request, exc: ResolveAIException):
    logger.warning(f"Domain exception: code={exc.code} message='{exc.message}' path={request.url.path}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": exc.code,
                "message": exc.message
            }
        }
    )

async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled server exception on path {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred. Please contact support."
            }
        }
    )
