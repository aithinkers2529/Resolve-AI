from langchain.tools import tool

@tool
def resolution_utility_tool(query: str) -> str:
    """Utility tool for Resolution Agent tasks."""
    return f"Execution result for: {query}"
