from ultralytics import YOLO
import sys
import os

def test_model(model_path, test_image):
    model = YOLO(model_path)
    results = model(test_image)
    
    for r in results:
        print(f"\nDetected {len(r.boxes)} plants")
        output_path = 'detection_result.jpg'
        r.save(filename=output_path)
        print(f"Saved annotated image to: {os.path.abspath(output_path)}")

if __name__ == '__main__':
    model_path = r"c:\Users\hrith\OneDrive\Desktop\Urban sims\ml_engine\runs\detect\microgreen_detector\weights\best.pt"
    # Use one of the training images as a quick check
    test_image = r"c:\Users\hrith\OneDrive\Desktop\Urban sims\microgreens.coco (1)\train\000009_jpg.rf.zdICIyLoMakJLVv2Y0A6.jpg"
    test_model(model_path, test_image)
