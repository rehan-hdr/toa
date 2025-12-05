@echo off
echo Starting Nexus MVP Backend...
cd backend
call venv\Scripts\activate
python -m app.main
