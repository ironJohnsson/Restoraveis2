@echo off
chcp 65001 > nul
echo ========================================================
echo   INICIANDO PLATAFORMA DE ENERGIA RENOVÁVEL COM TOPSIS
echo ========================================================
echo.

:: Garante que o Node portátil está no PATH
set "PATH=C:\Users\Matheus Johnsson\.node_portable\node-v20.18.0-win-x64;%PATH%"

echo [1/2] Iniciando API Backend (Porta 5000)...
start "Backend API - TOPSIS" cmd /k "set PATH=C:\Users\Matheus Johnsson\.node_portable\node-v20.18.0-win-x64;%%PATH%% && cd backend && npm start"

echo [2/2] Iniciando Frontend React (Porta 3000)...
start "Frontend UI - TOPSIS" cmd /k "set PATH=C:\Users\Matheus Johnsson\.node_portable\node-v20.18.0-win-x64;%%PATH%% && cd frontend && npm run dev"

echo.
echo ========================================================
echo   SISTEMA INICIADO COM SUCESSO!
echo ========================================================
echo   Interface Web:     http://localhost:3000
echo   API Backend:       http://localhost:5000
echo   Swagger OpenAPI:   http://localhost:5000/api-docs
echo ========================================================
echo.
pause
