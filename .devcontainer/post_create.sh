#!/bin/bash

echo "🚀 Setting up Microgreens Tracker environment..."

# 1. Install Backend Dependencies
echo "🐍 Installing Python dependencies..."
python3 -m pip install --upgrade pip
pip install -r backend/requirements.txt
pip install -r ml_engine/requirements.txt

# 2. Install Frontend Dependencies
echo "📦 Installing Node dependencies..."
cd frontend
npm install
cd ..

# 3. Setup Models
echo "🌱 Running model setup utility..."
python3 ml_engine/setup_models.py --check

echo "✅ Environment setup complete!"
echo "👉 To start the backend: cd backend && python main.py"
echo "👉 To start the frontend: cd frontend && npm run dev"
