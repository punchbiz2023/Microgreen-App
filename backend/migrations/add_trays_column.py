import sqlite3
import os

DB_PATH = "microgreens.db"  # Should be in current dir if running from backend/

def migrate():
    print(f"Checking database at {os.path.abspath(DB_PATH)}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Check if column exists
        cursor.execute("PRAGMA table_info(crops)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if 'number_of_trays' not in columns:
            print("Adding 'number_of_trays' column to 'crops' table...")
            cursor.execute("ALTER TABLE crops ADD COLUMN number_of_trays INTEGER DEFAULT 1 NOT NULL")
            conn.commit()
            print("Migration successful.")
        else:
            print("Column 'number_of_trays' already exists.")
            
    except Exception as e:
        print(f"Migration failed: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    if not os.path.exists(DB_PATH):
        # try fallback path if running from root
        if os.path.exists("backend/urban_sims.db"):
            DB_PATH = "backend/urban_sims.db"
        elif os.path.exists("urban_sims.db"):
             DB_PATH = "urban_sims.db"
        
    migrate()
