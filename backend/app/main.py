"""
FastAPI main application
Microgreens Cultivation Tracking API
"""

from datetime import timedelta, date, datetime
from typing import List, Optional, Dict, Any
import os
import shutil
from pathlib import Path

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from pydantic import BaseModel
from fastapi.security import OAuth2PasswordRequestForm

from app.database import get_db, init_db
from app.models import User, Seed, Crop, DailyLog, Harvest, TrainingData
from app.services.ml_service import MLService
from app.services.gemini_service import get_growth_suggestion

from app.auth import (
    create_access_token, 
    get_current_active_user, 
    get_current_admin_user,
    verify_password,
    get_password_hash,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

# Initialize FastAPI app
app = FastAPI(
    title="Urban Sims API",
    description="Pro Microgreens Tracking with Custom Schedules",
    version="2.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files
UPLOAD_DIR = Path("./static/photos")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")


# --- AUTH SCHEMAS ---
class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    preference_mode: str = "home"

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    preference_mode: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str


# --- DATA SCHEMAS ---

class SeedResponse(BaseModel):
    id: int
    seed_type: str
    name: str
    latin_name: Optional[str] = None
    difficulty: str
    
    # Growing Defaults
    seed_count_per_gram: Optional[str] = None
    sow_density: Optional[str] = None
    soaking_duration_hours: Optional[float] = None
    blackout_time_days: Optional[float] = None
    germination_days: Optional[float] = None
    harvest_days: Optional[float] = None
    
    # Textual
    soaking_req: Optional[str] = None
    watering_req: Optional[str] = None
    
    # Environmental
    avg_yield_grams: Optional[int] = None
    ideal_temp: Optional[float] = None
    ideal_humidity: Optional[float] = None
    
    # Rich Info
    description: Optional[str] = None
    taste: Optional[str] = None
    nutrition: Optional[str] = None
    care_instructions: Optional[str] = None
    source_url: Optional[str] = None
    
    growth_days: int # Computed property
    
    class Config:
        from_attributes = True

class DailyLogResponse(BaseModel):
    id: int
    crop_id: int
    day_number: int
    watered: bool
    temperature: Optional[float]
    humidity: Optional[float]
    photo_path: Optional[str]
    notes: Optional[str]
    actions_recorded: List[str]
    predicted_yield: Optional[float]
    logged_at: datetime
    
    class Config:
        from_attributes = True

class CropCreate(BaseModel):
    seed_id: int
    start_datetime: datetime
    tray_size: Optional[str] = "10x20 inch"
    
    # Custom Settings (Overrides)
    custom_settings: Dict[str, Any] = {}
    # Notification Settings
    notification_settings: Dict[str, Any] = {}

class CropResponse(BaseModel):
    id: int
    seed_id: int
    start_datetime: datetime
    tray_size: Optional[str]
    status: str
    created_at: datetime
    seed: SeedResponse
    
    custom_settings: Dict[str, Any]
    notification_settings: Dict[str, Any]
    daily_logs: List[DailyLogResponse] = []
    
    class Config:
        from_attributes = True

class ActionLog(BaseModel):
    action_type: str # e.g. "water", "check_mold"
    notes: Optional[str] = None
    temperature: Optional[float] = None
    humidity: Optional[float] = None

class DailyLogCreate(BaseModel):
    day_number: int
    watered: bool = False
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    notes: Optional[str] = None
    actions_recorded: List[str] = []

class HarvestCreate(BaseModel):
    actual_weight: float
    notes: Optional[str] = None

class HarvestResponse(BaseModel):
    id: int
    crop_id: int
    actual_weight: float
    predicted_weight: float
    accuracy_percent: float
    notes: Optional[str]
    harvested_at: datetime
    
    class Config:
        from_attributes = True

class PredictionResponse(BaseModel):
    predicted_yield: float
    base_yield: int
    yield_efficiency: float
    potential_loss: float
    suggestions: List[dict]
    status: str


# --- DEPENDENCIES ---
ml_service = MLService()

@app.on_event("startup")
async def startup_event():
    try:
        init_db()
        # Initialize seeds and user
        from app.init_seeds import init_seeds, create_default_user
        db = next(get_db())
        try:
            init_seeds(db)
            create_default_user(db)
        finally:
            db.close()
    except Exception as e:
        print(f"⚠️ Startup warning: {e}")

@app.get("/")
async def root():
    return {"message": "Urban Sims API", "status": "operational", "version": "2.0.0"}


# --- AUTH ROUTES ---

@app.post("/api/auth/register", response_model=UserResponse)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = get_password_hash(user.password)
    new_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        role="user",
        preference_mode=user.preference_mode,
        default_tray_size="10x20 inch" # Default
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/api/auth/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(data={"sub": user.username}, expires_delta=access_token_expires)
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/users/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user


# --- CORE ROUTES ---

@app.get("/api/seeds", response_model=List[SeedResponse])
async def get_seeds(db: Session = Depends(get_db)):
    return db.query(Seed).all()

@app.get("/api/seeds/{seed_id}", response_model=SeedResponse)
async def get_seed(seed_id: int, db: Session = Depends(get_db)):
    seed = db.query(Seed).filter(Seed.id == seed_id).first()
    if not seed: raise HTTPException(status_code=404, detail="Seed not found")
    return seed


@app.post("/api/crops", response_model=CropResponse)
async def create_crop(
    crop_data: CropCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    seed = db.query(Seed).filter(Seed.id == crop_data.seed_id).first()
    if not seed: raise HTTPException(status_code=404, detail="Seed not found")
    
    crop = Crop(
        user_id=current_user.id,
        seed_id=crop_data.seed_id,
        start_datetime=crop_data.start_datetime,
        tray_size=crop_data.tray_size,
        custom_settings=crop_data.custom_settings,
        notification_settings=crop_data.notification_settings,
        status='active'
    )
    
    db.add(crop)
    db.commit()
    db.refresh(crop)
    return crop


@app.get("/api/crops", response_model=List[CropResponse])
async def get_crops(status: Optional[str] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    query = db.query(Crop).filter(Crop.user_id == current_user.id)
    if status: query = query.filter(Crop.status == status)
    return query.order_by(Crop.created_at.desc()).all()


@app.get("/api/crops/{crop_id}", response_model=CropResponse)
async def get_crop(crop_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    crop = db.query(Crop).filter(Crop.id == crop_id).first()
    if not crop: raise HTTPException(status_code=404, detail="Crop not found")
    if crop.user_id != current_user.id and current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Not authorized")
    return crop

@app.delete("/api/crops/{crop_id}")
async def delete_crop(crop_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    crop = db.query(Crop).filter(Crop.id == crop_id).first()
    if not crop: raise HTTPException(status_code=404, detail="Crop not found")
    
    if crop.user_id != current_user.id and current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db.delete(crop)
    db.commit()
    return {"status": "success", "message": "Crop deleted"}


# --- ACTION & LOGS ROUTES ---

@app.post("/api/crops/{crop_id}/actions")
async def log_action(
    crop_id: int,
    action: ActionLog,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Log a specific action (water, move_to_light) for today"""
    crop = db.query(Crop).filter(Crop.id == crop_id).first()
    if not crop: raise HTTPException(status_code=404, detail="Crop not found")
    
    # Calculate Day Number based on start_datetime
    now = datetime.now()
    # Simple day diff
    delta = now - crop.start_datetime.replace(tzinfo=None) + timedelta(days=1) # Day 1 starts immediately
    day_number = max(1, delta.days)
    
    # Find or Create DailyLog for today
    log = db.query(DailyLog).filter(DailyLog.crop_id == crop_id, DailyLog.day_number == day_number).first()
    
    if not log:
        log = DailyLog(
            crop_id=crop_id,
            day_number=day_number,
            actions_recorded=[action.action_type],
            watered=(action.action_type in ['water_morning', 'water_evening']),
            notes=action.notes,
            temperature=action.temperature,
            humidity=action.humidity
        )
        db.add(log)
    else:
        # Append action if not already there
        current_actions = list(log.actions_recorded)
        if action.action_type not in current_actions:
            current_actions.append(action.action_type)
            log.actions_recorded = current_actions
            
        if action.action_type in ['water_morning', 'water_evening']:
            log.watered = True
        
        if action.notes:
            log.notes = (log.notes or "") + "\n" + action.notes
            
        # Update temp/hum if provided and currently empty, or overwrite?
        # Let's overwrite/update if provided, assuming latest reading is best.
        if action.temperature is not None:
            log.temperature = action.temperature
        if action.humidity is not None:
            log.humidity = action.humidity
            
    db.commit()
    return {"status": "success", "day": day_number, "action": action.action_type}


@app.post("/api/crops/{crop_id}/logs", response_model=DailyLogResponse)
async def create_daily_log(
    crop_id: int,
    log_data: DailyLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Manual full log entry"""
    crop = db.query(Crop).filter(Crop.id == crop_id).first()
    if not crop: raise HTTPException(status_code=404, detail="Crop not found")
    
    # Ensure no duplicates per day if strictly enforced, but here we update if exists
    existing = db.query(DailyLog).filter(DailyLog.crop_id == crop_id, DailyLog.day_number == log_data.day_number).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Log for this day already exists. Use action logging to update.")

    daily_log = DailyLog(
        crop_id=crop_id,
        day_number=log_data.day_number,
        watered=log_data.watered,
        temperature=log_data.temperature,
        humidity=log_data.humidity,
        notes=log_data.notes,
        actions_recorded=log_data.actions_recorded
    )
    
    # Prediction logic (simplified for now)
    seed = crop.seed
    seed_config = {
        'seed_type': seed.seed_type,
        'base_yield': seed.avg_yield_grams,
        'growth_days': seed.growth_days
    }
    
    # logs_for_prediction... (omitted for brevity, can re-add if needed for ML)
    # prediction = ml_service.predict_yield(...)
    # daily_log.predicted_yield = prediction['predicted_yield']
    
    db.add(daily_log)
    db.commit()
    db.refresh(daily_log)
    return daily_log


@app.get("/api/crops/{crop_id}/logs", response_model=List[DailyLogResponse])
async def get_daily_logs(crop_id: int, db: Session = Depends(get_db)):
    return db.query(DailyLog).filter(DailyLog.crop_id == crop_id).order_by(DailyLog.day_number).all()


@app.post("/api/crops/{crop_id}/logs/{day}/photo")
async def upload_photo(crop_id: int, day: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    crop_dir = UPLOAD_DIR / str(crop_id)
    crop_dir.mkdir(exist_ok=True)
    
    file_extension = file.filename.split('.')[-1]
    filename = f"day_{day}_{int(datetime.now().timestamp())}.{file_extension}"
    file_path = crop_dir / filename
    
    with file_path.open('wb') as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Find or create log
    log = db.query(DailyLog).filter(DailyLog.crop_id == crop_id, DailyLog.day_number == day).first()
    if not log:
        log = DailyLog(crop_id=crop_id, day_number=day, actions_recorded=[])
        db.add(log) # Add to session
        
    log.photo_path = f"/static/photos/{crop_id}/{filename}"
    db.commit()
    
    return {"photo_url": log.photo_path}


@app.post("/api/crops/{crop_id}/harvest", response_model=HarvestResponse)
async def harvest_crop(crop_id: int, harvest_data: HarvestCreate, db: Session = Depends(get_db)):
    crop = db.query(Crop).filter(Crop.id == crop_id).first()
    if not crop: raise HTTPException(status_code=404, detail="Crop not found")
    
    # Simple harvest logic
    harvest = Harvest(
        crop_id=crop_id,
        actual_weight=harvest_data.actual_weight,
        predicted_weight=crop.seed.avg_yield_grams or 0, # Simplify
        accuracy_percent=100.0, # Placeholder
        notes=harvest_data.notes
    )
    
    crop.status = 'harvested'
    crop.harvested_at = datetime.now()
    
    db.add(harvest)
    db.commit()
    db.refresh(harvest)
    return harvest

@app.get("/api/crops/{crop_id}/harvest", response_model=HarvestResponse)
async def get_harvest(crop_id: int, db: Session = Depends(get_db)):
    harvest = db.query(Harvest).filter(Harvest.crop_id == crop_id).first()
    if not harvest: raise HTTPException(status_code=404, detail="Harvest not found")
    return harvest

@app.get("/api/stats")
async def get_stats(db: Session = Depends(get_db)):
    # Simple stats
    total = db.query(Crop).count()
    return {"total_crops": total}

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

