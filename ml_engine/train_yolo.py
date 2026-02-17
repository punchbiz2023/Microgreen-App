"""
Train YOLOv8 model for microgreen plant detection
"""

from ultralytics import YOLO
import os
from pathlib import Path


def train_microgreen_detector(
    data_yaml: str,
    epochs: int = 100,
    img_size: int = 640,
    batch_size: int = 8,
    model_size: str = 'n'  # n, s, m, l, x
):
    """
    Train YOLOv8 model for microgreen detection
    
    Args:
        data_yaml: Path to dataset.yaml file
        epochs: Number of training epochs
        img_size: Input image size
        batch_size: Batch size for training
        model_size: Model size (n=nano, s=small, m=medium, l=large, x=xlarge)
    """
    # Initialize YOLO model
    model_name = f'yolov8{model_size}.pt'
    print(f"Loading {model_name}...")
    model = YOLO(model_name)
    
    # Train the model
    print(f"\nStarting training...")
    print(f"Dataset: {data_yaml}")
    print(f"Epochs: {epochs}")
    print(f"Image size: {img_size}")
    print(f"Batch size: {batch_size}")
    
    results = model.train(
        data=data_yaml,
        epochs=epochs,
        imgsz=img_size,
        batch=batch_size,
        name='microgreen_detector',
        patience=20,  # Early stopping patience
        save=True,
        plots=True,
        device='cpu',  # Use 'cuda' if GPU available
        workers=2,
        augment=True,  # Data augmentation
        mosaic=0.5,  # Mosaic augmentation probability
        mixup=0.1,  # Mixup augmentation probability
    )
    
    print("\nTraining complete!")
    print(f"Best model saved to: runs/detect/microgreen_detector/weights/best.pt")
    
    return model


def test_model(model_path: str, test_image: str):
    """
    Test trained model on an image
    
    Args:
        model_path: Path to trained model weights
        test_image: Path to test image
    """
    model = YOLO(model_path)
    
    # Run inference
    results = model(test_image)
    
    # Display results
    for r in results:
        print(f"\nDetected {len(r.boxes)} plants")
        print(f"Confidence scores: {r.boxes.conf.tolist()}")
        
        # Save annotated image
        output_path = 'detection_result.jpg'
        r.save(filename=output_path)
        print(f"Saved annotated image to: {output_path}")
    
    return results


if __name__ == '__main__':
    # Paths
    data_yaml = r"c:\Users\hrith\OneDrive\Desktop\Urban sims\ml_engine\yolo_dataset\dataset.yaml"
    
    # Train model
    print("="*60)
    print("MICROGREEN PLANT DETECTOR - YOLO TRAINING")
    print("="*60)
    
    # Use nano model for faster training on small dataset
    model = train_microgreen_detector(
        data_yaml=data_yaml,
        epochs=100,  # Can adjust based on results
        img_size=640,
        batch_size=4,  # Small batch for small dataset
        model_size='n'  # Nano model - faster training
    )
    
    print("\n" + "="*60)
    print("Training completed! Model ready for use.")
    print("="*60)
