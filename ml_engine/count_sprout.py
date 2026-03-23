"""
DeepForest-based Sprout Counter Service Module
"""
import io
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import cv2
import numpy as np
import pandas as pd

ML_ENGINE_DIR = Path(__file__).parent.resolve()
if str(ML_ENGINE_DIR) not in sys.path:
    sys.path.insert(0, str(ML_ENGINE_DIR))

# Using same color settings as DeepForest config
from config_deepforest import BOX_COLOR, BOX_THICKNESS, CENTER_COLOR
from config_sprout import SCORE_THRESHOLD, PATCH_SIZE, PATCH_OVERLAP, IOU_THRESHOLD, MAX_BOX_SIZE

class MicrogreenSproutCounter:
    def __init__(self, model_path: str = None):
        if model_path is None:
            model_path = str(ML_ENGINE_DIR / "models" / "sprout_model.pl")
        self.model_path = Path(model_path)
        self.model = None
        self._load_model()
    
    def _load_model(self):
        from deepforest.main import deepforest
        import torch
        
        if not self.model_path.exists():
            raise FileNotFoundError(f"Sprout model not found at: {self.model_path}")
        
        device = "cuda" if torch.cuda.is_available() else "cpu"
        
        # Load from checkpoint
        self.model = deepforest.load_from_checkpoint(str(self.model_path), map_location=device)
        self.model.model.eval()
        
        print(f"✅ Sprout model loaded on {device.upper()} from: {self.model_path}")

    def process_image_bytes(
        self,
        image_bytes: bytes,
        conf_threshold: float = SCORE_THRESHOLD,
        patch_size: int = PATCH_SIZE,
        patch_overlap: float = PATCH_OVERLAP,
        iou_threshold: float = IOU_THRESHOLD,
        **kwargs
    ) -> Dict:
        """
        Process image with user-provided parameters for the PL sprout model.
        """
        image = self._decode_image(image_bytes)
        if image is None:
            raise ValueError("Failed to decode image.")
        
        image_shape = image.shape
        
        predictions = self._predict(
            image=image,
            patch_size=patch_size,
            patch_overlap=patch_overlap,
            score_threshold=conf_threshold,
            iou_threshold=iou_threshold,
        )
        
        count = len(predictions)
        centroids = self._get_centroids(predictions)
        detections = self._format_detections(predictions)
        
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
        nparr = np.frombuffer(image_bytes, np.uint8)
        return cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    def _predict(
        self,
        image: np.ndarray,
        patch_size: int,
        patch_overlap: float,
        score_threshold: float,
        iou_threshold: float,
    ) -> pd.DataFrame:
        
        # Set user's desired score threshold directly on the model
        self.model.model.score_thresh = score_threshold
        
        predictions = self.model.predict_tile(
            image=image,
            patch_size=patch_size,
            patch_overlap=patch_overlap,
            iou_threshold=iou_threshold,
        )
        
        if predictions is None or len(predictions) == 0:
            return pd.DataFrame(columns=["xmin", "ymin", "xmax", "ymax", "label", "score"])
        
        # Filter outliers (remove huge boxes that are clearly artifacts)
        predictions = self._filter_outliers(predictions)
        
        return predictions.reset_index(drop=True)

    def _filter_outliers(self, predictions: pd.DataFrame) -> pd.DataFrame:
        """
        Remove bounding boxes that are too large to be a microgreen sprout.
        These are usually tiling artifacts or false positives from background features.
        """
        if len(predictions) == 0:
            return predictions
            
        # Add width and height columns for filtering
        predictions = predictions.copy()
        predictions["width"] = predictions["xmax"] - predictions["xmin"]
        predictions["height"] = predictions["ymax"] - predictions["ymin"]
        
        # Filter by MAX_BOX_SIZE from config
        filtered = predictions[
            (predictions["width"] <= MAX_BOX_SIZE) & 
            (predictions["height"] <= MAX_BOX_SIZE)
        ]
        
        # Optional: could also filter by very small boxes if needed, 
        # but microgreens can be very small.
        
        return filtered.drop(columns=["width", "height"])
    
    def _get_centroids(self, predictions: pd.DataFrame) -> List[Tuple[int, int]]:
        centroids = []
        for _, row in predictions.iterrows():
            cx = int((row["xmin"] + row["xmax"]) / 2)
            cy = int((row["ymin"] + row["ymax"]) / 2)
            centroids.append((cx, cy))
        return centroids
    
    def _format_detections(self, predictions: pd.DataFrame) -> List[Dict]:
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
    
    def _draw_annotations(self, image: np.ndarray, predictions: pd.DataFrame) -> np.ndarray:
        annotated = image.copy()
        
        for _, row in predictions.iterrows():
            xmin, ymin = int(row["xmin"]), int(row["ymin"])
            xmax, ymax = int(row["xmax"]), int(row["ymax"])
            
            # Using green box for sprouts as user did in test_single_image
            cv2.rectangle(annotated, (xmin, ymin), (xmax, ymax), (0, 255, 0), 2)
            
            # Draw center point
            cx, cy = (xmin + xmax) // 2, (ymin + ymax) // 2
            cv2.circle(annotated, (cx, cy), 1, CENTER_COLOR, -1)
            
        return annotated
    
    def _encode_image(self, image: np.ndarray) -> bytes:
        success, buffer = cv2.imencode(".jpg", image, [cv2.IMWRITE_JPEG_QUALITY, 90])
        if not success:
            raise RuntimeError("Failed to encode annotated image to JPEG")
        return buffer.tobytes()
