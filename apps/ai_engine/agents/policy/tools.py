from langchain.tools import tool

@tool
def policy_utility_tool(query: str) -> str:
    """Utility tool for Policy Agent tasks."""
    return f"Execution result for: {query}"
