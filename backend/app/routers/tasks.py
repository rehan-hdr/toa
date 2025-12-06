from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from app.db.session import get_session
from app.models import Task
from typing import List, Optional
from pydantic import BaseModel

from app.core.logging_config import logger

router = APIRouter()

@router.get("/tasks")
def get_tasks(
    status: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_session)
):
    logger.debug(f"Fetching tasks with status={status} limit={limit}")
    query = select(Task)
    if status:
        query = query.where(Task.status == status)
    query = query.order_by(Task.created_at.desc()).limit(limit)
    tasks = db.exec(query).all()
    logger.info(f"Retrieved {len(tasks)} tasks")
    
    # Enrich with subtasks list for response
    result = []
    for t in tasks:
        t_dict = t.model_dump()
        t_dict["subtasks"] = t.get_subtasks()
        result.append(t_dict)
    return result

@router.get("/tasks/{task_id}")
def get_task(task_id: str, db: Session = Depends(get_session)):
    task = db.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    t_dict = task.model_dump()
    t_dict["subtasks"] = task.get_subtasks()
    return t_dict

class TaskStatusUpdate(BaseModel):
    status: str

@router.patch("/tasks/{task_id}/status")
def update_task_status(task_id: str, status_update: TaskStatusUpdate, db: Session = Depends(get_session)):
    logger.debug(f"Updating task {task_id} status to {status_update.status}")
    task = db.get(Task, task_id)
    if not task:
        logger.warning(f"Task {task_id} not found for update")
        raise HTTPException(status_code=404, detail="Task not found")
    
    task.status = status_update.status
    db.add(task)
    db.commit()
    db.refresh(task)
    logger.info(f"Task {task_id} status updated to {task.status}")
    return {"status": "success", "task_id": task_id, "new_status": task.status}

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    priority: int = 1
    due_date: Optional[str] = None
    status: str = "todo"
    tags: Optional[str] = None

@router.post("/tasks")
def create_task(task_data: TaskCreate, db: Session = Depends(get_session)):
    logger.info(f"Creating new task: {task_data.title}")
    task = Task(
        title=task_data.title,
        description=task_data.description,
        priority=task_data.priority,
        due_date=task_data.due_date,
        status=task_data.status,
        tags=task_data.tags
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task

@router.delete("/tasks/{task_id}")
def delete_task(task_id: str, db: Session = Depends(get_session)):
    logger.info(f"Deleting task: {task_id}")
    task = db.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    db.delete(task)
    db.commit()
    return {"status": "success", "message": f"Task {task_id} deleted"}
