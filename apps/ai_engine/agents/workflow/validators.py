from .models import WorkflowOutput

def validate_output(output_data: dict) -> bool:
    """Validate that Workflow Agent output meets schema rules."""
    try:
        validated = WorkflowOutput(**output_data)
        return validated.success
    except Exception:
        return False
