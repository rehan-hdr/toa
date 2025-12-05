"""
Tasks router - CRUD operations for tasks
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List, Optional

from app.schemas import TaskResponse
from app.models import Task
from app.db import get_session

router = APIRouter()


@router.get("/tasks", response_model=List[TaskResponse])
async def get_tasks(
    status: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_session)
):
    """Get all tasks, optionally filtered by status"""
    query = select(Task)
    
    if status:
        query = query.where(Task.status == status)
    
    query = query.order_by(Task.created_at.desc()).limit(limit)
    
    tasks = db.exec(query).all()
    
    # Convert to response format
    return [
        TaskResponse(
            id=str(task.id),
            title=task.title,
            description=task.description,
            due_date=task.due_date,
            priority=task.priority,
            status=task.status,
            created_at=task.created_at,
            updated_at=task.updated_at,
            subtasks=task.get_subtasks(),
            estimate_hours=task.estimate_hours
        )
        for task in tasks
    ]


@router.get("/tasks/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: str,
    db: Session = Depends(get_session)
):
    """Get a specific task by ID"""
    task = db.get(Task, task_id)
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return TaskResponse(
        id=str(task.id),
        title=task.title,
        description=task.description,
        due_date=task.due_date,
        priority=task.priority,
        status=task.status,
        created_at=task.created_at,
        updated_at=task.updated_at,
        subtasks=task.get_subtasks(),
        estimate_hours=task.estimate_hours
    )


@router.patch("/tasks/{task_id}/status")
async def update_task_status(
    task_id: str,
    status: str,
    db: Session = Depends(get_session)
):
    """Update task status"""
    task = db.get(Task, task_id)
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if status not in ["todo", "in_progress", "done"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    task.status = status
    db.add(task)
    db.commit()
    db.refresh(task)
    
    return {"message": "Status updated", "status": task.status}
