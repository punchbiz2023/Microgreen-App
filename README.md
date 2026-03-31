# 🌱 Microgreens Tracker

An AI-powered Progressive Web App for tracking microgreens cultivation with real-time yield predictions and smart growing suggestions.

---

## ✨ Features

- **🧬 Seed Atlas**: Browse and select from over 30 microgreens varieties with difficulty ratings and yield estimates
- **📊 AI Yield Predictions**: Random Forest + Neural Network ensemble predicting final yield (96%+ accuracy)
- **📈 Live Timeline**: Visual day-by-day progress tracking with status indicators
- **🤖 Smart Expert Guide**: Real-time growing recommendations powered by Gemini AI
- **📸 Smart Plant Counting**: Automatic detection and counting of microgreen sprouts using a fine-tuned DeepForest model
- **📸 Photo Logging**: Daily photo uploads to track visual progress
- **🎯 Harvest Analysis**: Detailed comparison of predicted vs actual yields
- **🔄 Continuous Learning**: Model automatically retrains with each harvest

---

## 🚀 Quick Start (Docker — Recommended)

This is the cleanest and most reliable way to run the project in any environment (Local or Codespaces).

```bash
# 1. Clone the repo
git clone https://github.com/punchbiz2023/Microgreen-App.git
cd Microgreen-App

# 2. Build and run all containers
docker-compose up --build -d
```

Ports:
- 🌐 **Frontend** → http://localhost:3000
- 📡 **Backend API** → http://localhost:8000
- 📚 **API Docs** → http://localhost:8000/docs/

To stop the app:
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

> **Note**: The yield prediction models (~50MB) are included in the repository. 
> The sprout detection model (~245MB) is stored via **Git LFS** and is downloaded automatically when you clone the project.

---

## 🏗️ Tech Stack

### Frontend
- React 18 + TypeScript + Tailwind CSS
- Recharts + Vite + PWA Plugin

### Backend
- FastAPI (Python 3.11)
- SQLAlchemy ORM + PostgreSQL
- Pydantic validation

### ML Engine
- **Yield Prediction**: scikit-learn (Random Forest) + TensorFlow/Keras (Neural Network)
- **Sprout Detection**: DeepForest (RetinaNet) + PyTorch Lightning
- **AI Suggestions**: Google Gemini API

---

## 📁 Project Structure

```
Microgreen-App/
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
└── docker-compose.yml      # Docker stack (PostgreSQL + Backend + Frontend)
```

---

## 📄 License

MIT License — See LICENSE file for details

Built with ❤️ for microgreens enthusiasts
