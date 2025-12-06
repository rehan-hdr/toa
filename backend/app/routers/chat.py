from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.db.session import get_session
from app.models import Message, Task, Conversation
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
2. "chat": For general conversation.

JSON Schema:
{
  "category": "task" | "choice",
  "reply": "assistant response string",
  "summary": "short summary string",
  "task": {
    "title": "string",
    "due_date": "ISO8601 string or null",
    "priority": "int 1-5",
    "subtasks": ["string"] or null,
    "estimate_hours": "float"
  }
}

Example Task:
User: "Remind me to clean"
Output: {"category": "task", "reply": "Added task.", "summary": "Clean", "task": {"title": "Clean", "due_date": null, "priority": 3, "subtasks": null, "estimate_hours": 1.0}}
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
        logger.info(f"Found {len(tasks)} active tasks for context")
        tasks_str = "\n".join([f"- {t.title} (Priority: {t.priority}, Status: {t.status})" for t in tasks]) if tasks else "No active tasks"

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
