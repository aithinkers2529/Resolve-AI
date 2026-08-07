from .models import FraudOutput

def validate_output(output_data: dict) -> bool:
    """Validate that Fraud Agent output meets schema rules."""
    try:
        validated = FraudOutput(**output_data)
        return validated.success
    except Exception:
        return False
