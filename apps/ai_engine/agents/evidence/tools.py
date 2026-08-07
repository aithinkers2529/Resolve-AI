from langchain.tools import tool

@tool
def evidence_utility_tool(query: str) -> str:
    """Utility tool for Evidence Agent tasks."""
    return f"Execution result for: {query}"
