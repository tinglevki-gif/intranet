# ==============================================================================
# Script de Despliegue Automático al Homelab (Tinglev Elementfabrik Intranet)
# Servidor: admin-server@192.168.1.29
# Ruta Remota: ~/intranet-server/
# ==============================================================================

param(
    [string]$CommitMessage = "Update intranet features and deployments",
    [switch]$SkipGitPush = $false
)

$ErrorActionPreference = "Stop"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "🚀 Iniciando Despliegue en Homelab (admin-server@192.168.1.29)..." -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

# 1. Git Commit & Push
if (-not $SkipGitPush) {
    Write-Host "[1/3] Preparando cambios en Git local..." -ForegroundColor Yellow
    git add .
    $status = git status --porcelain
    if ($status) {
        Write-Host "Realizando commit: $CommitMessage" -ForegroundColor Green
        git commit -m $CommitMessage
    } else {
        Write-Host "No hay cambios locales pendientes de commit." -ForegroundColor Gray
    }

    Write-Host "Enviando cambios a GitHub (origin/main)..." -ForegroundColor Yellow
    git push origin main
}

# 2. Conexión y Despliegue Remoto en el Servidor
Write-Host "[2/3] Conectando a admin-server@192.168.1.29 y actualizando ~/intranet-server/..." -ForegroundColor Yellow

$RemoteCommands = @"
cd ~/intranet-server/ && \
git pull origin main && \
sudo docker compose up -d --build && \
sudo docker compose ps
"@

try {
    ssh -o ConnectTimeout=10 admin-server@192.168.1.29 "$RemoteCommands"
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host "✅ Despliegue completado con éxito en admin-server@192.168.1.29!" -ForegroundColor Green
    Write-Host "============================================================" -ForegroundColor Green
} catch {
    Write-Host "⚠️ No se pudo completar el comando SSH directo automáticamente: $_" -ForegroundColor Red
    Write-Host "Para habilitar el despliegue automático sin contraseña por SSH, agrega tu clave pública:" -ForegroundColor Yellow
    Write-Host "Clave pública (C:\Users\Humbert\.ssh\id_ed25519.pub):" -ForegroundColor Cyan
    Get-Content "C:\Users\Humbert\.ssh\id_ed25519.pub" -ErrorAction SilentlyContinue
}
