
import sqlite3
import os

db_path = 'backend/microgreens_v2.db'
if not os.path.exists(db_path):
    print(f"Error: {db_path} not found")
    sys.exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("--- CROPS ---")
cursor.execute("SELECT id, user_id, seed_id, status FROM crops")
for c in cursor.fetchall():
    print(f"Crop ID: {c[0]}, User: {c[1]}, Seed: {c[2]}, Status: {c[3]}")
    cursor.execute("SELECT day_number, actions_recorded FROM daily_logs WHERE crop_id=?", (c[0],))
    for l in cursor.fetchall():
        print(f"  Log Day {l[0]}: {l[1]}")

print("\n--- SEEDS ---")
cursor.execute("SELECT count(*) FROM seeds")
print(f"Total Seeds: {cursor.fetchone()[0]}")

conn.close()
