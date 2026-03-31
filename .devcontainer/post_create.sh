#!/bin/bash
# ============================================================
# 🌱 Microgreens Tracker - GitHub Codespaces Post-Create Setup
# This runs ONCE automatically when your Codespace is created.
# ============================================================

set -e

echo ""
echo "========================================"
echo "  🌱 Microgreens Tracker - Setting Up"
echo "========================================"
echo ""

# ── 1. SYSTEM LIBS ────────────────────────────────────────
echo "[1/5] Installing system libraries for OpenCV..."
sudo apt-get update -qq
sudo apt-get install -y -qq libgl1-mesa-glx libglib2.0-0 libsm6 libxext6 libxrender-dev
echo "✅ System libraries ready."
echo ""

# ── 2. BACKEND PYTHON DEPS ────────────────────────────────
echo "[2/5] Installing Python backend dependencies..."
pip install -q --upgrade pip
pip install -q -r backend/requirements.txt
echo "✅ Backend Python packages installed."
echo ""

# ── 3. ML ENGINE DEPS ─────────────────────────────────────
echo "[3/5] Installing ML engine dependencies..."
pip install -q -r ml_engine/requirements.txt
echo "✅ ML engine packages installed."
echo ""

# ── 4. FRONTEND NODE DEPS ─────────────────────────────────
echo "[4/5] Installing frontend Node.js dependencies..."
cd frontend && npm install --silent && cd ..
echo "✅ Frontend packages installed."
echo ""

# ── 5. MODEL STATUS CHECK ─────────────────────────────────
echo "[5/5] Checking ML models..."
python3 ml_engine/setup_models.py --check || true
echo ""

echo "========================================"
echo "  ✅ Setup Complete!"
echo "========================================"
echo ""
echo "  How to run the app:"
echo ""
echo "  ── Option A: Simple (Development) ──"
echo "  bash start.sh"
echo ""
echo "  ── Option B: Docker (Production-like) ──"
echo "  docker-compose up --build"
echo ""
echo "  Ports:"
echo "  📡 Backend API  → http://localhost:8000"
echo "  📚 API Docs     → http://localhost:8000/docs"
echo "  🌐 Frontend     → http://localhost:5173 (dev) or :3000 (docker)"
echo ""
