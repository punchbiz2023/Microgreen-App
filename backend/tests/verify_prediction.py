
import requests
import json
import sys

BASE_URL = "http://localhost:8000"

def run_test():
    print("=== Starting API Verification ===")
    
    # 1. Register/Login
    username = "prediction_tester"
    password = "password123"
    
    print(f"1. Authenticating as {username}...")
    auth_response = requests.post(f"{BASE_URL}/api/auth/token", data={
        "username": username,
        "password": password
    })
    
    token = None
    if auth_response.status_code != 200:
        print("   User might not exist, registering...")
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "username": username,
            "email": "tester@example.com",
            "password": password,
            "preference_mode": "home"
        })
        if reg_response.status_code == 200:
             # Login again
             auth_response = requests.post(f"{BASE_URL}/api/auth/token", data={
                "username": username,
                "password": password
            })
    
    if auth_response.status_code == 200:
        token = auth_response.json()["access_token"]
        print("   Authentication successful.")
    else:
        print(f"   Authentication failed: {auth_response.text}")
        return

    headers = {"Authorization": f"Bearer {token}"}

    # 2. Get Seeds
    print("\n2. Fetching seeds...")
    seeds_response = requests.get(f"{BASE_URL}/api/seeds", headers=headers)
    if seeds_response.status_code != 200:
        print(f"   Failed to get seeds: {seeds_response.text}")
        return
    
    seeds = seeds_response.json()
    if not seeds:
        print("   No seeds found.")
        return
    
    seed_id = seeds[0]['id']
    for s in seeds:
        if s.get('seed_type') == 'cilantro-coriander-split':
            seed_id = s['id']
            print(f"   Found target seed: {s['name']} (ID: {seed_id})")
            break
            
    print(f"   Selected seed ID: {seed_id}")

    # 3. Create Crop
    print("\n3. Creating crop...")
    from datetime import datetime
    crop_data = {
        "seed_id": seed_id,
        "start_datetime": datetime.now().isoformat(),
        "tray_size": "10x20",
        "custom_settings": {},
        "notification_settings": {}
    }
    
    crop_response = requests.post(f"{BASE_URL}/api/crops", json=crop_data, headers=headers)
    if crop_response.status_code != 200:
        print(f"   Failed to create crop: {crop_response.text}")
        return
    
    crop = crop_response.json()
    crop_id = crop['id']
    print(f"   Crop created with ID: {crop_id}")

    # 4. Log Day 1
    print("\n4. Logging Day 1 (Watered)...")
    log_data = {
        "day_number": 1,
        "watered": True,
        "temperature": 23.5,
        "humidity": 55,
        "notes": "Test log for prediction",
        "actions_recorded": ["water_morning"]
    }
    
    log_response = requests.post(f"{BASE_URL}/api/crops/{crop_id}/logs", json=log_data, headers=headers)
    
    if log_response.status_code == 200:
        log = log_response.json()
        print("   Log created successfully.")
        print(f"   Predicted Yield in Log: {log.get('predicted_yield')}")
        if log.get('predicted_yield'):
            print("   ✅ SUCCESS: Prediction found in log creation response.")
        else:
            print("   ❌ FAILURE: No prediction in log response.")
    else:
        print(f"   Failed to create log: {log_response.text}")

    # 5. Check Prediction Endpoint
    print("\n5. Checking GET /api/predictions/...")
    pred_response = requests.get(f"{BASE_URL}/api/predictions/{crop_id}", headers=headers)
    
    if pred_response.status_code == 200:
        pred = pred_response.json()
        print("   Prediction Endpoint Response:")
        print(f"   Predicted Yield: {pred.get('predicted_yield')}")
        print(f"   Status: {pred.get('status')}")
        
        if pred.get('predicted_yield'):
             print("   ✅ SUCCESS: Prediction endpoint returned value.")
        else:
             print("   ❌ FAILURE: Prediction endpoint returned empty/null yield.")
    else:
        print(f"   Failed to call prediction endpoint: {pred_response.text}")

    # Cleanup
    print("\n6. Cleaning up...")
    requests.delete(f"{BASE_URL}/api/crops/{crop_id}", headers=headers)
    print("   Test crop deleted.")

if __name__ == "__main__":
    run_test()
