from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from app.db.session import get_session
from app.models import Task, Note, JournalEntry
from typing import List, Dict, Any

router = APIRouter()

@router.get("/graph")
def get_graph_data(db: Session = Depends(get_session)):
    nodes = []
    links = []

    # Fetch all data
    tasks = db.exec(select(Task)).all()
    notes = db.exec(select(Note)).all()
    journal = db.exec(select(JournalEntry)).all()

    # Create Nodes
    for t in tasks:
        nodes.append({
            "id": str(t.id),
            "group": 1, # Tasks = Purple
            "title": t.title,
            "desc": t.status,
            "val": t.priority or 1 # Use priority directly for size
        })
    
    for n in notes:
        nodes.append({
            "id": str(n.id),
            "group": 2, # Notes = Yellow
            "title": n.title,
            "desc": n.content[:50] + "...",
            "val": 1
        })

    for j in journal:
        nodes.append({
            "id": str(j.id),
            "group": 3, # Journal = Pink
            "title": j.title,
            "desc": j.mood or "neutral",
            "val": 1.5
        })

    # Semantic Linking Logic using Embeddings
    # Calculate embeddings for all nodes (using titles/content)
    # Note: For large datasets, this should be cached or pre-calculated.
    from app.services.rag import rag_service
    import numpy as np
    from sklearn.metrics.pairwise import cosine_similarity

    all_items = tasks + notes + journal
    processed_items = []
    
    # Prepare text for embedding
    texts = []
    for item in all_items:
        # Combine title and content (if available) for richer context
        content = getattr(item, 'content', '') or getattr(item, 'description', '') or ''
        text = f"{item.title} {content}".strip()
        texts.append(text)
        
        # Keep track of item metadata
        processed_items.append({
            "id": str(item.id),
            "group": 1 if isinstance(item, Task) else (2 if isinstance(item, Note) else 3)
        })

    if not texts:
        return {"nodes": nodes, "links": links}

    try:
        # Generate embeddings in batch
        embeddings = rag_service.embedder.encode(texts)
        
        # Calculate cosine similarity matrix
        similarity_matrix = cosine_similarity(embeddings)
        
        # Create links based on similarity threshold
        threshold = 0.4 # Minimum similarity to create a link
        
        for i in range(len(processed_items)):
            for j in range(i + 1, len(processed_items)):
                sim_score = similarity_matrix[i][j]
                
                if sim_score > threshold:
                    links.append({
                        "source": processed_items[i]["id"],
                        "target": processed_items[j]["id"],
                        "value": float(sim_score) * 5 # Scale value for visualization
                    })
                    
    except Exception as e:
        # Fallback to simple logic if embedding fails (or if sklearn not installed)
        print(f"Embedding linking failed: {e}")
        # ... (Keep simple logic as fallback if needed, but for now assuming success)

    return {"nodes": nodes, "links": links}
