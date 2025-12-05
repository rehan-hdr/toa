"""
Chat router - main interaction endpoint
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.schemas import ChatRequest, ChatResponse, TaskInfo
from app.db import get_session
from app.services.storage import get_storage_service
from app.services.llm_service import get_llm_service

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    db: Session = Depends(get_session),
    storage: any = Depends(get_storage_service),
    llm: any = Depends(get_llm_service)
):
    """
    Main chat endpoint
    
    Pipeline:
    1. Store user message
    2. Retrieve relevant context
    3. Query LLM
    4. Parse response
    5. Store assistant message
    6. Create task if needed
    7. Return response
    """
    try:
        # 1. Store user message
        user_message = storage.store_message(
            db=db,
            text=request.message,
            sender="user"
        )
        
        # 2. Retrieve context
        context = storage.retrieve_context(
            query=request.message,
            n_results=5
        )
        
        # 3. Query LLM
        parsed_json, assistant_reply = llm.query(
            user_message=request.message,
            context=context
        )
        
        # 4. Store assistant message
        # Note: ChromaDB metadata only supports str, int, float, bool - not lists/arrays
        safe_metadata = {
            "category": parsed_json.get('category', 'unknown'),
            "has_task": "true" if parsed_json.get('task') else "false"
        }
        
        assistant_message = storage.store_message(
            db=db,
            text=assistant_reply,
            sender="assistant",
            category=parsed_json.get('category'),
            summary=parsed_json.get('summary'),
            metadata=safe_metadata
        )
        
        # 5. Create task if needed
        produced_task = None
        if parsed_json.get('task') is not None:
            task = storage.create_task(
                db=db,
                task_data=parsed_json['task'],
                source_message_id=user_message.id
            )
            
            produced_task = TaskInfo(
                id=str(task.id),
                title=task.title,
                description=task.description,
                due_date=task.due_date.isoformat() if task.due_date else None,
                priority=task.priority,
                subtasks=task.get_subtasks(),
                estimate_hours=task.estimate_hours
            )
        
        # 6. Return response
        return ChatResponse(
            response=assistant_reply,
            category=parsed_json.get('category', 'other'),
            summary=parsed_json.get('summary', ''),
            produced_task=produced_task
        )
        
    except Exception as e:
        print(f"❌ Chat error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
