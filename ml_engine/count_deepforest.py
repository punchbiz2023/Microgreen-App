"""
DeepForest-based Microgreen Plant Counter Service Module

Provides the MicrogreenDeepForestCounter class used by the backend API.
Analogous to count_yolo.py but using DeepForest for detection.

This module handles:
- Model loading
- Image preprocessing (bytes → numpy array)
- Prediction with patch-based tiling
- Post-processing (NMS, filtering)
- Visualization (annotated image generation)
"""

import io
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import cv2
import numpy as np
import pandas as pd

# Add ml_engine to path for config imports
ML_ENGINE_DIR = Path(__file__).parent.resolve()
if str(ML_ENGINE_DIR) not in sys.path:
    sys.path.insert(0, str(ML_ENGINE_DIR))

from config_deepforest import (
    MODEL_SAVE_PATH,
    PATCH_SIZE,
    PATCH_OVERLAP,
    SCORE_THRESHOLD,
    IOU_THRESHOLD,
    BOX_COLOR,
    BOX_THICKNESS,
    FONT_SCALE,
)


class MicrogreenDeepForestCounter:
    """
    Microgreen plant counter using a fine-tuned DeepForest model.
    
    Designed to be a drop-in replacement for MicrogreenYOLOCounter
    with the same process_image_bytes() interface.
    """
    
    def __init__(self, model_path: str = None):
        """
        Initialize the counter with a trained model.
        
        Args:
            model_path: Path to the fine-tuned model weights.
                        If None, uses the default path from config.
        """
        self.model_path = Path(model_path or MODEL_SAVE_PATH)
        self.model = None
        self._load_model()
    
    def _load_model(self):
        """Load the fine-tuned DeepForest model."""
        from deepforest.main import deepforest
        import torch
        
        if not self.model_path.exists():
            raise FileNotFoundError(
                f"DeepForest model not found at: {self.model_path}\n"
                f"Please run train_deepforest.py first to train the model."
            )
        
        # Initialize model architecture (v2.x auto-loads pretrained weights)
        self.model = deepforest()
        
        # Load fine-tuned weights
        state_dict = torch.load(
            str(self.model_path), map_location="cpu", weights_only=True
        )
        self.model.model.load_state_dict(state_dict)
        self.model.model.eval()
        
        print(f"✅ DeepForest model loaded from: {self.model_path}")
    
    def process_image_bytes(
        self,
        image_bytes: bytes,
        conf_threshold: float = SCORE_THRESHOLD,
        patch_size: int = PATCH_SIZE,
        patch_overlap: float = PATCH_OVERLAP,
        iou_threshold: float = IOU_THRESHOLD,
        **kwargs  # Accept extra kwargs for backward compatibility
    ) -> Dict:
        """
        Process an image from bytes and return plant detection results.
        
        This method matches the interface of MicrogreenYOLOCounter.process_image_bytes()
        so it can be used as a drop-in replacement.
        
        Args:
            image_bytes: Raw image data as bytes
            conf_threshold: Minimum confidence score (default from config)
            patch_size: Tile size for patch-based prediction
            patch_overlap: Overlap fraction between patches
            iou_threshold: IoU threshold for NMS
            **kwargs: Additional arguments (ignored, for backward compatibility)
        
        Returns:
            Dictionary with:
                - count (int): Total number of detected plants
                - centroids (List[Tuple]): List of (x, y) center points
                - detections (List[Dict]): Full detection details
                - annotated_image_bytes (bytes): JPEG-encoded annotated image
                - image_shape (Tuple): (height, width, channels)
        """
        # Decode image from bytes
        image = self._decode_image(image_bytes)
        if image is None:
            raise ValueError("Failed to decode image. Ensure it is a valid image file.")
        
        image_shape = image.shape  # (H, W, C)
        
        # Run prediction
        predictions = self._predict(
            image=image,
            patch_size=patch_size,
            patch_overlap=patch_overlap,
            score_threshold=conf_threshold,
            iou_threshold=iou_threshold,
        )
        
        # Extract results
        count = len(predictions)
        centroids = self._get_centroids(predictions)
        detections = self._format_detections(predictions)
        
        # Generate annotated image
        annotated = self._draw_annotations(image, predictions)
        annotated_bytes = self._encode_image(annotated)
        
        return {
            "count": count,
            "centroids": centroids,
            "detections": detections,
            "annotated_image_bytes": annotated_bytes,
            "image_shape": image_shape,
        }
    
    def _decode_image(self, image_bytes: bytes) -> Optional[np.ndarray]:
        """Decode image bytes to numpy array (BGR format)."""
        nparr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return image
    
    def _predict(
        self,
        image: np.ndarray,
        patch_size: int,
        patch_overlap: float,
        score_threshold: float,
        iou_threshold: float,
    ) -> pd.DataFrame:
        """
        Run patch-based prediction on the image.
        
        Args:
            image: Input image as numpy array (BGR)
            patch_size: Size of each prediction patch
            patch_overlap: Overlap between patches
            score_threshold: Minimum confidence
            iou_threshold: NMS IoU threshold
        
        Returns:
            DataFrame with filtered detections
        """
        predictions = self.model.predict_tile(
            image=image,
            patch_size=patch_size,
            patch_overlap=patch_overlap,
        )
        
        if predictions is None or len(predictions) == 0:
            return pd.DataFrame(
                columns=["xmin", "ymin", "xmax", "ymax", "label", "score"]
            )
        
        # Filter by score
        predictions = predictions[
            predictions["score"] >= score_threshold
        ].reset_index(drop=True)
        
        # Apply NMS
        if len(predictions) > 0:
            predictions = self._apply_nms(predictions, iou_threshold)
        
        return predictions
    
    def _apply_nms(
        self, predictions: pd.DataFrame, iou_threshold: float
    ) -> pd.DataFrame:
        """Apply Non-Maximum Suppression to remove duplicate detections."""
        import torch
        from torchvision.ops import nms
        
        boxes = torch.tensor(
            predictions[["xmin", "ymin", "xmax", "ymax"]].values,
            dtype=torch.float32,
        )
        scores = torch.tensor(predictions["score"].values, dtype=torch.float32)
        
        keep = nms(boxes, scores, iou_threshold)
        return predictions.iloc[keep.numpy()].reset_index(drop=True)
    
    def _get_centroids(self, predictions: pd.DataFrame) -> List[Tuple[int, int]]:
        """Extract center points of each detection."""
        centroids = []
        for _, row in predictions.iterrows():
            cx = int((row["xmin"] + row["xmax"]) / 2)
            cy = int((row["ymin"] + row["ymax"]) / 2)
            centroids.append((cx, cy))
        return centroids
    
    def _format_detections(self, predictions: pd.DataFrame) -> List[Dict]:
        """Format detections as list of dicts for JSON serialization."""
        detections = []
        for _, row in predictions.iterrows():
            detections.append({
                "xmin": int(row["xmin"]),
                "ymin": int(row["ymin"]),
                "xmax": int(row["xmax"]),
                "ymax": int(row["ymax"]),
                "score": round(float(row["score"]), 4),
            })
        return detections
    
    def _draw_annotations(
        self, image: np.ndarray, predictions: pd.DataFrame
    ) -> np.ndarray:
        """Draw bounding boxes and count on the image."""
        annotated = image.copy()
        
        for _, row in predictions.iterrows():
            xmin, ymin = int(row["xmin"]), int(row["ymin"])
            xmax, ymax = int(row["xmax"]), int(row["ymax"])
            score = row["score"]
            
            # Draw box
            cv2.rectangle(annotated, (xmin, ymin), (xmax, ymax), BOX_COLOR, BOX_THICKNESS)
            
            # Draw score label
            label = f"{score:.2f}"
            (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, FONT_SCALE, 1)
            cv2.rectangle(
                annotated,
                (xmin, ymin - th - 6),
                (xmin + tw + 4, ymin),
                BOX_COLOR, -1,
            )
            cv2.putText(
                annotated, label, (xmin + 2, ymin - 4),
                cv2.FONT_HERSHEY_SIMPLEX, FONT_SCALE, (0, 0, 0), 1,
            )
        
        # Plant count overlay
        count_text = f"Plants: {len(predictions)}"
        cv2.putText(
            annotated, count_text, (10, 30),
            cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 0, 255), 2,
        )
        
        return annotated
    
    def _encode_image(self, image: np.ndarray) -> bytes:
        """Encode numpy image to JPEG bytes."""
        success, buffer = cv2.imencode(".jpg", image, [cv2.IMWRITE_JPEG_QUALITY, 90])
        if not success:
            raise RuntimeError("Failed to encode annotated image to JPEG")
        return buffer.tobytes()
