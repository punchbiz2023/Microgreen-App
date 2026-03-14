"""
Service layer for microgreen plant counting
Handles image processing and count operations using trained DeepForest model
"""

import os
import sys
from pathlib import Path
from typing import Dict, List, Optional
import uuid

# Add ml_engine to path
ml_engine_path = Path(__file__).parent.parent.parent / 'ml_engine'
sys.path.insert(0, str(ml_engine_path))

# Use YOLO model for plant detection
from count_yolo import MicrogreenYOLOCounter

# Use Sprout model for plant detection
from count_sprout import MicrogreenSproutCounter


class CountService:
    """
    Service for counting microgreens in uploaded images
    Uses DeepForest (fine-tuned RetinaNet) for plant crown detection.
    """
    
    def __init__(self, upload_dir: str = "./static/count_results"):
        self.upload_dir = Path(upload_dir)
        self.upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize YOLO counter
        print("🔍 Attempting to load YOLO model...")
        self.yolo_counter = None
        try:
            self.yolo_counter = MicrogreenYOLOCounter()
            print("✅ Successfully loaded YOLO model for counting")
        except Exception as e:
            print(f"❌ Failed to load YOLO model: {e}")
            
        # Initialize Sprout counter
        print("🔍 Attempting to load Sprout model...")
        self.sprout_counter = None
        try:
            self.sprout_counter = MicrogreenSproutCounter()
            print("✅ Successfully loaded Sprout model for counting")
        except Exception as e:
            print(f"❌ Failed to load Sprout model: {e}")
            
        if not self.yolo_counter and not self.sprout_counter:
            raise RuntimeError("Failed to load any plant counting models.")
    
    def count_from_bytes(self, image_bytes: bytes, 
                        model_type: str = 'deepforest',
                        color_type: str = 'green',
                        min_area: int = 50,
                        max_area: int = 5000,
                        conf_threshold: float = 0.3,
                        save_annotated: bool = True) -> Dict:
        """
        Count plants from image bytes using DeepForest.
        
        Args:
            image_bytes: Image data as bytes
            color_type: Microgreen color type (kept for API compatibility)
            min_area: Minimum plant area (kept for API compatibility)
            max_area: Maximum plant area (kept for API compatibility)
            conf_threshold: Confidence threshold for detection
            save_annotated: Whether to save the annotated image
            
        Returns:
            Dictionary with count, detections, and annotated image path
        """
        try:
            model_type = model_type.lower()
            if model_type == 'yolo':
                if not self.yolo_counter:
                    raise RuntimeError("YOLO model is not available")
                print(f"🌱 Processing image with YOLO (conf={conf_threshold})")
                self.method = "YOLO"
                result = self.yolo_counter.process_image_bytes(
                    image_bytes=image_bytes,
                    conf_threshold=conf_threshold,
                )
            elif model_type == 'sprout':
                if not self.sprout_counter:
                    raise RuntimeError("Sprout model is not available")
                print(f"🌱 Processing image with Sprout model (conf={conf_threshold})")
                self.method = "Sprout"
                # If we want to override conf_threshold for sprout to default 0.55 unless explicitly specified differently:
                sprout_conf = conf_threshold if conf_threshold != 0.3 else 0.55
                result = self.sprout_counter.process_image_bytes(
                    image_bytes=image_bytes,
                    conf_threshold=sprout_conf,
                    patch_size=500,
                    patch_overlap=0.1,
                    iou_threshold=0.2
                )
            else:
                raise ValueError(f"Unknown model type: {model_type}")
            
            # Save annotated image if requested
            annotated_path = None
            if save_annotated:
                # Generate unique filename
                filename = f"count_{uuid.uuid4().hex[:8]}.jpg"
                save_file_path = self.upload_dir / filename
                
                # Save annotated image
                with open(save_file_path, 'wb') as f:
                    f.write(result['annotated_image_bytes'])
                
                # Return relative path for API response
                annotated_path = f"/static/count_results/{filename}"
            
            print(f"✅ Count complete: {result['count']} plants detected using {self.method}")
            
            return {
                'count': result['count'],
                'centroids': result['centroids'],
                'detections': result.get('detections', []),
                'annotated_image_url': annotated_path,
                'image_width': result['image_shape'][1],
                'image_height': result['image_shape'][0],
                'method': self.method,
                'color_type': color_type,
                'parameters': {
                    'conf_threshold': conf_threshold,
                }
            }
        except Exception as e:
            print(f"❌ Error in count_from_bytes: {e}")
            import traceback
            traceback.print_exc()
            raise


# Singleton instance
_count_service = None

def get_count_service() -> CountService:
    """Get or create count service instance"""
    global _count_service
    if _count_service is None:
        _count_service = CountService()
    return _count_service
