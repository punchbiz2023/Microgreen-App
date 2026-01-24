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
            name_lower = crop_name.lower()
            # Improved Blackout & Sprout estimation
            # Radish/Broccoli usually 2-3 days blackout. Pea/Sunflower 3-4 days.
            if 'pea' in name_lower or 'sunflower' in name_lower:
                blackout_days = 4.0
            elif 'radish' in name_lower or 'broccoli' in name_lower or 'mustard' in name_lower:
                blackout_days = 3.0
            elif 'amaranth' in name_lower:
                blackout_days = 2.0
            else:
                blackout_days = max(1.0, germination_days - 1.0)
            
            # Improved Soaking Logic
            if 'amaranth' in name_lower or 'basil' in name_lower or 'chia' in name_lower or 'mustard' in name_lower or 'broccoli' in name_lower or 'radish' in name_lower:
                soak_hours = 0.0
                soak_time_raw = 'No Soak' 
            elif 'pea' in name_lower or 'sunflower' in name_lower or 'beet' in name_lower:
                soak_hours = 12.0
                soak_time_raw = '8-12 Hours'
            elif 'wheat' in name_lower:
                soak_hours = 8.0
                soak_time_raw = '6-8 Hours'
            else:
                soak_hours = soak_hours or 0.0

            # Microgreen Scale Overrides (Avoid mature plant days from CSV)
            if 'amaranth' in name_lower:
                harvest_days = 12.0
            elif 'radish' in name_lower:
                harvest_days = 8.0
            elif 'broccoli' in name_lower:
                harvest_days = 10.0
            elif 'mustard' in name_lower:
                harvest_days = 9.0
            elif harvest_days > 25: 
                harvest_days = 14.0
            
            # Weights
            seed_weight_raw = row.get('Seed Weight (gm)', '20')
            harvest_weight_raw = row.get('Harvest Weight (gm)', '200')
            
            seed_weight_g = parse_range_avg(seed_weight_raw) or 20.0
            harvest_weight_g = parse_range_avg(harvest_weight_raw) or 200.0
            
            # Rich Data
            links = []
            if row.get('Link 1'): links.append({"url": row.get('Link 1'), "desc": row.get('Link 1 Description', 'Link 1')})
            if row.get('Link 2'): links.append({"url": row.get('Link 2'), "desc": row.get('Link 2 Description', 'Link 2')})
            if row.get('Link 3'): links.append({"url": row.get('Link 3'), "desc": row.get('Link 3 Description', 'Link 3')})
            
            # Final validation and defaults
            if germination_days <= 0:
                print(f"  [LOG] Missing Germination for {crop_name}, using default 3 days")
                germination_days = 3.0
            if harvest_days <= 0:
                print(f"  [LOG] Missing Harvest for {crop_name}, using default 10 days")
                harvest_days = 10.0

            seed_data = {
                'seed_type': seed_type_slug,
                'name': crop_name,
                'latin_name': '', # Not in new CSV
                'difficulty': 'Medium', # Default
                
                # Scaled Data
                'suggested_seed_weight': seed_weight_g,
                'avg_yield_grams': int(harvest_weight_g),
                
                'soaking_duration_hours': soak_hours,
                'germination_days': germination_days,
                'harvest_days': harvest_days,
                'blackout_time_days': blackout_days,
                
                # Textual
                'soaking_req': soak_time_raw or 'No Soak',
                'watering_req': 'Regular', # Default
                
                # Metadata
                'nutrition': row.get('Nutritional Benefits', ''),
                'pros': row.get('Suitable For (Pros)', ''),
                'cons': row.get('Not Suitable For (Cons)', ''),
                'external_links': links, # Store as JSON list
                
                'description': f"A variety of {crop_name}. Known for: {row.get('Nutritional Benefits', '')[:100]}...",
                'care_instructions': f"Suggested soaking: {soak_time_raw or 'None'}. Sprout time: {germination_days} days. Growth time: {harvest_days} days.",
                
                # Defaults
                'humidity_tolerance': 10.0,
            }

            # Enrichment: Highly specific variety data
            tips_map = {
                'amaranth': {
                    'fert': "Low nitrogen bio-stimulant on Day 5 to boost betacyanin (pigment) levels.",
                    'tips': "Extremely sensitive to overwatering; use fine mist only. Keep blackout weighted to improve stem strength. Do NOT soak."
                },
                'broccoli': {
                    'fert': "Balanced ocean-based fertilizer at 25% strength after Day 4.",
                    'tips': "High light intensity required; 16-18 hours of LED light prevents leggy stems. Harvest at first true leaf. No soak."
                },
                'pea': {
                    'fert': "Rich compost tea in the soaking water. Usually self-sufficient after that.",
                    'tips': "SOAK 8-12h. Weight heavily (2-4 kg) for 3-4 days to ensure strong root penetration. Harvest as tendrils appear."
                },
                'sunflower': {
                    'fert': "Calcium-Magnesium supplement on Day 4 to assist with seed hull shedding.",
                    'tips': "SOAK 8-12h. Stack trays during blackout to force hulls off. Mist hulls daily to keep them soft for shedding."
                },
                'radish': {
                    'fert': "Liquid seaweed extract on Day 3 for rapid root development.",
                    'tips': "Grows aggressively; monitor closely from Day 5. Harvesting early preserves the spicy 'kick'. No soak."
                },
                'chia': {
                    'fert': "No fertilizer needed; Chia is a hyper-accumulator of nutrients from its own mucilage.",
                    'tips': "Do not soak in water (mucilaginous). Dry sow on damp medium and mist heavily until germination."
                },
                'wheat': {
                    'fert': "Azomite or rock dust for mineral-rich wheatgrass juice.",
                    'tips': "SOAK 8-12h. High density sow. Harvest at 'jointing' stage (approx 7-9 inches) for max sugar content."
                },
                'basil': {
                    'fert': "Moderate Nitrogen-Potassium mix starting Day 7 for aromatic oil production.",
                    'tips': "Mucilaginous seeds; do not soak. Requires higher heat (24-26C) for optimal growth."
                },
                'beetroot': {
                    'fert': "Boron-enriched water on Day 5 prevents 'black heart' in larger harvests.",
                    'tips': "Seeds are actually multi-germ clusters; sow slightly thinner. Soak 8-12 hours in tepid water."
                },
                'fenugreek': {
                    'fert': "Nitrogen-fixing not required for micro-stage; use pure water.",
                    'tips': "Very prone to root rot. High airflow is mandatory. Harvest before the smell gets too pungent."
                },
                'mustard': {
                    'fert': "Slightly acidic water (pH 5.8) improves sulfate uptake for pungency.",
                    'tips': "Extremely fast grower. Keep blackout short (2 days) to avoid spindly yellow stems."
                },
                'kale': {
                    'fert': "Micro-nutrient spray on Day 6 for 'superfood' mineral density.",
                    'tips': "Tolerates cooler temperatures better than most. Harvest when leaves are deep green and crinkled."
                },
                'coriander': {
                    'fert': "Phosphorus-rich fertilizer at Day 10 if harvesting as micro-cilantro.",
                    'tips': "Slowest to germinate. Split the husks gently before sowing to speed up the process."
                },
                'cabbage': {
                    'fert': "General-purpose organic liquid fertilizer at half strength on Day 5.",
                    'tips': "Easy for beginners. Ensure even seed distribution to prevent cluster-mold."
                },
                'carrot': {
                    'fert': "Humic acid on Day 10 helps development of delicate root systems.",
                    'tips': "Micro-carrot takes longer (14-21 days). Needs consistent moisture; use a humidity dome."
                },
                'onion': {
                    'fert': "Sulfur-based amendments increase flavor profile significantly.",
                    'tips': "Keep the seed caps on for as long as possible; they contain most of the onion flavor."
                },
                'fennel': {
                    'fert': "Trace minerals at Day 8 for anise-scented volative oils.",
                    'tips': "Sensitive to root disturbance. Water exclusively from below after germination."
                },
                'alfalfa': {
                    'fert': "Pure, filtered water is sufficient for this low-demand crop.",
                    'tips': "Rotate or stir gently during the first 2 days of sprout phase to prevent matting."
                }
            }

            # Search tips with fallback
            matched_knowlege = None
            for key in tips_map:
                if key in name_lower:
                    matched_knowlege = tips_map[key]
                    break
            
            if matched_knowlege:
                seed_data['fertilizer_info'] = matched_knowlege['fert']
                seed_data['growth_tips'] = matched_knowlege['tips']
            else:
                seed_data['fertilizer_info'] = "Most microgreens thrive with just clean, pH-balanced water (6.0-6.5). For 30+ day cycles, consider dilute kelp."
                seed_data['growth_tips'] = "Standard 10x20 tray: Ensure good airflow and maintain even moisture. Avoid top-watering after Day 3."
            
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
