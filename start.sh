#!/bin/bash
# ============================================================
# 🌱 Microgreens Tracker - Simple Start Script
# Run this after cloning or opening in GitHub Codespaces.
# Works on Linux / macOS / GitHub Codespaces.
# ============================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo ""
echo -e "${GREEN}========================================"
echo "  🌱 Microgreens Tracker - Setup & Run"
echo -e "========================================${NC}"
echo ""

# ── 1. PYTHON DEPENDENCIES ────────────────────────────────
echo -e "${YELLOW}[1/4] Installing backend Python dependencies...${NC}"
pip install -q -r backend/requirements.txt
pip install -q -r ml_engine/requirements.txt
echo -e "${GREEN}✅ Python dependencies installed.${NC}"
echo ""

# ── 2. NODE DEPENDENCIES ──────────────────────────────────
echo -e "${YELLOW}[2/4] Installing frontend Node dependencies...${NC}"
cd frontend && npm install --silent && cd ..
echo -e "${GREEN}✅ Node dependencies installed.${NC}"
echo ""

# ── 3. MODEL CHECK ────────────────────────────────────────
echo -e "${YELLOW}[3/4] Checking ML models...${NC}"
python3 ml_engine/setup_models.py --check || true  # Don't fail startup if model missing
echo ""

# ── 4. START SERVICES ─────────────────────────────────────
echo -e "${YELLOW}[4/4] Starting Backend and Frontend...${NC}"
echo ""
echo -e "${GREEN}  📡 Backend API  → http://localhost:8000${NC}"
echo -e "${GREEN}  🌐 Frontend     → http://localhost:5173${NC}"
echo -e "${GREEN}  📚 API Docs     → http://localhost:8000/docs${NC}"
echo ""
echo -e "${YELLOW}  Press Ctrl+C to stop.${NC}"
echo ""

# Start backend in background
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
cd ..

# Start frontend (in foreground)
cd frontend
npm run dev -- --host 0.0.0.0
cd ..

# Cleanup on exit
kill $BACKEND_PID 2>/dev/null || true
