# 🌱 Microgreens AI Tracker

An AI-powered Progressive Web App for tracking microgreens cultivation with real-time yield predictions and smart growing suggestions.

## Features

- **🧬 Seed Atlas**: Browse and select from 7 microgreens varieties with difficulty ratings and yield estimates
- **📊 AI Predictions**: Random Forest + Neural Network ensemble predicting final yield with 96%+ accuracy
- **📈 Live Timeline**: Visual day-by-day progress tracking with status indicators
- **🤖 Smart Suggestions**: Real-time recommendations based on environmental conditions
- **📸 Photo Logging**: Daily photo uploads to track visual progress
- **🎯 Harvest Analysis**: Detailed comparison of predicted vs actual yields
- **📸 Smart Plant Counting**: Automatic detection and counting of microgreen sprouts using DeepForest AI
- **🔄 Continuous Learning**: Model automatically retrains with each harvest for improved accuracy
- **📱 PWA Support**: Install on mobile devices, works offline

## Tech Stack

### Frontend
- React 18 + TypeScript
- Tailwind CSS
- Recharts for visualizations
- Vite + PWA Plugin
- Web Push Notifications

### Backend
- FastAPI (Python)
- SQLAlchemy ORM
- PostgreSQL / SQLite
- Pydantic validation

### ML Engine
- **🤖 Plant Counting (Computer Vision)**:
  - DeepForest (RetinaNet architecture)
  - PyTorch Lightning
  - OpenCV for image processing
  - Custom fine-tuned models for microgreens
- scikit-learn (Random Forest)
- TensorFlow/Keras (Neural Network)
- pandas + numpy
- Ensemble prediction (RF 40% + NN 60%)

## Quick Start

### Using Docker (Recommended)

```bash
# Clone the repository
git clone <repo-url>
cd "Urban sims"

# Start all services
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Manual Setup

#### 1. ML Model Training

> [!IMPORTANT]
> The pre-trained ML model weight files (`*.pt`, `*.h5`, `*.pl`) are included in this repository. Due to their large size, it is recommended to use **Git LFS** if you encounter issues pushing to a remote repository.

```bash
cd ml_engine

# Install dependencies
pip install -r requirements.txt

# (Optional) Generate synthetic training data or train models
# python generate_synthetic_data.py
# python train_model.py
```

#### 2. Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Initialize database (seeds from data/33_microgreens_full-1.csv)
python -m app.init_seeds

# Start API server
python -m app.main
```

#### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Access at `http://localhost:5173`

## Usage Guide

### 1. Select Seeds
- Browse the Seed Atlas
- Check difficulty rating and average yield
- Click "Grow This" to start

### 2. Customize Setup
- Choose watering frequency (1x or 2x daily)
- Set start date (today or backdate)
- Specify tray size (optional)

### 3. Daily Logging
- Log environmental conditions daily
- Input temperature and humidity
- Mark if you watered
- Upload progress photo (optional)
- Add notes

### 4. Monitor Progress
- View timeline with completed/missed days
- Check yield gauge prediction
- Read AI suggestions for optimization
- Click past days to view history

### 5. Harvest
- On final day, click "Harvest Now"
- Enter actual harvested weight
- View prediction accuracy report
- Data automatically added to training set

## Model Performance

- **Initial Accuracy**: 96.88% R² on synthetic data
- **Test MAE**: 14.68g average error
- **Prediction Accuracy**: 
  - Within ±20g: 71%
  - Within ±30g: 91%
  - Within ±50g: 99%

### Key Features Importance
1. Base yield (23.3%)
2. Seed type (16.8%)
3. Watering consistency (9.2%)
4. Growth days (6.3%)
5. Missed watering days (5.8%)

## Project Structure

```
Urban sims/
├── frontend/              # React PWA
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Route pages
│   │   └── services/     # API client
│   └── public/           # Static assets
├── backend/              # FastAPI server
│   └── app/
│       ├── models.py     # Database models
│       ├── main.py       # API endpoints
│       └── services/     # Business logic
├── ml_engine/            # ML training pipeline
│   ├── generate_synthetic_data.py
│   ├── train_model.py
│   ├── prediction_service.py
│   ├── count_deepforest.py    # AI plant counting engine
│   ├── DEEPFOREST_EXPLAINED.md # Beginner's guide to the AI
│   └── retrain.py
└── data/                 # Data storage
    ├── models/           # Trained ML models
    └── synthetic_crops.csv
```

## API Endpoints

### Seeds
- `GET /api/seeds` - List all seed types
- `GET /api/seeds/{id}` - Get seed details

### Crops
- `POST /api/crops` - Create new crop
- `GET /api/crops` - List user's crops
- `GET /api/crops/{id}` - Get crop details

### Logs
- `POST /api/crops/{id}/logs` - Submit daily log
- `GET /api/crops/{id}/logs` - Get all logs
- `POST /api/crops/{id}/logs/{day}/photo` - Upload photo

### Predictions
- `GET /api/predictions/{crop_id}` - Get yield prediction

### Harvest
- `POST /api/crops/{id}/harvest` - Record harvest
- `GET /api/crops/{id}/harvest` - Get harvest details

## Environment Variables

### Backend
```env
DATABASE_URL=sqlite:///./microgreens.db
API_HOST=0.0.0.0
API_PORT=8000
ALLOWED_ORIGINS=http://localhost:3000
```

### Frontend
```env
VITE_API_URL=http://localhost:8000
```

## Development

### Running Tests
```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

### Building for Production
```bash
# Frontend
cd frontend
npm run build

# Backend (Docker recommended)
cd backend
docker build -t microgreens-backend .
```

## Future Enhancements

- [ ] Multi-crop management (track multiple trays)
- [ ] IoT sensor integration (auto-log temp/humidity)
- [ ] Community features (share results, compare yields)
- [ ] Time-lapse photo compilation
- [ ] Export growth data as CSV/PDF
- [ ] Marketplace for selling excess harvest
- [ ] Mobile native apps (React Native)

## Contributing

Contributions welcome! 
## License

MIT License - See LICENSE file for details

## Credits

Built with ❤️ for microgreens enthusiasts

