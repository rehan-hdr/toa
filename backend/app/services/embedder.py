"""
Embedding service using sentence-transformers
"""
from sentence_transformers import SentenceTransformer
from typing import List


class Embedder:
    """Generate embeddings for text"""
    
    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
        print(f"🔄 Loading embedding model: {model_name}")
        self.model = SentenceTransformer(model_name)
        print(f"✅ Embedding model loaded")
    
    def embed(self, text: str) -> List[float]:
        """Generate embedding for a single text"""
        embedding = self.model.encode(text, convert_to_numpy=True)
        return embedding.tolist()
    
    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for multiple texts"""
        embeddings = self.model.encode(texts, convert_to_numpy=True)
        return embeddings.tolist()


# Singleton instance
_embedder = None


def get_embedder() -> Embedder:
    """Get or create embedder instance"""
    global _embedder
    if _embedder is None:
        _embedder = Embedder()
    return _embedder
