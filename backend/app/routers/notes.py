from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.db.session import get_session
from app.models import Note
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from uuid import UUID

router = APIRouter()

class NoteCreate(BaseModel):
    title: str
    content: str
    tags: Optional[str] = None

class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[str] = None

@router.get("/notes", response_model=List[Note])
def get_notes(db: Session = Depends(get_session)):
    return db.exec(select(Note).order_by(Note.updated_at.desc())).all()

@router.post("/notes", response_model=Note)
def create_note(note_data: NoteCreate, db: Session = Depends(get_session)):
    note = Note(
        title=note_data.title,
        content=note_data.content,
        tags=note_data.tags
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note

@router.patch("/notes/{note_id}", response_model=Note)
def update_note(note_id: str, note_data: NoteUpdate, db: Session = Depends(get_session)):
    note = db.get(Note, UUID(note_id))
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    if note_data.title is not None:
        note.title = note_data.title
    if note_data.content is not None:
        note.content = note_data.content
    if note_data.tags is not None:
        note.tags = note_data.tags
    
    note.updated_at = datetime.utcnow()
    db.add(note)
    db.commit()
    db.refresh(note)
    return note

@router.delete("/notes/{note_id}")
def delete_note(note_id: str, db: Session = Depends(get_session)):
    note = db.get(Note, UUID(note_id))
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    db.delete(note)
    db.commit()
    return {"status": "success", "message": "Note deleted"}
