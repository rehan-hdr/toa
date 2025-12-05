"""
Pydantic schemas for API request/response validation
"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class ChatRequest(BaseModel):
    """Request schema for /chat endpoint"""
    message: str


class TaskInfo(BaseModel):
    """Task information in response"""
    id: str
    title: str
    description: Optional[str] = None
    due_date: Optional[str] = None
    priority: Optional[int] = None
    subtasks: Optional[List] = None  # Can be strings or dicts from LLM
    estimate_hours: Optional[float] = None


class ChatResponse(BaseModel):
    """Response schema for /chat endpoint"""
    response: str
    category: str
    summary: str
    produced_task: Optional[TaskInfo] = None


class TaskResponse(BaseModel):
    """Response schema for task endpoints"""
    id: str
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    priority: Optional[int] = None
    status: str
    created_at: datetime
    updated_at: datetime
    subtasks: Optional[List[str]] = None
    estimate_hours: Optional[float] = None
