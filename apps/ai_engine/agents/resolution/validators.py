from .models import ResolutionOutput

def validate_output(output_data: dict) -> bool:
    """Validate that Resolution Agent output meets schema rules."""
    try:
        validated = ResolutionOutput(**output_data)
        return validated.success
    except Exception:
        return False
