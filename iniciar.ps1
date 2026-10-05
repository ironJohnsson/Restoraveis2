# Inicialização rápida em modo desenvolvimento (Windows PowerShell)
$ErrorActionPreference = 'Stop'
$raiz = $PSScriptRoot

Write-Host "========================================================" -ForegroundColor Green
Write-Host "  INICIANDO PLATAFORMA DE ENERGIA RENOVÁVEL COM TOPSIS  " -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[ERRO] Node.js não encontrado no PATH. Instale o Node.js 18 ou superior em https://nodejs.org" -ForegroundColor Red
    exit 1
}

foreach ($projeto in 'backend', 'frontend') {
    if (-not (Test-Path (Join-Path $raiz "$projeto\node_modules"))) {
        Write-Host "[0/2] Instalando dependências do $projeto..." -ForegroundColor Cyan
        Push-Location (Join-Path $raiz $projeto)
        npm install
        Pop-Location
    }
}

Write-Host "`n[1/2] Iniciando API Backend (Porta 5000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$raiz\backend'; npm start"

Write-Host "[2/2] Iniciando Frontend React (Porta 3000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$raiz\frontend'; npm run dev"

Write-Host "`n========================================================" -ForegroundColor Green
Write-Host "  -> Interface Web:     http://localhost:3000" -ForegroundColor Yellow
Write-Host "  -> API Backend:       http://localhost:5000" -ForegroundColor Yellow
Write-Host "  -> Swagger Docs:      http://localhost:5000/api-docs" -ForegroundColor Yellow
Write-Host "========================================================`n" -ForegroundColor Green
