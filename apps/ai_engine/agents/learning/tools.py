from langchain.tools import tool

@tool
def learning_utility_tool(query: str) -> str:
    """Utility tool for Learning Agent tasks."""
    return f"Execution result for: {query}"
