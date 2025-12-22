"""
SQLAlchemy database models
"""

from sqlalchemy import Column, Integer, String, Float, Boolean, Date, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import re


class User(Base):
    """User model with preferences"""
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="user") # 'admin' or 'user'
    
    # New Preference Fields
    preference_mode = Column(String(20), default="home") # 'home' or 'pro'
    default_tray_size = Column(String(50), default="10x20 inch")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    crops = relationship('Crop', back_populates='user', cascade='all, delete-orphan')


class Seed(Base):
    """Seed type catalog with rich metadata"""
    __tablename__ = 'seeds'
    
    id = Column(Integer, primary_key=True, index=True)
    seed_type = Column(String(50), nullable=False)  # slug
    name = Column(String(100), nullable=False)
    latin_name = Column(String(100), nullable=True)
    difficulty = Column(String(50), nullable=False)
    
    # Growing specifics (Defaults)
    seed_count_per_gram = Column(String(50), nullable=True)
    sow_density = Column(String(50), nullable=True)
    soaking_duration_hours = Column(Float, nullable=True) # New: hours
    blackout_time_days = Column(Float, nullable=True) # New: days
    germination_days = Column(Float, nullable=True) # Changed from string to float (avg)
    harvest_days = Column(Float, nullable=True) # Changed from string to float (avg/max)
    
    # Textual instructions kept for display
    soaking_req = Column(String(50), nullable=True) # 'No', 'Yes', '8-12h'
    watering_req = Column(String(50), nullable=True)
    
    # Environmental Defaults
    avg_yield_grams = Column(Integer, nullable=True)
    ideal_temp = Column(Float, nullable=True)
    ideal_humidity = Column(Float, nullable=True)
    temp_tolerance = Column(Float, nullable=False, default=2.5)
    humidity_tolerance = Column(Float, nullable=False, default=10)
    
    # Rich Info
    description = Column(Text, nullable=True)
    taste = Column(Text, nullable=True)
    nutrition = Column(Text, nullable=True)
    care_instructions = Column(Text, nullable=True) # New
    source_url = Column(String(255), nullable=True)
    
    # Relationships
    crops = relationship('Crop', back_populates='seed')

    @property
    def growth_days(self):
        """Backwards compatibility helper"""
        return int(self.harvest_days) if self.harvest_days else 10


class Crop(Base):
    """Individual crop instance with custom schedule"""
    __tablename__ = 'crops'
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    seed_id = Column(Integer, ForeignKey('seeds.id'), nullable=False)
    
    # Time Tracking
    start_datetime = Column(DateTime(timezone=True), nullable=False) # Changed from Date
    harvested_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Settings & State
    tray_size = Column(String(50), nullable=True)
    status = Column(String(20), nullable=False, default='active')  # 'active', 'harvested', 'failed'
    
    # Custom Configurations (JSON)
    # e.g., { "soak_hours": 4, "blackout_days": 3, "watering_freq": 2 }
    custom_settings = Column(JSON, nullable=False, default={}) 
    
    # Notification Preferences (JSON)
    # e.g., { "enabled": true, "times": ["08:00", "18:00"] }
    notification_settings = Column(JSON, nullable=False, default={})
    
    # Relationships
    user = relationship('User', back_populates='crops')
    seed = relationship('Seed', back_populates='crops')
    daily_logs = relationship('DailyLog', back_populates='crop', cascade='all, delete-orphan')
    harvest = relationship('Harvest', back_populates='crop', uselist=False, cascade='all, delete-orphan')
    training_data = relationship('TrainingData', back_populates='crop', uselist=False, cascade='all, delete-orphan')


class DailyLog(Base):
    """Daily environmental data and action tracking"""
    __tablename__ = 'daily_logs'
    
    id = Column(Integer, primary_key=True, index=True)
    crop_id = Column(Integer, ForeignKey('crops.id'), nullable=False)
    day_number = Column(Integer, nullable=False)
    
    # Status
    watered = Column(Boolean, nullable=False, default=False) # Legacy simple flag
    
    # New: Track specific actions completed this day
    # e.g., ["water_morning", "water_evening", "check_mold"]
    actions_recorded = Column(JSON, nullable=False, default=[]) 
    
    # Environmental
    temperature = Column(Float, nullable=True) # Made nullable as action logging might not always have temp
    humidity = Column(Float, nullable=True)
    photo_path = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    
    predicted_yield = Column(Float, nullable=True)
    logged_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    crop = relationship('Crop', back_populates='daily_logs')


class Harvest(Base):
    """Harvest results"""
    __tablename__ = 'harvests'
    
    id = Column(Integer, primary_key=True, index=True)
    crop_id = Column(Integer, ForeignKey('crops.id'), nullable=False)
    actual_weight = Column(Float, nullable=False)
    predicted_weight = Column(Float, nullable=False)
    accuracy_percent = Column(Float, nullable=False)
    notes = Column(Text, nullable=True)
    harvested_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    crop = relationship('Crop', back_populates='harvest')


class TrainingData(Base):
    """Aggregated data for ML"""
    __tablename__ = 'training_data'
    
    id = Column(Integer, primary_key=True, index=True)
    crop_id = Column(Integer, ForeignKey('crops.id'), nullable=False)
    seed_type = Column(String(50), nullable=False)
    daily_logs_json = Column(JSON, nullable=False)
    final_yield = Column(Float, nullable=False)
    extra_data = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    crop = relationship('Crop', back_populates='training_data')

