import os
import urllib.request
import sys

# Configuration
MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
MODELS = {
    "sprout_model.pl": {
        "url": "INSERT_PUBLIC_URL_HERE", # User should provide a link eventually
        "path": os.path.join(MODELS_DIR, "sprout_model.pl"),
        "size_mb": 245
    },
    "microgreens_model.pl": {
        "url": "INSERT_PUBLIC_URL_HERE",
        "path": os.path.join(os.path.dirname(__file__), "..", "microgreens_model.pl"),
        "size_mb": 245
    }
}

def setup_models():
    """Download models if they are missing or provide instructions."""
    print("🌱 Urban Sims - Model Setup Utility")
    print("====================================")
    
    if not os.path.exists(MODELS_DIR):
        os.makedirs(MODELS_DIR)
        print(f"Created directory: {MODELS_DIR}")

    for name, info in MODELS.items():
        if os.path.exists(info["path"]):
            print(f"✅ {name} already exists.")
            continue
        
        print(f"❌ {name} is missing (~{info['size_mb']}MB)")
        
        if info["url"] == "INSERT_PUBLIC_URL_HERE":
            print(f"   ⚠️  Automated download not yet configured.")
            print(f"   👉 Please manually place the model file at: {info['path']}")
            continue

        try:
            print(f"   ⏳ Downloading {name}...")
            urllib.request.urlretrieve(info["url"], info["path"])
            print(f"   ✨ Successfully downloaded {name}")
        except Exception as e:
            print(f"   ❌ Failed to download {name}: {e}")

if __name__ == "__main__":
    setup_models()
