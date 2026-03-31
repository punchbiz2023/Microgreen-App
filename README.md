# 🌱 Microgreens AI Tracker

An AI-powered Progressive Web App for tracking microgreens cultivation with real-time yield predictions and smart growing suggestions.

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/punchbiz2023/Microgreen-App)

---

## ✨ Features

- **🧬 Seed Atlas**: Browse and select from 7 microgreens varieties with difficulty ratings and yield estimates
- **📊 AI Yield Predictions**: Random Forest + Neural Network ensemble predicting final yield (96%+ accuracy)
- **📈 Live Timeline**: Visual day-by-day progress tracking with status indicators
- **🤖 Smart Suggestions**: Real-time growing recommendations powered by Gemini AI
- **📸 Smart Plant Counting**: Automatic detection and counting of microgreen sprouts using a fine-tuned DeepForest model
- **📸 Photo Logging**: Daily photo uploads to track visual progress
- **🎯 Harvest Analysis**: Detailed comparison of predicted vs actual yields
- **🔄 Continuous Learning**: Model automatically retrains with each harvest

---

## 🚀 Quick Start

### Option 1: GitHub Codespaces (Easiest — No Install Needed)

1. Click the **"Open in GitHub Codespaces"** badge above, or go to the repo → **Code** → **Create codespace on main**
2. Wait ~2 minutes for the environment to auto-configure (dependencies install automatically)
3. In the terminal, run:
   ```bash
   bash start.sh
   ```
4. VS Code will auto-open the app in your browser. Done ✅

---

### Option 2: Local — Simple Script

```bash
# 1. Clone the repo
git clone https://github.com/punchbiz2023/Microgreen-App.git
cd Microgreen-App

# 2. Run everything in one command
bash start.sh
```

Ports:
- 🌐 **Frontend** → http://localhost:5173
- 📡 **Backend API** → http://localhost:8000
- 📚 **API Docs** → http://localhost:8000/docs

---

### Option 3: Docker (Production-like, clean isolated environment)

```bash
# 1. Clone and enter
git clone https://github.com/punchbiz2023/Microgreen-App.git
cd Microgreen-App

# 2. Build and run all containers
docker-compose up --build

# (or run in background)
docker-compose up --build -d
```

Ports:
- 🌐 **Frontend** → http://localhost:3000
- 📡 **Backend API** → http://localhost:8000
- 📚 **API Docs** → http://localhost:8000/docs

To stop:
```bash
docker-compose down
```

---

## 🧠 ML Models

This project uses two AI models:

| Model | Purpose | Location |
|---|---|---|
| `rf_model.pkl` + `nn_model.h5` | **Yield Prediction** (Random Forest + Neural Network ensemble) | `data/models/` |
| `sprout_model.pl` | **Sprout Detection** (fine-tuned DeepForest / RetinaNet) | `ml_engine/models/` (Git LFS) |

> **Note**: The yield prediction models are included in the repository (~50MB). 
> The sprout detection model (~245MB) is stored via **Git LFS** and is downloaded automatically when you clone/open in Codespaces.

If the sprout model is missing, the app still fully works — only the **Plant Counting** feature will show an error.

---

## 🏗️ Tech Stack

### Frontend
- React 18 + TypeScript
- Tailwind CSS + Recharts
- Vite + PWA Plugin

### Backend
- FastAPI (Python 3.11)
- SQLAlchemy ORM + SQLite
- Pydantic validation

### ML Engine
- **Yield Prediction**: scikit-learn (Random Forest) + TensorFlow/Keras (Neural Network)
- **Sprout Detection**: DeepForest (RetinaNet) + PyTorch Lightning
- **AI Suggestions**: Google Gemini API

---

## 📁 Project Structure

```
Microgreen-App/
├── .devcontainer/          # GitHub Codespaces configuration
│   ├── devcontainer.json
│   └── post_create.sh      # Auto-runs on Codespace creation
├── frontend/               # React PWA
│   ├── src/
│   └── Dockerfile
├── backend/                # FastAPI server
│   ├── app/
│   │   ├── main.py         # API endpoints
│   │   ├── models.py       # Database models
│   │   └── services/       # ML, AI, counting services
│   └── Dockerfile
├── ml_engine/              # ML training + inference
│   ├── models/             # Sprout detection model (Git LFS)
│   ├── prediction_service.py
│   ├── count_sprout.py
│   └── setup_models.py     # Model setup utility
├── data/
│   └── models/             # Yield prediction models (pkl, h5)
├── docker-compose.yml      # Docker stack
└── start.sh                # One-command local/Codespaces runner
```

---

## 🔧 Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./microgreens.db` | Database connection |
| `GEMINI_API_KEY` | *(optional)* | Google Gemini API key for AI suggestions |
| `ALLOWED_ORIGINS` | `*` | CORS allowed origins |

For Codespaces, set secrets at: **GitHub** → **Settings** → **Codespaces** → **Secrets**

---

## 📊 Model Performance

- **Yield Prediction** (ensemble): R² = 96.88%, MAE = 14.68g
- **Sprout Detection**: Custom fine-tuned DeepForest on microgreens dataset

---

## 📄 License

MIT License — See LICENSE file for details

Built with ❤️ for microgreens enthusiasts
