from .models import EvidenceOutput

def validate_output(output_data: dict) -> bool:
    """Validate that Evidence Agent output meets schema rules."""
    try:
        validated = EvidenceOutput(**output_data)
        return validated.success
    except Exception:
        return False
