# Nexus MVP Backend

Local LLM Knowledge + Task Assistant - Complete privacy, local-only processing.

## 🎯 What This Does

Nexus is a locally-hosted AI assistant that:
- Accepts your thoughts, notes, tasks, and journal entries
- Automatically categorizes them (task, note, idea, journal, question, other)
- Stores everything locally (SQLite + ChromaDB)
- Uses RAG to retrieve relevant context
- Responds using a local LLM (tinyllama via Ollama)
- Creates tasks automatically when detected
- **Never sends data to the cloud**

## 🛠 Prerequisites

1. **Python 3.10+**
2. **Ollama** - Install from: https://ollama.ai/download
3. **Git** (optional)

## 📦 Installation

### Step 1: Install Ollama and Pull Model

```bash
# Install Ollama from https://ollama.ai/download
# Then pull the tinyllama model:
ollama pull tinyllama
```

### Step 2: Set Up Python Environment

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

## 🚀 Running the Backend

```bash
# Make sure Ollama is running (it starts automatically on install)
# Make sure virtual environment is activated

# Run the server
uvicorn app.main:app --reload

# Or use Python directly
python -m app.main
```

The server will start at: **http://localhost:8000**

API Documentation: **http://localhost:8000/docs**

## 🧪 Testing

### Test 1: Basic Health Check

```bash
curl http://localhost:8000/health
```

### Test 2: Send a Task Message

```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"I need to submit my OS assignment by Monday.\"}"
```

Expected response:
```json
{
  "response": "I've created a task for your OS assignment due Monday.",
  "category": "task",
  "summary": "Submit OS assignment by Monday",
  "produced_task": {
    "id": "...",
    "title": "Submit OS assignment",
    "due_date": "2025-12-08",
    "priority": 8,
    "subtasks": ["Review assignment requirements", "Complete implementation", "Test code", "Submit"]
  }
}
```

### Test 3: Send a Note

```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"RAG systems combine retrieval with generation for better context.\"}"
```

### Test 4: Get All Tasks

```bash
curl http://localhost:8000/api/tasks
```

### Test 5: Context-Aware Follow-up

```bash
# First message
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"I'm working on a distributed systems project.\"}"

# Follow-up (should have context)
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"What should I focus on first?\"}"
```

## 📊 Database Verification

After testing, check the database:

```bash
# Install sqlite3 if not available
# Windows: Download from https://sqlite.org/download.html

for wahaj:
& "C:\sqlite\sqlite3.exe" nexus.db

# Open database
sqlite3 nexus.db

# View messages
SELECT sender, category, substr(text, 1, 50) as preview FROM message ORDER BY timestamp DESC LIMIT 10;

# View tasks
SELECT title, status, priority, due_date FROM task ORDER BY created_at DESC;

# Exit
.exit
```

## 📁 Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app
│   ├── db.py                # Database setup
│   ├── models.py            # SQLModel models
│   ├── schemas.py           # Pydantic schemas
│   ├── prompts.py           # LLM prompts
│   ├── routers/
│   │   ├── chat.py          # /chat endpoint
│   │   └── tasks.py         # /tasks endpoints
│   └── services/
│       ├── embedder.py      # Sentence transformers
│       ├── chroma_client.py # ChromaDB integration
│       ├── llm_service.py   # Ollama/tinyllama
│       └── storage.py       # Storage coordination
├── requirements.txt
├── nexus_system_prompt.md   # System prompt
├── nexus.db                 # SQLite database (created on first run)
└── chroma_data/             # ChromaDB storage (created on first run)
```

## 🔧 Configuration

All configuration is in the code. Key settings:

- **LLM Model**: `tinyllama` (in `app/services/llm_service.py`)
- **Embedding Model**: `all-MiniLM-L6-v2` (in `app/services/embedder.py`)
- **Database**: `nexus.db` (in `app/db.py`)
- **ChromaDB**: `./chroma_data` (in `app/services/chroma_client.py`)
- **Port**: `8000` (in `app/main.py`)

## 🐛 Troubleshooting

### "Ollama not found" error
```bash
# Make sure Ollama is installed and running
ollama list  # Should show tinyllama

# If tinyllama is not listed:
ollama pull tinyllama
```

### "Module not found" errors
```bash
# Make sure virtual environment is activated
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

### Database errors
```bash
# Delete and recreate database
rm nexus.db
rm -rf chroma_data/

# Restart server (it will recreate tables)
python -m app.main
```

### Slow first response
The first request will be slow because:
1. Loading embedding model (~2-3 seconds)
2. Initializing ChromaDB
3. First LLM inference

Subsequent requests will be much faster.

## 📝 API Endpoints

### POST /api/chat
Main interaction endpoint. Send a message, get a response.

**Request:**
```json
{
  "message": "Your message here"
}
```

**Response:**
```json
{
  "response": "Assistant reply",
  "category": "task|note|idea|journal|question|other",
  "summary": "Brief summary",
  "produced_task": {
    "id": "uuid",
    "title": "Task title",
    "description": "Details",
    "due_date": "ISO date",
    "priority": 1-10,
    "subtasks": ["step 1", "step 2"],
    "estimate_hours": 2.5
  }
}
```

### GET /api/tasks
Get all tasks.

**Query params:**
- `status`: Filter by status (todo, in_progress, done)
- `limit`: Max results (default: 50)

### GET /api/tasks/{task_id}
Get specific task by ID.

### PATCH /api/tasks/{task_id}/status
Update task status.

**Body:**
```json
{
  "status": "todo|in_progress|done"
}
```

## 🔒 Privacy & Security

✅ **All processing is local**
- No cloud API calls
- No telemetry
- No external network requests

✅ **Your data stays on your machine**
- SQLite database: `nexus.db`
- ChromaDB vectors: `chroma_data/`
- Both in the backend directory

✅ **Delete everything anytime**
```bash
rm nexus.db
rm -rf chroma_data/
```

## 🚀 Next Steps

This is the MVP backend. Ready for:
- Frontend development (React, Electron, etc.)
- Additional endpoints
- More sophisticated categorization
- User preferences
- Export/import functionality
- Multi-user support (future)

## 📄 License

MIT License - Use freely for personal or commercial projects.

---

**Built with ❤️ using FastAPI, Ollama, ChromaDB, and SQLModel**
