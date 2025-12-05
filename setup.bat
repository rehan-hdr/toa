@echo off
echo ================================
echo NEXUS MVP SETUP
echo ================================
echo.

echo [1/3] Installing Ollama model...
ollama pull tinyllama
echo.

echo [2/3] Creating virtual environment...
cd backend
python -m venv venv
echo.

echo [3/3] Installing Python dependencies...
call venv\Scripts\activate
pip install -r requirements.txt
echo.

echo ================================
echo SETUP COMPLETE!
echo ================================
echo.
echo To start the server:
echo 1. cd backend
echo 2. venv\Scripts\activate
echo 3. python -m app.main
echo.
echo Server will run at: http://localhost:8000
echo API docs at: http://localhost:8000/docs
echo.
pause
