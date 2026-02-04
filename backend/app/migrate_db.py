import sqlite3
import os
from app.database import DATABASE_URL

def migrate():
    # Find all microgreens_v2.db files in the project
    import glob
    db_files = glob.glob("**/microgreens_v2.db", recursive=True)
    # Also look in parent and siblings
    db_files.extend(glob.glob("../*.db"))
    db_files.extend(glob.glob("../*/*.db"))
    
    # Filter for microgreens_v2.db only
    db_files = [f for f in db_files if f.endswith('microgreens_v2.db')]
    # Remove duplicates
    db_files = list(set([os.path.abspath(f) for f in db_files]))
    
    if not db_files:
        db_files = ["microgreens_v2.db"] # Fallback
        
    for db_path in db_files:
        print(f"--- Migrating Database: {os.path.abspath(db_path)} ---")
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()

            # Get existing columns for seeds
            cursor.execute("PRAGMA table_info(seeds)")
            existing_seeds_cols = [row[1] for row in cursor.fetchall()]

            # Seed Columns that SHOULD be there
            required_seeds_cols = [
                ('fertilizer_info', 'TEXT'),
                ('growth_tips', 'TEXT'),
                ('pros', 'TEXT'),
                ('cons', 'TEXT'),
                ('taste', 'TEXT'),
                ('nutrition', 'TEXT'),
                ('care_instructions', 'TEXT'),
                ('source_url', 'VARCHAR(255)'),
                ('external_links', 'JSON'),
                ('soaking_duration_hours', 'FLOAT'),
                ('blackout_time_days', 'FLOAT'),
                ('germination_days', 'FLOAT'),
                ('harvest_days', 'FLOAT'),
                ('is_mucilaginous', 'BOOLEAN DEFAULT 0'),
                ('growth_category', 'VARCHAR(50)'),
                ('target_dli', 'FLOAT DEFAULT 6.0'),
                ('protein_gram_per_100g', 'FLOAT'),
                ('vitamin_c_mg_per_100g', 'FLOAT')
            ]

            for col_name, col_type in required_seeds_cols:
                if col_name not in existing_seeds_cols:
                    print(f"Adding column {col_name} to seeds table...")
                    try:
                        cursor.execute(f"ALTER TABLE seeds ADD COLUMN {col_name} {col_type}")
                    except Exception as e:
                        print(f"Error adding {col_name} to seeds: {e}")

            # Get existing columns for crops
            cursor.execute("PRAGMA table_info(crops)")
            existing_crops_cols = [row[1] for row in cursor.fetchall()]

            # Crop Columns that SHOULD be there
            required_crops_cols = [
                ('ppfd_level', 'FLOAT'),
                ('light_hours_per_day', 'FLOAT DEFAULT 16.0'),
                ('seed_cost', 'FLOAT DEFAULT 0.0'),
                ('soil_cost', 'FLOAT DEFAULT 0.0'),
                ('energy_cost_per_kwh', 'FLOAT DEFAULT 0.12'),
                ('other_costs', 'FLOAT DEFAULT 0.0')
            ]

            for col_name, col_type in required_crops_cols:
                if col_name not in existing_crops_cols:
                    print(f"Adding column {col_name} to crops table...")
                    try:
                        cursor.execute(f"ALTER TABLE crops ADD COLUMN {col_name} {col_type}")
                    except Exception as e:
                        print(f"Error adding {col_name} to crops: {e}")

            conn.commit()
            conn.close()
        except Exception as e:
            print(f"Failed to migrate {db_path}: {e}")
    
    print("Migration sequence complete.")

if __name__ == "__main__":
    migrate()
