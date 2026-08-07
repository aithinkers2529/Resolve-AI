from langchain.tools import tool

@tool
def workflow_utility_tool(query: str) -> str:
    """Utility tool for Workflow Agent tasks."""
    return f"Execution result for: {query}"
