from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.db.session import get_session
from app.models import Message, Task, Conversation, Note, JournalEntry
from app.services.llm import generate_response
from app.services.rag import rag_service
from app.core.logging_config import logger
from pydantic import BaseModel
from typing import Optional, List
import json
from uuid import UUID

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    category: str
    summary: str
    conversation_id: Optional[str] = None
    produced_task: Optional[dict] = None

SYSTEM_PROMPT = """You are Nexus, a local AI assistant.
You strictly output valid JSON only. No markdown, no explanations.

Instructions:
1. "task": If user implies a future action (remind, schedule, I need to, todo), use "category": "task" and fill "task" object.
2. "note": If user wants to save information/thoughts (note this, remember that, save note), use "category": "note" and fill "note" object.
3. "journal": If user is reflecting, expressing feelings, or says "dear diary", use "category": "journal" and fill "journal" object.
4. "chat": For general conversation.

JSON Schema:
{
  "category": "task" | "note" | "journal" | "chat",
  "reply": "assistant response string",
  "summary": "short summary string",
  "task": {
    "title": "string",
    "due_date": "ISO8601 string or null",
    "priority": "int 1-5",
    "subtasks": ["string"] or null,
    "estimate_hours": "float"
  },
  "note": {
    "title": "string",
    "content": "string",
    "tags": "comma separated string"
  },
  "journal": {
    "title": "string",
    "content": "string",
    "mood": "happy|neutral|sad"
  }
}

Example Task:
User: "Remind me to clean"
Output: {"category": "task", "reply": "Added task.", "summary": "Clean", "task": {"title": "Clean", "due_date": null, "priority": 3, "subtasks": null, "estimate_hours": 1.0}, "note": null, "journal": null}

Example Note:
User: "Note that the code is in python"
Output: {"category": "note", "reply": "Saved note.", "summary": "Code lang", "task": null, "note": {"title": "Code Language", "content": "The code is in python", "tags": "coding, python"}, "journal": null}
"""

class ConversationResponse(BaseModel):
    id: str
    title: str
    created_at: str

@router.get("/conversations", response_model=List[ConversationResponse])
def get_conversations(db: Session = Depends(get_session)):
    conversations = db.exec(select(Conversation).order_by(Conversation.created_at.desc())).all()
    return [
        ConversationResponse(
            id=str(c.id), 
            title=c.title, 
            created_at=c.created_at.isoformat()
        ) for c in conversations
    ]

@router.get("/conversations/{conversation_id}/messages")
def get_conversation_messages(conversation_id: str, db: Session = Depends(get_session)):
    try:
        uuid_obj = UUID(conversation_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid conversation ID format")
        
    messages = db.exec(
        select(Message)
        .where(Message.conversation_id == uuid_obj)
        .order_by(Message.timestamp)
    ).all()
    
    return [
        {
            "role": m.sender,
            "content": m.text,
            "category": m.category,
            "summary": m.summary
        } for m in messages
    ]

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, db: Session = Depends(get_session)):
    try:
        # Get or Create Conversation
        conversation_id = request.conversation_id
        if not conversation_id:
            # Create new conversation with title based on first message
            title = request.message[:30] + "..." if len(request.message) > 30 else request.message
            conv = Conversation(title=title)
            db.add(conv)
            db.commit()
            db.refresh(conv)
            conversation_id = str(conv.id)
        else:
            # Verify exists
            conv = db.get(Conversation, UUID(conversation_id))
            if not conv:
                raise HTTPException(status_code=404, detail="Conversation not found")

        # 1. RAG Retrieve
        logger.debug(f"Querying RAG for: {request.message}")
        context_docs = rag_service.query(request.message)
        logger.info(f"Retrieved {len(context_docs)} context documents from RAG")
        context_str = "\n".join(context_docs) if context_docs else "None"
        
        # 2. Build Prompt
        # Fetch active tasks
        logger.debug("Fetching active tasks for context...")
        tasks = db.exec(
            select(Task).where(Task.status.in_(["todo", "in_progress"])).limit(10)
        ).all()
        tasks_str = "\n".join([f"- {t.title} (Priority: {t.priority}, Status: {t.status})" for t in tasks]) if tasks else "No active tasks"

        # Fetch recently completed tasks
        done_tasks = db.exec(
            select(Task).where(Task.status == "done").order_by(Task.updated_at.desc()).limit(5)
        ).all()
        done_str = "\n".join([f"- {t.title} (Completed: {t.updated_at.strftime('%Y-%m-%d')})" for t in done_tasks]) if done_tasks else "No recently completed tasks"

        # Fetch recent notes
        recent_notes = db.exec(
            select(Note).order_by(Note.updated_at.desc()).limit(5)
        ).all()
        notes_str = "\n".join([f"- {n.title}: {n.content[:50]}..." for n in recent_notes]) if recent_notes else "No recent notes"

        # Fetch recent journal
        recent_journal = db.exec(
            select(JournalEntry).order_by(JournalEntry.created_at.desc()).limit(3)
        ).all()
        journal_str = "\n".join([f"- {j.created_at.strftime('%Y-%m-%d')}: {j.title} ({j.mood or 'No mood'})" for j in recent_journal]) if recent_journal else "No recent journal entries"

        # Fetch recent history for context (last 5 messages)
        logger.debug(f"Fetching chat history for conversation: {conversation_id}")
        history = db.exec(
            select(Message)
            .where(Message.conversation_id == UUID(conversation_id))
            .order_by(Message.timestamp.desc())
            .limit(5)
        ).all()
        history.reverse()
        
        history_str = "\n".join([f"{m.sender}: {m.text}" for m in history])
        
        prompt = f"""Context from Knowledge Base:
{context_str}

Current Active Tasks:
{tasks_str}

Recently Completed Tasks:
{done_str}

Recent Notes:
{notes_str}

Recent Journal Entries:
{journal_str}

Chat History:
{history_str}

User Message: {request.message}"""
        
        # 3. Call LLM
        logger.info(f"Processing chat message: {request.message}")
        result = await generate_response(prompt, SYSTEM_PROMPT)
        
        # 4. Save User Message
        msg = Message(
            conversation_id=UUID(conversation_id),
            text=request.message,
            sender="user",
            category=result.get("category"),
            summary=result.get("summary")
        )
        db.add(msg)
        
        # 5. Handle Result
        response_text = result.get("reply", "I processed your request.")
        category = result.get("category", "chat")
        summary = result.get("summary", "No summary")
        
        # Update conversation title if generic
        if len(history) == 0:
            conv = db.get(Conversation, UUID(conversation_id))
            if conv and summary:
                conv.title = summary
                db.add(conv)
        
        # Save Assistant Message
        asst_msg = Message(
            conversation_id=UUID(conversation_id),
            text=response_text,
            sender="assistant",
            category=category,
            summary=summary,
            metadata_json=json.dumps(result.get("task")) if category == "task" and "task" in result else None
        )
        db.add(asst_msg)
        
        # Handle Categories
        produced_task = None
        
        if category == "task" and "task" in result:
             task_data = result["task"]
             logger.info(f"LLM produced a task: {task_data.get('title')}")
             # Create Task
             task = Task(
                 title=task_data.get("title", "Untitled Task"),
                 description=request.message, 
                 priority=task_data.get("priority"),
                 status="todo",
                 estimate_hours=task_data.get("estimate_hours")
             )
             if task_data.get("subtasks"):
                 task.set_subtasks(task_data["subtasks"])
                 
             db.add(task)
             db.commit()
             db.refresh(task)
             logger.info(f"Task saved to DB with ID: {task.id}")
             produced_task = {
                 "id": str(task.id),
                 "title": task.title,
                 "due_date": str(task.due_date) if task.due_date else None,
                 "priority": task.priority,
                 "subtasks": task.get_subtasks(),
                 "estimate_hours": task.estimate_hours
             }
             
        elif category == "note" and "note" in result:
            note_data = result["note"]
            if note_data:
                logger.info(f"LLM produced a note: {note_data.get('title')}")
                note = Note(
                    title=note_data.get("title", "Untitled Note"),
                    content=note_data.get("content", request.message),
                    tags=note_data.get("tags")
                )
                db.add(note)
                db.commit()
            
        elif category == "journal" and "journal" in result:
            journal_data = result["journal"]
            if journal_data:
                logger.info(f"LLM produced a journal entry: {journal_data.get('title')}")
                entry = JournalEntry(
                    title=journal_data.get("title", "Daily Entry"),
                    content=journal_data.get("content", request.message),
                    mood=journal_data.get("mood", "neutral")
                )
                db.add(entry)
                db.commit()

        # Save to RAG
        rag_service.add_document(f"User: {request.message}\nAssistant: {response_text}")
        
        db.commit()
        logger.info("Chat request processed successfully")
        
        return ChatResponse(
            response=response_text,
            category=category,
            summary=summary,
            conversation_id=conversation_id,
            produced_task=produced_task
        )

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        return ChatResponse(
            response="Sorry, I encountered an error. Please try again.",
            category="error",
            summary="Error",
            conversation_id=request.conversation_id
        )
