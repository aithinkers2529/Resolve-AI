from .models import InteractionOutput

def validate_output(output_data: dict) -> bool:
    """Validate that Interaction Agent output meets schema rules."""
    try:
        validated = InteractionOutput(**output_data)
        return validated.success
    except Exception:
        return False
