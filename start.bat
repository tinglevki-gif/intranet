@echo off
echo ===================================================
echo     TINGLEV ELEMENTFABRIK INTRANET - PLATFORM
echo ===================================================

set PYTHON_EXE=python
where python >nul 2>&1
if %errorlevel% neq 0 (
    if exist "%USERPROFILE%\anaconda3\python.exe" (
        set PYTHON_EXE="%USERPROFILE%\anaconda3\python.exe"
    )
)

echo [1/2] Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "FastAPI Backend" cmd /k "cd /d ""%~dp0backend"" && %PYTHON_EXE% run.py"

echo [2/2] Starting React + Vite Frontend on http://localhost:5173 ...
start "React Frontend" cmd /k "cd /d ""%~dp0frontend"" && npm.cmd run dev"

echo.
echo ===================================================
echo All services started! Open your browser at:
echo -^> Frontend Intranet: http://localhost:5173
echo -^> Swagger API Docs:  http://127.0.0.1:8000/api/v1/docs
echo -^> iCal Subscription: http://127.0.0.1:8000/api/v1/calendar/feed.ics
echo ===================================================
pause

