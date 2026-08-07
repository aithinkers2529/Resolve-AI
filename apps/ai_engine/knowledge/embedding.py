from typing import List

class EmbeddingGenerator:
    """Generates vector embeddings for document text chunks using Gemini Embeddings."""
    def generate(self, text: str) -> List[float]:
        # Return mock 768-dimension vector
        return [0.012] * 768
