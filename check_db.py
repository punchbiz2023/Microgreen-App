
import sys
import os
sys.path.append(os.getcwd())

from app.database import SessionLocal
from app.models import Crop, Seed, DailyLog

db = SessionLocal()
try:
    active_crops = db.query(Crop).filter(Crop.status == 'active').all()
    print(f"Found {len(active_crops)} active crops")
    for crop in active_crops:
        print(f"Crop ID: {crop.id}, Seed: {crop.seed.name}, Started: {crop.start_datetime}")
        print(f"  Logs: {len(crop.daily_logs)}")
        for log in crop.daily_logs:
            print(f"    Day {log.day_number}: Actions {log.actions_recorded}")
finally:
    db.close()
