"""
ChromaDB client for vector storage and retrieval
"""
import chromadb
from chromadb.config import Settings
from pathlib import Path
from typing import List, Dict
from uuid import uuid4


class ChromaClient:
    """ChromaDB client for semantic search"""
    
    def __init__(self, persist_directory: str = "./chroma_data"):
        self.persist_dir = Path(__file__).parent.parent.parent / persist_directory
        self.persist_dir.mkdir(exist_ok=True)
        
        print(f"🔄 Initializing ChromaDB at: {self.persist_dir}")
        
        self.client = chromadb.Client(Settings(
            persist_directory=str(self.persist_dir),
            anonymized_telemetry=False
        ))
        
        # Get or create collection
        self.collection = self.client.get_or_create_collection(
            name="nexus_memory",
            metadata={"description": "Nexus message memory"}
        )
        
        print(f"✅ ChromaDB initialized with {self.collection.count()} existing documents")
    
    def add(
        self,
        text: str,
        embedding: List[float],
        metadata: Dict = None
    ) -> str:
        """Add a document to the collection"""
        doc_id = str(uuid4())
        
        self.collection.add(
            ids=[doc_id],
            embeddings=[embedding],
            documents=[text],
            metadatas=[metadata or {}]
        )
        
        return doc_id
    
    def query(
        self,
        query_embedding: List[float],
        n_results: int = 5
    ) -> List[Dict]:
        """Query for similar documents"""
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results
        )
        
        # Format results
        formatted = []
        if results['documents'] and results['documents'][0]:
            for doc, distance, metadata in zip(
                results['documents'][0],
                results['distances'][0],
                results['metadatas'][0]
            ):
                formatted.append({
                    'text': doc,
                    'distance': distance,
                    'metadata': metadata
                })
        
        return formatted


# Singleton instance
_chroma_client = None


def get_chroma_client() -> ChromaClient:
    """Get or create ChromaDB client instance"""
    global _chroma_client
    if _chroma_client is None:
        _chroma_client = ChromaClient()
    return _chroma_client
