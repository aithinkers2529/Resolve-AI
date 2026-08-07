from langchain.tools import tool

@tool
def fraud_utility_tool(query: str) -> str:
    """Utility tool for Fraud Agent tasks."""
    return f"Execution result for: {query}"
