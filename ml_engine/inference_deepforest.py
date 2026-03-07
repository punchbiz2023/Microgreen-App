"""
DeepForest Inference Script for Microgreen Plant Detection

Runs prediction on a single tray image using the fine-tuned model.
Outputs bounding boxes, confidence scores, total plant count,
and saves an annotated visualization.

Usage:
    python inference_deepforest.py --image path/to/tray.jpg
    python inference_deepforest.py --image path/to/tray.jpg --output result.jpg --threshold 0.4
    python inference_deepforest.py --image path/to/tray.jpg --patch-size 300 --patch-overlap 0.4
"""

import argparse
import sys
from pathlib import Path

import cv2
import numpy as np
import pandas as pd

from config_deepforest import (
    MODEL_SAVE_PATH,
    PATCH_SIZE,
    PATCH_OVERLAP,
    SCORE_THRESHOLD,
    IOU_THRESHOLD,
    BOX_COLOR,
    BOX_THICKNESS,
    FONT_SCALE,
    FONT_COLOR,
    DEEPFOREST_IMAGES_DIR,
)


def load_model(model_path: str = None):
    """
    Load the fine-tuned DeepForest model.
    
    Args:
        model_path: Path to the saved model weights (.pt file).
                    If None, uses the path from config.
    
    Returns:
        Loaded DeepForest model ready for inference.
    """
    from deepforest.main import deepforest
    import torch
    
    model_path = Path(model_path or MODEL_SAVE_PATH)
    
    if not model_path.exists():
        print(f"ERROR: Model file not found: {model_path}")
        print("   Run train_deepforest.py first to create the model.")
        sys.exit(1)
    
    print(f"📦 Loading model from: {model_path}")
    
    # Create a fresh model instance (v2.x auto-loads pretrained weights)
    model = deepforest()
    
    # Load fine-tuned weights
    state_dict = torch.load(str(model_path), map_location="cpu", weights_only=True)
    model.model.load_state_dict(state_dict)
    model.model.eval()
    
    print("✅ Model loaded successfully")
    return model


def predict_image(
    model,
    image_path: str,
    patch_size: int = PATCH_SIZE,
    patch_overlap: float = PATCH_OVERLAP,
    score_threshold: float = SCORE_THRESHOLD,
    iou_threshold: float = IOU_THRESHOLD,
) -> pd.DataFrame:
    """
    Run prediction on a single image using patch-based tiling.
    
    Patch-based prediction is critical for dense small objects like microgreens.
    The image is split into overlapping patches, each patch is processed
    independently, and results are merged with NMS.
    
    Args:
        model: Loaded DeepForest model
        image_path: Path to the input image
        patch_size: Size of each square patch in pixels
        patch_overlap: Fraction of overlap between adjacent patches (0-1)
        score_threshold: Minimum confidence score to keep a detection
        iou_threshold: IoU threshold for non-maximum suppression
    
    Returns:
        DataFrame with columns: xmin, ymin, xmax, ymax, label, score
    """
    image_path = str(image_path)
    
    print(f"\n🔍 Running prediction on: {Path(image_path).name}")
    print(f"   Patch size: {patch_size}px, Overlap: {patch_overlap}")
    print(f"   Score threshold: {score_threshold}, IoU threshold: {iou_threshold}")
    
    # Read image to get dimensions
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Cannot read image: {image_path}")
    
    h, w = img.shape[:2]
    print(f"   Image size: {w}x{h}")
    
    # Use predict_tile for patch-based prediction on large/dense images
    predictions = model.predict_tile(
        path=image_path,
        patch_size=patch_size,
        patch_overlap=patch_overlap,
    )
    
    if predictions is None or len(predictions) == 0:
        print("⚠️  No detections found.")
        return pd.DataFrame(columns=["xmin", "ymin", "xmax", "ymax", "label", "score"])
    
    # Filter by confidence threshold
    predictions = predictions[predictions["score"] >= score_threshold].reset_index(drop=True)
    
    print(f"   Raw detections (above threshold): {len(predictions)}")
    
    # Apply NMS to remove duplicate detections from overlapping patches
    if len(predictions) > 0:
        predictions = apply_nms(predictions, iou_threshold)
        print(f"   After NMS: {len(predictions)} detections")
    
    return predictions


def apply_nms(predictions: pd.DataFrame, iou_threshold: float) -> pd.DataFrame:
    """
    Apply Non-Maximum Suppression to remove overlapping detections.
    
    This is especially important when using patch-based prediction,
    as the same plant may be detected in multiple overlapping patches.
    
    Args:
        predictions: DataFrame with xmin, ymin, xmax, ymax, score columns
        iou_threshold: IoU threshold for suppression
    
    Returns:
        Filtered DataFrame after NMS
    """
    import torch
    from torchvision.ops import nms
    
    boxes = torch.tensor(
        predictions[["xmin", "ymin", "xmax", "ymax"]].values,
        dtype=torch.float32
    )
    scores = torch.tensor(predictions["score"].values, dtype=torch.float32)
    
    keep_indices = nms(boxes, scores, iou_threshold)
    
    return predictions.iloc[keep_indices.numpy()].reset_index(drop=True)


def draw_detections(image_path: str, predictions: pd.DataFrame) -> np.ndarray:
    """
    Draw bounding boxes and count on the image.
    
    Args:
        image_path: Path to the original image
        predictions: DataFrame with detection results
    
    Returns:
        Annotated image as numpy array (BGR)
    """
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Cannot read image: {image_path}")
    
    for _, row in predictions.iterrows():
        xmin, ymin = int(row["xmin"]), int(row["ymin"])
        xmax, ymax = int(row["xmax"]), int(row["ymax"])
        score = row["score"]
        
        # Draw bounding box
        cv2.rectangle(img, (xmin, ymin), (xmax, ymax), BOX_COLOR, BOX_THICKNESS)
        
        # Draw confidence label
        label_text = f"{score:.2f}"
        (text_w, text_h), _ = cv2.getTextSize(
            label_text, cv2.FONT_HERSHEY_SIMPLEX, FONT_SCALE, 1
        )
        cv2.rectangle(
            img,
            (xmin, ymin - text_h - 6),
            (xmin + text_w + 4, ymin),
            BOX_COLOR,
            -1,
        )
        cv2.putText(
            img,
            label_text,
            (xmin + 2, ymin - 4),
            cv2.FONT_HERSHEY_SIMPLEX,
            FONT_SCALE,
            (0, 0, 0),  # Black text on green background
            1,
        )
    
    # Draw total count in top-left corner
    count_text = f"Plant Count: {len(predictions)}"
    cv2.putText(
        img, count_text, (10, 30),
        cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 0, 255), 2
    )
    
    return img


def main():
    parser = argparse.ArgumentParser(
        description="Run DeepForest inference on a microgreen tray image"
    )
    parser.add_argument("--image", type=str, required=True,
                        help="Path to input tray image")
    parser.add_argument("--model", type=str, default=str(MODEL_SAVE_PATH),
                        help="Path to trained model weights")
    parser.add_argument("--output", type=str, default=None,
                        help="Path to save annotated image (default: <input>_detected.jpg)")
    parser.add_argument("--patch-size", type=int, default=PATCH_SIZE,
                        help=f"Patch size for tiling (default: {PATCH_SIZE})")
    parser.add_argument("--patch-overlap", type=float, default=PATCH_OVERLAP,
                        help=f"Patch overlap fraction (default: {PATCH_OVERLAP})")
    parser.add_argument("--threshold", type=float, default=SCORE_THRESHOLD,
                        help=f"Confidence threshold (default: {SCORE_THRESHOLD})")
    parser.add_argument("--iou-threshold", type=float, default=IOU_THRESHOLD,
                        help=f"NMS IoU threshold (default: {IOU_THRESHOLD})")
    parser.add_argument("--no-save", action="store_true",
                        help="Don't save the annotated image")
    
    args = parser.parse_args()
    
    # Validate input
    if not Path(args.image).exists():
        print(f"❌ Image not found: {args.image}")
        sys.exit(1)
    
    print("=" * 60)
    print("🌱 DeepForest Microgreen Detection - Inference")
    print("=" * 60)
    
    # Load model
    model = load_model(args.model)
    
    # Run prediction
    predictions = predict_image(
        model=model,
        image_path=args.image,
        patch_size=args.patch_size,
        patch_overlap=args.patch_overlap,
        score_threshold=args.threshold,
        iou_threshold=args.iou_threshold,
    )
    
    # Print results
    print("\n" + "=" * 60)
    print(f"🌱 RESULTS: {len(predictions)} plants detected")
    print("=" * 60)
    
    if len(predictions) > 0:
        print(f"\n   Score range: {predictions['score'].min():.3f} - {predictions['score'].max():.3f}")
        print(f"   Mean score:  {predictions['score'].mean():.3f}")
        
        # Print detection details
        print(f"\n   Detections:")
        for i, (_, row) in enumerate(predictions.iterrows()):
            print(f"   [{i+1:3d}] box=({int(row['xmin'])}, {int(row['ymin'])}, "
                  f"{int(row['xmax'])}, {int(row['ymax'])})  score={row['score']:.3f}")
            if i >= 19:  # Show first 20
                remaining = len(predictions) - 20
                if remaining > 0:
                    print(f"   ... and {remaining} more")
                break
    
    # Save annotated image
    if not args.no_save and len(predictions) > 0:
        output_path = args.output or str(
            Path(args.image).parent / f"{Path(args.image).stem}_detected.jpg"
        )
        
        annotated = draw_detections(args.image, predictions)
        cv2.imwrite(output_path, annotated)
        print(f"\n💾 Annotated image saved to: {output_path}")
    
    # Return results as JSON-like dict
    result = {
        "plant_count": len(predictions),
        "detections": predictions.to_dict(orient="records") if len(predictions) > 0 else [],
    }
    
    return result


if __name__ == "__main__":
    main()
