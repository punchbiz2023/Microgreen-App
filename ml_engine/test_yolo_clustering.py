import os
import sys
from pathlib import Path
import cv2

# Ensure we can import from ml_engine
ml_engine_path = Path(__file__).parent
sys.path.insert(0, str(ml_engine_path))

from count_yolo import MicrogreenYOLOCounter

def main():
    print("Testing YOLO Clustering...")
    counter = MicrogreenYOLOCounter()
    
    # We will use the detection_result.jpg as a sample, since it's already there
    sample_img = ml_engine_path / "detection_result.jpg"
    
    if not sample_img.exists():
        print(f"Sample image not found: {sample_img}")
        print("Please provide an image to test with.")
        return
        
    output_path = ml_engine_path / "yolo_clustered_output.jpg"
    
    try:
        result = counter.process_image(str(sample_img), save_output=str(output_path))
        print(f"Success! Detected {result['count']} plants.")
        print(f"Annotated image saved to {output_path}")
    except Exception as e:
        print(f"Error testing YOLO: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
