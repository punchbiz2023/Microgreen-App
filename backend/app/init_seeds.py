"""
Initialize seed catalog from CSV dataset
"""

import csv
import os
from sqlalchemy.orm import Session
from app.models import Seed, User
from app.database import SessionLocal, init_db

# Path to the CSV file - adjust relative path as needed
# Assuming script is run from backend/ directory or root
CSV_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'mpseeds_dataset_complete.csv')

def init_seeds(db: Session):
    """Initialize seed catalog from CSV"""
    
    print(f"Looking for CSV at: {CSV_PATH}")
    if not os.path.exists(CSV_PATH):
        print(f"Error: CSV file not found at {CSV_PATH}")
        return

    # Clear existing seeds (optional, but good for idempotent runs with fresh data)
    # db.query(Seed).delete()
    # db.commit()
    
    added_count = 0
    updated_count = 0
    
    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            variety_name = row.get('variety', '').strip()
            if not variety_name:
                continue
                
            seed_type_slug = variety_name.lower().replace(' ', '-').replace(',', '').replace('"', '')
            
            # Check if exists
            existing = db.query(Seed).filter(Seed.seed_type == seed_type_slug).first()
            
            def parse_range_avg(value_str):
                """Parse '3-4' to 3.5, or '10' to 10.0"""
                if not value_str: return None
                try:
                    import re
                    nums = [float(x) for x in re.findall(r"[\d\.]+", str(value_str))]
                    if not nums: return None
                    return sum(nums) / len(nums)
                except:
                    return None

            # Parse numeric fields
            blackout_days_val = parse_range_avg(row.get('blackout_time_days'))
            germination_days_val = parse_range_avg(row.get('germination_days'))
            harvest_days_val = parse_range_avg(row.get('growth_period_days'))
            
            # Parse soaking (e.g., "Yes, 8-12 hours" -> 10.0)
            soaking_str = row.get('soaking', '')
            soaking_hours_val = parse_range_avg(soaking_str) if 'hour' in str(soaking_str).lower() else None
            
            seed_data = {
                'seed_type': seed_type_slug,
                'name': variety_name,
                'latin_name': row.get('latin_name', ''),
                'difficulty': row.get('difficulty_level', 'Medium'),
                
                # New Numeric Fields
                'seed_count_per_gram': row.get('seed_count_per_gram'),
                'sow_density': row.get('sow_density_10x20_tray_g'),
                'soaking_duration_hours': soaking_hours_val,
                'blackout_time_days': blackout_days_val,
                'germination_days': germination_days_val,
                'harvest_days': harvest_days_val,
                
                # Textual kept for display
                'soaking_req': row.get('soaking'),
                'watering_req': row.get('watering'),
                
                # Metadata
                'taste': row.get('taste'),
                'nutrition': row.get('nutrition_benefits'),
                'source_url': row.get('source_url'),
                'description': f"A {row.get('difficulty_level', 'standard')} microgreen. {row.get('taste', '')}.",
                'care_instructions': f"Blackout: {row.get('blackout_time_days')} days. Harvest: {row.get('growth_period_days')} days. Soak: {row.get('soaking')}.",
                
                # Defaults for numeric fields
                'avg_yield_grams': 500, # Default estimate
                'ideal_temp': 22.0,
                'ideal_humidity': 50.0,
                'temp_tolerance': 3.0,
                'humidity_tolerance': 10.0,
            }
            
            if existing:
                # Update existing
                for key, value in seed_data.items():
                    setattr(existing, key, value)
                updated_count += 1
            else:
                # Create new
                seed = Seed(**seed_data)
                db.add(seed)
                added_count += 1
                
    db.commit()
    print(f"Seed Import Complete: {added_count} added, {updated_count} updated.")


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
        # Ensure it has a password hash and role if missing (migration-like)
        if not existing_user.hashed_password:
             existing_user.hashed_password = get_password_hash("secret")
             existing_user.role = "admin" # Default user is admin
             db.commit()
        return existing_user
    
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
        init_db()  # This might fail if alembic is used, but for now we rely on simple create_all
    except Exception as e:
        print(f"Warning during init_db: {e}")
    
    # Create session
    db = SessionLocal()
    
    try:
        # Initialize seeds
        init_seeds(db)
        
        # Create default user
        create_default_user(db)
        
        print("\nDatabase initialization complete!")
    finally:
        db.close()
