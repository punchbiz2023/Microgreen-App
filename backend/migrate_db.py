import sqlite3
import os

def migrate():
    db_path = r"c:\Users\hrith\OneDrive\Desktop\Urban sims\backend\microgreens_v2.db"
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Add target_density_g_cm2 to seeds
    try:
        cursor.execute("ALTER TABLE seeds ADD COLUMN target_density_g_cm2 FLOAT")
        print("Added target_density_g_cm2 to seeds table")
    except sqlite3.OperationalError:
        print("Column target_density_g_cm2 already exists in seeds or table not found")

    # Add current_stage to crops
    try:
        cursor.execute("ALTER TABLE crops ADD COLUMN current_stage VARCHAR(30) DEFAULT 'blackout'")
        print("Added current_stage to crops table")
    except sqlite3.OperationalError:
        print("Column current_stage already exists in crops or table not found")

    # Add measured_height_mm to daily_logs
    try:
        cursor.execute("ALTER TABLE daily_logs ADD COLUMN measured_height_mm FLOAT")
        print("Added measured_height_mm to daily_logs table")
    except sqlite3.OperationalError:
        print("Column measured_height_mm already exists in daily_logs or table not found")

    conn.commit()
    conn.close()
    print("Migration completed.")

if __name__ == "__main__":
    migrate()
