@echo off
chcp 65001 > nul
setlocal
cd /d "%~dp0"

echo ========================================================
echo   INICIANDO PLATAFORMA DE ENERGIA RENOVAVEL COM TOPSIS
echo ========================================================
echo.

where node > nul 2> nul
if errorlevel 1 (
  echo [ERRO] Node.js nao encontrado no PATH.
  echo        Instale o Node.js 18 ou superior em https://nodejs.org e tente novamente.
  pause
  exit /b 1
)

if not exist "backend\node_modules" (
  echo [0/2] Instalando dependencias do backend...
  pushd backend
  call npm install
  popd
)
if not exist "frontend\node_modules" (
  echo [0/2] Instalando dependencias do frontend...
  pushd frontend
  call npm install
  popd
)

echo [1/2] Iniciando API Backend (Porta 5000)...
start "Backend API - TOPSIS" cmd /k "cd /d ""%~dp0backend"" && npm start"

echo [2/2] Iniciando Frontend React (Porta 3000)...
start "Frontend UI - TOPSIS" cmd /k "cd /d ""%~dp0frontend"" && npm run dev"

echo.
echo ========================================================
echo   Interface Web:     http://localhost:3000
echo   API Backend:       http://localhost:5000
echo   Swagger OpenAPI:   http://localhost:5000/api-docs
echo ========================================================
echo.
pause
