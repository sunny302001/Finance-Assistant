@echo off
REM FinanceFlow Backend Start Script

echo.
echo ===============================================
echo    FinanceFlow - Privacy-Preserving Finance  
echo ===============================================
echo.

REM Check if in backend directory
if not exist "api\main.py" (
    echo Error: This script must be run from the backend\ directory
    echo Please cd to backend\ and run start.bat again
    pause
    exit /b 1
)

REM Check if .env exists
if not exist ".env" (
    echo Warning: .env file not found
    echo Creating .env from .env.example...
    copy .env.example .env
    echo.
    echo IMPORTANT: Please edit .env and add your Gemini API key!
    echo Get one from: https://makersuite.google.com/app/apikey
    echo.
    pause
)

echo Starting FinanceFlow API Server...
echo.

set PYTHON_EXE=python
if exist "venv\Scripts\python.exe" (
    echo Using virtual environment...
    set PYTHON_EXE=venv\Scripts\python.exe
)

echo API will be available at: http://localhost:8000
echo API Documentation: http://localhost:8000/docs
echo.
echo Press Ctrl+C to stop the server
echo.

%PYTHON_EXE% -m uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
