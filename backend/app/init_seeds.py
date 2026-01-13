"""
Initialize seed catalog from CSV dataset
"""

import csv
import os
import json
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.models import Seed, User, Crop, DailyLog, Harvest, TrainingData
from app.database import SessionLocal, init_db

# Path to the CSV file - adjust relative path as needed
# Assuming script is run from backend/ directory or root
CSV_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), '33_microgreens_full-1.csv')

def parse_range_avg(value_str):
    """Parse '3-4' to 3.5, or '10' to 10.0"""
    if not value_str or str(value_str).strip() == '': return 0.0
    try:
        import re
        nums = [float(x) for x in re.findall(r"[\d\.]+", str(value_str))]
        if not nums: return 0.0
        return sum(nums) / len(nums)
    except:
        return 0.0

def clean_slug(text):
    if not text: return "unknown"
    return text.lower().strip().replace(' ', '-').replace('/', '-').replace(',', '').replace('"', '').replace('(', '').replace(')', '')

def wipe_database(db: Session):
    """Hard reset of all data except admin user"""
    print("WARNING: Wiping all data...")
    
    # Delete children first
    db.query(TrainingData).delete()
    db.query(Harvest).delete()
    db.query(DailyLog).delete()
    
    # Delete crops
    db.query(Crop).delete()
    
    # Delete all seeds
    db.query(Seed).delete()
    
    # Delete non-admin users
    # We will keep ANY admin user, delete others.
    db.query(User).filter(User.role != 'admin').delete()
    
    db.commit()
    print("Database wiped (Admins preserved).")

def init_seeds(db: Session):
    """Initialize seed catalog from CSV"""
    
    print(f"Looking for CSV at: {CSV_PATH}")
    if not os.path.exists(CSV_PATH):
        print(f"Error: CSV file not found at {CSV_PATH}")
        return

    # Wipe Data - DISABLED for persistence
    # wipe_database(db) 
    
    print("Updating Seed Database...")

    print("Initializing Seed Database...")
    added_count = 0
    
    # Try reading with appropriate encoding
    encoding = 'utf-8'
    try:
        with open(CSV_PATH, 'r', encoding=encoding) as f:
            f.read(100)
    except:
        encoding = 'latin1'
        
    print(f"Reading CSV with encoding: {encoding}")

    with open(CSV_PATH, 'r', encoding=encoding) as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            # Check for required fields to avoid empty rows
            crop_name = row.get('Crop', '').strip()
            if not crop_name:
                continue
                
            seed_type_slug = clean_slug(crop_name)
            
            # Map Fields
            
            # Times
            soak_time_raw = row.get('Soaking Time', '')
            sprout_time_raw = row.get('Sprout Time', '')
            growth_time_raw = row.get('Growth Time (Days)', '')
            
            soak_hours = parse_range_avg(soak_time_raw) if 'hour' in str(soak_time_raw).lower() else 0.0
            
            germination_days = parse_range_avg(sprout_time_raw)
            harvest_days = parse_range_avg(growth_time_raw)
            blackout_days = max(0, germination_days - 1) # Estimation if not provided
            
            # Weights
            seed_weight_raw = row.get('Seed Weight (gm)', '0')
            harvest_weight_raw = row.get('Harvest Weight (gm)', '0')
            
            seed_weight_g = parse_range_avg(seed_weight_raw)
            harvest_weight_g = parse_range_avg(harvest_weight_raw)
            
            # Rich Data
            links = []
            if row.get('Link 1'): links.append({"url": row.get('Link 1'), "desc": row.get('Link 1 Description', 'Link 1')})
            if row.get('Link 2'): links.append({"url": row.get('Link 2'), "desc": row.get('Link 2 Description', 'Link 2')})
            if row.get('Link 3'): links.append({"url": row.get('Link 3'), "desc": row.get('Link 3 Description', 'Link 3')})
            
            seed_data = {
                'seed_type': seed_type_slug,
                'name': crop_name,
                'latin_name': '', # Not in new CSV
                'difficulty': 'Medium', # Default
                
                # New Fields
                'suggested_seed_weight': seed_weight_g,
                'avg_yield_grams': int(harvest_weight_g) if harvest_weight_g else 500,
                
                'soaking_duration_hours': soak_hours,
                'germination_days': germination_days,
                'harvest_days': harvest_days,
                'blackout_time_days': blackout_days,
                
                # Textual
                'soaking_req': soak_time_raw,
                'watering_req': 'Regular', # Default
                
                # Metadata
                'nutrition': row.get('Nutritional Benefits', ''),
                'pros': row.get('Suitable For (Pros)', ''),
                'cons': row.get('Not Suitable For (Cons)', ''),
                'external_links': links, # Store as JSON list
                
                'description': f"A variety of {crop_name}. Known for: {row.get('Nutritional Benefits', '')[:100]}...",
                'care_instructions': f"Suggested soaking: {soak_time_raw}. Sprout time: {sprout_time_raw}. Growth time: {growth_time_raw}.",
                
                # Defaults
                'humidity_tolerance': 10.0,
            }

            # Enrichment: Add Fertilizer and Growth Tips
            name_lower = crop_name.lower()
            if 'sunflower' in name_lower:
                seed_data['fertilizer_info'] = "Sunflowers benefit from a pinch of Calcium and Magnesium in the water after Day 4."
                seed_data['growth_tips'] = "Apply a heavy weight on top during the blackout phase to help them shed their seed hulls."
            elif 'broccoli' in name_lower:
                seed_data['fertilizer_info'] = "Low-dose Nitrogen fertilizer can help if leaves look yellow towards Day 8."
                seed_data['growth_tips'] = "Very sensitive to light; ensure even exposure to avoid 'leggy' stems."
            elif 'pea' in name_lower:
                seed_data['fertilizer_info'] = "Peas generally don't need fertilizer if using a rich soil medium."
                seed_data['growth_tips'] = "Harvest when the second set of leaves (tendrils) just starts to appear for the best flavor."
            elif 'radish' in name_lower:
                seed_data['fertilizer_info'] = "Balanced liquid seaweed fertilizer at 25% strength works wonders on Day 5."
                seed_data['growth_tips'] = "Radishes grow extremely fast! Keep a close eye on them from Day 6 onwards."
            else:
                seed_data['fertilizer_info'] = "Most microgreens thrive with just clean, pH-balanced water (6.0-6.5)."
                seed_data['growth_tips'] = "Ensure good airflow to prevent surface mold especially during the blackout phase."
            
            try:
                # Check for existing seed by slug
                existing_seed = db.query(Seed).filter(Seed.seed_type == seed_type_slug).first()
                if existing_seed:
                    for key, value in seed_data.items():
                        setattr(existing_seed, key, value)
                    print(f"Updated: {crop_name}")
                else:
                    seed = Seed(**seed_data)
                    db.add(seed)
                    print(f"Added: {crop_name}")
                
                db.flush() 
                added_count += 1
            except Exception as e:
                print(f"FAILED to process row {row.get('S.No')}: {crop_name}")
                print(f"Error: {e}")
                db.rollback() 
                
    db.commit()
    print(f"Seed Processing Complete: {added_count} seeds processed.")


def create_default_user(db: Session):
    """Create default user for single-user mode"""
    try:
        from app.auth import get_password_hash
    except ImportError:
        # Fallback for script usage without full app context
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        def get_password_hash(p): return pwd_context.hash(p)

    existing_user = db.query(User).filter(User.username == 'default').first()
    if existing_user:
        if not existing_user.hashed_password:
             existing_user.hashed_password = get_password_hash("secret")
             existing_user.role = "admin" 
             db.commit()
        return existing_user
    
    # Try finding ANY admin
    any_admin = db.query(User).filter(User.role == 'admin').first()
    if any_admin:
        print(f"Admin user found: {any_admin.username}")
        return any_admin

    user = User(
        username='default',
        email='user@microgreens.app',
        hashed_password=get_password_hash("secret"),
        role='admin'
    )
    db.add(user)
    db.commit()
    print("Created default user (password: secret)")
    return user


if __name__ == '__main__':
    # Initialize database tables
    try:
        init_db()  
    except Exception as e:
        print(f"Warning during init_db: {e}")
    
    # Create session
    db = SessionLocal()
    
    try:
        # Initialize seeds (wipes data)
        init_seeds(db)
        
        # Create default user
        create_default_user(db)
        
        print("\nDatabase initialization complete!")
    finally:
        db.close()
