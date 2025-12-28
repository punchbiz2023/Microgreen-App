
import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.database import Base
from app.models import Seed, Crop, DailyLog
from app.services.ml_service import MLService

# Setup DB
SQLALCHEMY_DATABASE_URL = "sqlite:///./backend/microgreens_v2.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

def test_get_prediction_logic():
    print("Testing get_prediction logic...")
    
    # Get first active crop
    crop = db.query(Crop).first()
    if not crop:
        print("No crops found.")
        return

    print(f"Testing for Crop ID: {crop.id} ({crop.seed.name})")
    
    # Get logs
    logs = db.query(DailyLog).filter(DailyLog.crop_id == crop.id).order_by(DailyLog.day_number).all()
    print(f"Logs found: {len(logs)}")
    
    if not logs:
        print("No logs, logic returns default base yield.")
        return

    # Prepare data (Logic from main.py)
    seed_config = {
        'seed_type': crop.seed.seed_type,
        'name': crop.seed.name,
        'difficulty': crop.seed.difficulty,
        'base_yield': crop.seed.avg_yield_grams if crop.seed.avg_yield_grams else 500,
        'growth_days': crop.seed.growth_days,
        'ideal_temp': crop.seed.ideal_temp,
        'ideal_humidity': crop.seed.ideal_humidity
    }
    
    daily_logs = []
    for log in logs:
        daily_logs.append({
            'day': log.day_number,
            'temperature': log.temperature if log.temperature is not None else crop.seed.ideal_temp,
            'humidity': log.humidity if log.humidity is not None else crop.seed.ideal_humidity,
            'watered': log.watered
        })
        
    ml_service = MLService()
    
    try:
        print(f"DEBUG: Calling predict_yield with seed_type='{seed_config['seed_type']}'")
        prediction = ml_service.predict_yield(seed_config, daily_logs)
        print("Prediction Success!")
        print(prediction)
    except Exception as e:
        print(f"Prediction Failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_get_prediction_logic()
