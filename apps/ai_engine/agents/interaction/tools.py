from langchain.tools import tool

@tool
def interaction_utility_tool(query: str) -> str:
    """Utility tool for Interaction Agent tasks."""
    return f"Execution result for: {query}"
