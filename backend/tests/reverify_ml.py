import requests
import time

def verify():
    # Authenticate
    try:
        token_res = requests.post('http://localhost:8000/api/auth/token', data={'username': 'hrithick03', 'password': 'password123'})
        token = token_res.json().get('access_token')
        if not token:
            print(f"Auth failed: {token_res.text}")
            return
        
        headers = {'Authorization': f'Bearer {token}'}
        
        # Call prediction endpoint for crop 6 (which uses cilantro-coriander-split if it exists, or whatever caused the crash)
        # Note: We need to know if crop 6 exists. If 404, we might need to create a crop with that specific seed type.
        
        # But first, let's just try crop 6 as per traceback.
        res = requests.get('http://localhost:8000/api/predictions/6', headers=headers)
        
        print(f"Status: {res.status_code}")
        if res.status_code != 200:
            print("Response:", res.text)
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    verify()
