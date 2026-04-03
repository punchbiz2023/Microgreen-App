# 🌱 Microgreens Tracker

**Microgreens Tracker** is an AI-powered Progressive Web App (PWA) designed to revolutionize small-scale cultivation. Using high-precision yield prediction models and automated sprout detection, it helps growers optimize their harvest cycles with data-driven insights.

---

## ✨ Features

- **🧬 Seed Atlas**: Detailed growing specs for 30+ varieties including difficulty, yield, and blackout times.
- **📊 AI Yield Forecasts**: Dual-model ensemble (Random Forest + Neural Network) predicting weight with 96%+ accuracy.
- **📸 Sprout Detection**: Automated counting using a fine-tuned DeepForest (RetinaNet) model (requires Git LFS).
- **🤖 AI Growing Coach**: Context-aware cultivation tips powered by Google Gemini.
- **🎯 Harvest Analysis**: Compare predicted vs. actual yields to improve future performance.
- **🔄 Smart Tasks**: Sequential daily maintenance (Mist 1 & Mist 2) with locked workflows.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: v18 or later
- **Python**: v3.11 or later
- **Git LFS**: Required for downloading the large sprout detection model (~250MB)
- **Gemini API Key**: (Optional) For AI cultivation tips (`GEMINI_API_KEY` in `.env`)
- **OpenGL Library** (Linux/WSL only): Required for sprout detection model

#### Linux/WSL: Install OpenGL Library
The sprout detection model (DeepForest) requires OpenGL. Install it with:
```bash
# Ubuntu/Debian
sudo apt-get install -y libgl1

# RHEL/CentOS/Fedora
sudo dnf install -y libGL

# Alpine
apk add --no-cache libglu
```
**Error if missing**: `libGL.so.1: cannot open shared object file: No such file or directory`

### 2. Get the Code & Models
```bash
# Clone the repository
git clone https://github.com/punchbiz2023/Microgreen-App.git
cd Microgreen-App

# CRITICAL: Initialize and download the AI models via Git LFS
git lfs install
git lfs pull
```

### 3. Backend Setup (AI & API)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```
*API will be available at: http://127.0.0.1:8000*

### 4. Frontend Setup (PWA)
```bash
cd ../frontend
npm install
npm run dev
```
*Web app will be available at: http://localhost:5173*

### 5. Run the whole app locally (no Docker)
Use this if you want a single command flow for local development:
```bash
# From repo root
cd /workspaces/Microgreen-App

# 1) Prepare backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000 &

# 2) Prepare frontend
cd ../frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5173 &

# 3) Confirm
curl -I http://127.0.0.1:8000
curl -I http://127.0.0.1:5173
```

*Backend API:* http://127.0.0.1:8000
*Frontend UI:* http://localhost:5173

---

## 🧠 AI & ML Architecture

### Sprout Counting (DeepForest)
The sprout detector uses a specialized computer vision model stored in `ml_engine/models/sprout_model.pl`. 
- **Requirement**: You MUST have **Git LFS** installed to pull this file.
- **Usage**: When you upload a photo in the "Smart Count" section, the backend runs this model to detect individual sprouts.

### Yield Prediction (Ensemble)
The system uses a combination of `rf_model.pkl` and `nn_model.h5` located in `data/models/`.
- Predictions are updated in real-time as you log daily tasks.
- A "Watering Score" is calculated based on your Mist 1 & 2 logs to refine accuracy.

---

## 🏁 Operational Commands Summary

| Command | Purpose |
|---|---|
| `git lfs pull` | Downloads large model files |
| `npm run build` | Prepare production frontend bundle |
| `docker-compose up` | Run the entire stack in isolated containers |

---

## 📁 Project Structure highlights

- `/frontend`: React + TypeScript PWA
- `/backend`: FastAPI server & Model Inference
- `/ml_engine`: Model training and DeepForest configuration
- `/data/models`: Serialized yield prediction models

---

## 📄 License
MIT License — See LICENSE for details.

Built for the next generation of urban farmers. 🌿
