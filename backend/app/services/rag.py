import chromadb
from sentence_transformers import SentenceTransformer
from app.core.config import settings
from loguru import logger
import uuid
import os

class RAGService:
    def __init__(self):
        logger.info(f"Initializing RAG Service with chroma path: {settings.CHROMA_PERSIST_DIR}")
        self.chroma_client = chromadb.PersistentClient(
            path=settings.CHROMA_PERSIST_DIR,
            settings=chromadb.config.Settings(anonymized_telemetry=False)
        )
        self.collection = self.chroma_client.get_or_create_collection(name="nexus_knowledge")
        
        logger.info(f"Loading embedding model: {settings.EMBEDDING_MODEL}")
        self.embedder = SentenceTransformer(settings.EMBEDDING_MODEL)
        
    def add_document(self, text: str, metadata: dict = None):
        if not text:
            return None
        try:
            embedding = self.embedder.encode(text).tolist()
            doc_id = str(uuid.uuid4())
            metadatas = [metadata] if metadata else [{"source": "generated"}]
            self.collection.add(
                documents=[text],
                embeddings=[embedding],
                metadatas=metadatas,
                ids=[doc_id]
            )
            logger.info(f"Added document to RAG: {text[:50]}... ID: {doc_id}")
            return doc_id
        except Exception as e:
            logger.error(f"Error adding document to RAG: {e}")
            return None
        
    def query(self, query: str, n_results: int = 5):
        try:
            embedding = self.embedder.encode(query).tolist()
            results = self.collection.query(
                query_embeddings=[embedding],
                n_results=n_results
            )
            # Flatten results
            documents = results['documents'][0] if results['documents'] else []
            return documents
        except Exception as e:
            logger.error(f"Error querying RAG: {e}")
            return []

# Singleton instance
rag_service = RAGService()
