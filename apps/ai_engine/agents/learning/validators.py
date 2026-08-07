from .models import LearningOutput

def validate_output(output_data: dict) -> bool:
    """Validate that Learning Agent output meets schema rules."""
    try:
        validated = LearningOutput(**output_data)
        return validated.success
    except Exception:
        return False
