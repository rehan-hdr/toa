"""
Storage service for coordinating SQLite + ChromaDB operations
"""
from sqlmodel import Session
from datetime import datetime
from typing import Dict, Optional
from uuid import UUID

from app.models import Message, Task, Note
from app.services.embedder import get_embedder
from app.services.chroma_client import get_chroma_client


class StorageService:
    """Coordinate storage across SQLite and ChromaDB"""
    
    def __init__(self):
        self.embedder = get_embedder()
        self.chroma = get_chroma_client()
    
    def store_message(
        self,
        db: Session,
        text: str,
        sender: str,
        category: Optional[str] = None,
        summary: Optional[str] = None,
        metadata: Optional[Dict] = None
    ) -> Message:
        """
        Store a message in both SQLite and ChromaDB
        
        Args:
            db: Database session
            text: Message text
            sender: "user" or "assistant"
            category: Message category
            summary: Summary of message
            metadata: Additional metadata dict
        
        Returns:
            Created Message object
        """
        # Generate embedding
        embedding = self.embedder.embed(text)
        
        # Store in ChromaDB
        chroma_metadata = {
            "sender": sender,
            "category": category or "unknown",
            "timestamp": datetime.utcnow().isoformat()
        }
        if metadata:
            # ChromaDB only accepts str, int, float, bool - filter out lists/dicts
            for key, value in metadata.items():
                if isinstance(value, (str, int, float, bool)):
                    chroma_metadata[key] = value
        
        chroma_id = self.chroma.add(
            text=text,
            embedding=embedding,
            metadata=chroma_metadata
        )
        
        # Store in SQLite
        message = Message(
            text=text,
            sender=sender,
            category=category,
            summary=summary,
            chroma_id=chroma_id
        )
        if metadata:
            message.set_metadata(metadata)
        
        db.add(message)
        db.commit()
        db.refresh(message)
        
        return message
    
    def create_task(
        self,
        db: Session,
        task_data: Dict,
        source_message_id: Optional[UUID] = None
    ) -> Task:
        """
        Create a task from LLM-extracted data
        
        Args:
            db: Database session
            task_data: Dict with task fields from LLM
            source_message_id: UUID of source message
        
        Returns:
            Created Task object
        """
        # Parse due_date if it's a string
        due_date = None
        if task_data.get('due_date') and task_data['due_date'] != 'null':
            try:
                due_date = datetime.fromisoformat(task_data['due_date'])
            except:
                pass
        
        # Create task
        task = Task(
            title=task_data.get('title', 'Untitled Task'),
            description=task_data.get('description'),
            due_date=due_date,
            priority=task_data.get('priority'),
            estimate_hours=task_data.get('estimate_hours'),
            source_message_id=source_message_id
        )
        
        # Set subtasks if provided
        if task_data.get('subtasks'):
            task.set_subtasks(task_data['subtasks'])
        
        db.add(task)
        db.commit()
        db.refresh(task)
        
        return task
    
    def retrieve_context(
        self,
        query: str,
        n_results: int = 5
    ) -> list[str]:
        """
        Retrieve relevant context for a query
        
        Args:
            query: Query text
            n_results: Number of results to return
        
        Returns:
            List of context strings
        """
        # Generate query embedding
        query_embedding = self.embedder.embed(query)
        
        # Query ChromaDB
        results = self.chroma.query(
            query_embedding=query_embedding,
            n_results=n_results
        )
        
        # Format as context strings
        context = []
        for result in results:
            context.append(result['text'])
        
        return context


# Singleton instance
_storage_service = None


def get_storage_service() -> StorageService:
    """Get or create storage service instance"""
    global _storage_service
    if _storage_service is None:
        _storage_service = StorageService()
    return _storage_service
