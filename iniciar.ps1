# Script PowerShell para inicialização rápida
$nodePath = "C:\Users\Matheus Johnsson\.node_portable\node-v20.18.0-win-x64"
$env:Path = "$nodePath;$env:Path"

Write-Host "========================================================" -ForegroundColor Green
Write-Host "  INICIANDO PLATAFORMA DE ENERGIA RENOVÁVEL COM TOPSIS  " -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green

Write-Host "`n[1/2] Iniciando API Backend (Porta 5000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:Path = '$nodePath;' + `$env:Path; Set-Location '$PSScriptRoot\backend'; npm start"

Write-Host "[2/2] Iniciando Frontend React (Porta 3000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:Path = '$nodePath;' + `$env:Path; Set-Location '$PSScriptRoot\frontend'; npm run dev"

Write-Host "`n========================================================" -ForegroundColor Green
Write-Host "  Tudo pronto! Acesse as URLs:" -ForegroundColor Green
Write-Host "  -> Interface Web:     http://localhost:3000" -ForegroundColor Yellow
Write-Host "  -> API Backend:       http://localhost:5000" -ForegroundColor Yellow
Write-Host "  -> Swagger Docs:      http://localhost:5000/api-docs" -ForegroundColor Yellow
Write-Host "========================================================`n" -ForegroundColor Green
