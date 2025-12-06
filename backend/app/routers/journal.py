from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.db.session import get_session
from app.models import JournalEntry
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from uuid import UUID

router = APIRouter()

class JournalCreate(BaseModel):
    title: str
    content: str
    mood: Optional[str] = None
    tags: Optional[str] = None

class JournalUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    mood: Optional[str] = None
    tags: Optional[str] = None

@router.get("/journal", response_model=List[JournalEntry])
def get_journal_entries(db: Session = Depends(get_session)):
    return db.exec(select(JournalEntry).order_by(JournalEntry.created_at.desc())).all()

@router.post("/journal", response_model=JournalEntry)
def create_journal_entry(entry_data: JournalCreate, db: Session = Depends(get_session)):
    entry = JournalEntry(
        title=entry_data.title,
        content=entry_data.content,
        mood=entry_data.mood,
        tags=entry_data.tags
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry

@router.patch("/journal/{entry_id}", response_model=JournalEntry)
def update_journal_entry(entry_id: str, entry_data: JournalUpdate, db: Session = Depends(get_session)):
    entry = db.get(JournalEntry, UUID(entry_id))
    if not entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    
    if entry_data.title is not None:
        entry.title = entry_data.title
    if entry_data.content is not None:
        entry.content = entry_data.content
    if entry_data.mood is not None:
        entry.mood = entry_data.mood
    if entry_data.tags is not None:
        entry.tags = entry_data.tags
    
    entry.updated_at = datetime.utcnow()
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry

@router.delete("/journal/{entry_id}")
def delete_journal_entry(entry_id: str, db: Session = Depends(get_session)):
    entry = db.get(JournalEntry, UUID(entry_id))
    if not entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    db.delete(entry)
    db.commit()
    return {"status": "success", "message": "Journal entry deleted"}
