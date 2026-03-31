import os
import urllib.request
import sys
import argparse

# Configuration
MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")

# Fallback links in case the user doesn't have their own yet.
# These will be updated if the user provides direct links.
MODELS = {
    "sprout_model.pl": {
        "url": os.getenv("SPROUT_MODEL_URL", "INSERT_PUBLIC_URL_HERE"),
        "path": os.path.join(MODELS_DIR, "sprout_model.pl"),
        "size_mb": 245
    }
}

def setup_models(force=False, check_only=False):
    """Download models if they are missing or provide instructions."""
    print("🌱 Microgreens Tracker - Model Setup Utility")
    print("====================================")
    
    if not os.path.exists(MODELS_DIR):
        os.makedirs(MODELS_DIR)
        print(f"Created directory: {MODELS_DIR}")

    all_ok = True
    for name, info in MODELS.items():
        exists = os.path.exists(info["path"])
        
        if exists and not force:
            print(f"✅ {name} already exists.")
            continue
        
        if check_only:
            if not exists:
                print(f"❌ {name} is missing.")
                all_ok = False
            continue

        print(f"❌ {name} is missing or update forced (~{info['size_mb']}MB)")
        
        url = info["url"]
        if url == "INSERT_PUBLIC_URL_HERE" or not url:
            print(f"   ⚠️  Automated download not yet configured.")
            print(f"   👉 Please manually place the model file at: {info['path']}")
            print(f"   💡 Tip: Set the SPROUT_MODEL_URL environment variable.")
            all_ok = False
            continue

        try:
            print(f"   ⏳ Downloading {name} from {url}...")
            # Use a custom User-Agent to avoid early blocks
            opener = urllib.request.build_opener()
            opener.addheaders = [('User-agent', 'Mozilla/5.0')]
            urllib.request.install_opener(opener)
            
            urllib.request.urlretrieve(url, info["path"])
            print(f"   ✨ Successfully downloaded {name}")
        except Exception as e:
            print(f"   ❌ Failed to download {name}: {e}")
            all_ok = False

    return all_ok

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Setup models for Microgreens Tracker.")
    parser.add_argument("--force", action="store_true", help="Force download models even if they exist.")
    parser.add_argument("--check", action="store_true", help="Only check if models exist, don't download.")
    args = parser.parse_args()

    success = setup_models(force=args.force, check_only=args.check)
    if not success and args.check:
        sys.exit(1)
