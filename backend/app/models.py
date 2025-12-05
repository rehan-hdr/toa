"""
SQLModel database models for Nexus MVP
"""
from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID, uuid4
import json


class Message(SQLModel, table=True):
    """Store all user and assistant messages"""
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    text: str
    sender: str  # "user" or "assistant"
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    summary: Optional[str] = None
    category: Optional[str] = None
    metadata_json: Optional[str] = None  # JSON string
    chroma_id: Optional[str] = None
    
    def set_metadata(self, data: dict):
        """Set metadata as JSON string"""
        self.metadata_json = json.dumps(data)
    
    def get_metadata(self) -> dict:
        """Get metadata as dict"""
        if self.metadata_json:
            return json.loads(self.metadata_json)
        return {}


class Task(SQLModel, table=True):
    """Store tasks extracted from messages"""
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    priority: Optional[int] = None
    status: str = Field(default="todo")  # todo, in_progress, done
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    source_message_id: Optional[UUID] = None
    subtasks_json: Optional[str] = None  # JSON array of subtask strings
    estimate_hours: Optional[float] = None
    
    def set_subtasks(self, subtasks: list):
        """Set subtasks as JSON string"""
        self.subtasks_json = json.dumps(subtasks)
    
    def get_subtasks(self) -> list:
        """Get subtasks as list"""
        if self.subtasks_json:
            return json.loads(self.subtasks_json)
        return []


class Note(SQLModel, table=True):
    """Store notes (non-task content)"""
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    content: str
    summary: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    source_message_id: Optional[UUID] = None
