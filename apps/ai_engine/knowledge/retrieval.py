from .vector_store import VectorStoreConnector
from .embedding import EmbeddingGenerator

class KnowledgeRetrievalSystem:
    def __init__(self):
        self.embedder = EmbeddingGenerator()
        self.store = VectorStoreConnector()

    def search_knowledge(self, query: str) -> str:
        emb = self.embedder.generate(query)
        results = self.store.query(emb)
        return results[0]["chunk_text"] if results else ""
