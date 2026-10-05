#!/usr/bin/env sh
# Inicialização rápida em modo desenvolvimento (Linux / macOS)
set -e
cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo "[ERRO] Node.js não encontrado no PATH. Instale o Node.js 18 ou superior: https://nodejs.org" >&2
  exit 1
fi

for projeto in backend frontend; do
  if [ ! -d "$projeto/node_modules" ]; then
    echo "[0/2] Instalando dependências do $projeto..."
    (cd "$projeto" && npm install)
  fi
done

echo "[1/2] Iniciando API Backend (porta 5000)..."
(cd backend && npm start) &
PID_API=$!
trap 'kill "$PID_API" 2>/dev/null' EXIT INT TERM

echo "[2/2] Iniciando Frontend React (porta 3000)..."
echo "  Interface Web:   http://localhost:3000"
echo "  Swagger OpenAPI: http://localhost:5000/api-docs"
cd frontend && npm run dev
