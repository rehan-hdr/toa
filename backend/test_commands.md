# Test commands for Nexus MVP

## Health Check
curl http://localhost:8000/health

## Test 1: Create a task
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"I need to submit my OS assignment by Monday.\"}"

## Test 2: Send a note
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"RAG systems combine retrieval with generation for better context-aware responses.\"}"

## Test 3: Journal entry
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"Today was productive. I finished the database schema and feel good about the progress.\"}"

## Test 4: Get all tasks
curl http://localhost:8000/api/tasks

## Test 5: Get tasks by status
curl "http://localhost:8000/api/tasks?status=todo"

## Test 6: Context-aware follow-up
# First message
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"I'm working on a distributed systems project using Raft consensus.\"}"

# Follow-up (should have context from previous message)
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"What should I focus on first?\"}"
