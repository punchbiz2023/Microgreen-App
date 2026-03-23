---
description: 🌱 Microgreens Tracker - Application Flow & Architecture
---

# 🌱 Microgreens AI Tracker - Complete Application Workflow

This workflow summarizes the entire lifecycle of a microgreens cultivation crop within the **Urban Sims** environment, from seed selection to AI-powered harvesting and model retraining.

## 🏗️ 1. Core Architecture Overview

The application is structured into three primary layers:

1.  **Frontend (React + Vite)**: A PWA designed for mobile/desktop use. Located in `/frontend`.
2.  **Backend (FastAPI)**: REST API managing business logic, crop history, and model orchestration. Located in `/backend`.
3.  **ML Engine (Python + PyTorch/scikit-learn)**: Specialized services for yield prediction and sprout counting. Located in `/ml_engine`.

---

## 🧬 2. Lifecycle of a Crop (User Journey)

### Step A: Selection & Initial Setup
1.  **Select Seed**: User browses the **Seed Atlas** (`/atlas`) to find the desired microgreen (Arugula, Broccoli, etc.).
2.  **View Details**: In `SeedDetail.tsx`, the user views growing requirements (ideal temp, humidity, yield estimate).
3.  **Create Crop**: User clicks "Grow This" which triggers `POST /api/crops` in the backend. 
    - Initial settings (tray size: 10x20", start date) are saved in `microgreens.db`.

### Step B: Daily Cultivation & Logging
1.  **Daily Log (User Input)**: User logs environmental data (temperature, humidity, watering) via `POST /api/crops/{id}/actions` or `POST /api/crops/{id}/logs`.
2.  **Photo Analysis**: 
    - User uploads a sprout photo to `/api/crops/{id}/logs/{day}/photo`.
    - **Smart Count**: Backend can call `POST /api/count-plants` which uses the `DeepForest` or `YOLO` engine to count sprouts and return an annotated image with centroids.
3.  **AI Predictions**: 
    - Each log entry triggers the `ml_service.predict_yield()` function.
    - An ensemble of **Random Forest** and **Neural Network** models calculates the expected final yield based on historical performance and current conditions.
4.  **Growth Guidance**: 
    - The `GeminiService` (Google AI) analyzes the current log and generates "Smart Suggestions" (e.g., "Humidity is high, increase ventilation to prevent mold").

### Step C: Harvest & Accuracy Reporting
1.  **Harvest Now**: On the predicted harvest day, the user records the actual weight in `Harvest.tsx` (`POST /api/crops/{id}/harvest`).
2.  **Compare Results**: The system compares `predicted_weight` vs `actual_weight` to calculate accuracy.
3.  **Continuous Improvement**: 
    - The new harvest data is recorded in `crops.csv` (or `TrainingData` table).
    - The `retrain.py` script (if scheduled) uses this new real-world data to fine-tune the yield prediction models.

---

## 🛠️ 3. ML Models & Services

### 🧠 Yield Prediction Ensemble
- **Input**: Crop type, day count, cumulative temp, watering consistency.
- **Models**: Scikit-Learn (Random Forest) 40% + TensorFlow (Neural Network) 60%.
- **Output**: Estimated grams at harvest + yield efficiency %.
- **Files**: `ml_engine/prediction_service.py`, `ml_engine/train_model.py`.

### 📸 Sprout Counting (Computer Vision)
- **DeepForest**: Custom RetinaNet architecture trained for dense sprout detection.
- **YOLO**: Alternative high-speed detection (uses clustering for leaf-to-plant mapping).
- **OpenCV**: Classic contour-based counting as a fallback.
- **Files**: `ml_engine/count_deepforest.py`, `ml_engine/count_sprout.py`.

---

## 🤖 4. AI Interaction (Chatbot & Assistant)
The app includes a dedicated AI Chatbot (`/api/ai/chat`) powered by **Google Gemini**.
- Context-aware advice on microgreens pests, lighting, and nutrient needs.
- Integration: `app/services/gemini_service.py`.

---

## 📝 5. Key File Reference for Developers

| Module | Core Logic File(s) | Role |
| :--- | :--- | :--- |
| **Backend API** | `backend/app/main.py` | Main entry point & routes |
| **Database** | `backend/app/models.py` | SQLAlchemy schemas (User, Crop, Log, Harvest) |
| **Frontend** | `frontend/src/App.tsx` | App routes (Home, Dashboard, Atlas, Harvest) |
| **ML Models** | `ml_engine/models/` | Trained model partitions (`.h5`, `.joblib`) |
| **Counting** | `ml_engine/count_deepforest.py` | AI sprout counting core |
| **Prediction** | `ml_engine/prediction_service.py` | Yield ensemble prediction logic |

---
