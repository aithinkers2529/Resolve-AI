from .models import PolicyOutput

def validate_output(output_data: dict) -> bool:
    """Validate that Policy Agent output meets schema rules."""
    try:
        validated = PolicyOutput(**output_data)
        return validated.success
    except Exception:
        return False
