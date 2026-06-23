#!/usr/bin/env bash
#
# dev.sh — launch the FastAPI backend and the Vite frontend together.
#
# Usage:
#   ./scripts/dev.sh            # start both; Ctrl+C stops both cleanly
#
# Env overrides:
#   BACKEND_PORT  (default 8001)
#   FRONTEND_PORT (default 5173)
#
set -euo pipefail

# Resolve repo root regardless of where the script is called from.
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

BACKEND_PORT="${BACKEND_PORT:-8001}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"

# Pick a Python: prefer the project venv, fall back to python3.
if [ -x "$ROOT/venv/bin/uvicorn" ]; then
  UVICORN="$ROOT/venv/bin/uvicorn"
elif command -v uvicorn >/dev/null 2>&1; then
  UVICORN="uvicorn"
else
  echo "❌ uvicorn not found. Run: pip install -r requirements.txt" >&2
  exit 1
fi

if [ ! -d "$ROOT/frontend/node_modules" ]; then
  echo "📦 Installing frontend dependencies (first run)…"
  (cd "$ROOT/frontend" && npm install)
fi

# Free the ports if a stale process is holding them.
for port in "$BACKEND_PORT" "$FRONTEND_PORT"; do
  pid="$(lsof -ti ":$port" 2>/dev/null || true)"
  if [ -n "$pid" ]; then
    echo "⚠️  Port $port in use by PID $pid — stopping it."
    kill "$pid" 2>/dev/null || true
    sleep 1
  fi
done

PIDS=()
cleanup() {
  echo ""
  echo "🛑 Shutting down…"
  for pid in "${PIDS[@]:-}"; do
    kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true
  exit 0
}
trap cleanup INT TERM

echo "🚀 Backend  → http://127.0.0.1:$BACKEND_PORT  (docs: /docs)"
"$UVICORN" api.main:app --reload --port "$BACKEND_PORT" &
PIDS+=($!)

echo "🎨 Frontend → http://localhost:$FRONTEND_PORT"
(cd "$ROOT/frontend" && npm run dev -- --port "$FRONTEND_PORT") &
PIDS+=($!)

echo ""
echo "✅ Both running. Open http://localhost:$FRONTEND_PORT  ·  Press Ctrl+C to stop both."

# If either process exits, tear the whole thing down.
# (Portable poll loop — macOS ships bash 3.2, which lacks `wait -n`.)
while kill -0 "${PIDS[0]}" 2>/dev/null && kill -0 "${PIDS[1]}" 2>/dev/null; do
  sleep 1
done
cleanup
