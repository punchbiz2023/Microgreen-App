import sqlite3
import os
from app.database import DATABASE_URL

def migrate():
    # Convert sqlite:///./microgreens_v2.db to ./microgreens_v2.db
    db_path = DATABASE_URL.replace('sqlite:///', '')
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Get existing columns
    cursor.execute("PRAGMA table_info(seeds)")
    existing_cols = [row[1] for row in cursor.fetchall()]

    # Columns that SHOULD be there based on models.py
    required_cols = [
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
        ('harvest_days', 'FLOAT')
    ]

    for col_name, col_type in required_cols:
        if col_name not in existing_cols:
            print(f"Adding column {col_name} to seeds table...")
            try:
                cursor.execute(f"ALTER TABLE seeds ADD COLUMN {col_name} {col_type}")
            except Exception as e:
                print(f"Error adding {col_name}: {e}")

    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
