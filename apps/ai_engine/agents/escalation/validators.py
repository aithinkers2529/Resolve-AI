from .models import EscalationOutput

def validate_output(output_data: dict) -> bool:
    """Validate that Escalation Agent output meets schema rules."""
    try:
        validated = EscalationOutput(**output_data)
        return validated.success
    except Exception:
        return False
