# Launcher PowerShell para Tinglev Elementfabrik Intranet
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "    TINGLEV ELEMENTFABRIK - INTRANET PLATFORM       " -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

# Find Python executable
$PythonExe = "python"
$cmd = Get-Command python -ErrorAction SilentlyContinue
if (-not $cmd -or $cmd.Source -like "*WindowsApps*") {
    if (Test-Path "$env:USERPROFILE\anaconda3\python.exe") {
        $PythonExe = "$env:USERPROFILE\anaconda3\python.exe"
    }
}

# Start Backend
Write-Host "[1/2] Starting FastAPI Backend on http://127.0.0.1:8000 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot/backend'; & '$PythonExe' run.py"

# Start Frontend
Write-Host "[2/2] Starting React + Vite Frontend on http://localhost:5173 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot/frontend'; cmd.exe /c npm run dev"

Write-Host ""
Write-Host "All services running! Open your browser at:" -ForegroundColor Green
Write-Host "-> Frontend Intranet: http://localhost:5173" -ForegroundColor White
Write-Host "-> Swagger API Docs:  http://127.0.0.1:8000/api/v1/docs" -ForegroundColor White
Write-Host "===================================================" -ForegroundColor Cyan
