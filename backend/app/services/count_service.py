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

# Use Sprout model for plant detection
from count_sprout import MicrogreenSproutCounter
import config_sprout


class CountService:
    """
    Service for counting microgreens in uploaded images
    Uses DeepForest (fine-tuned RetinaNet) for plant crown detection.
    """
    
    def __init__(self, upload_dir: str = "./static/count_results"):
        self.upload_dir = Path(upload_dir)
        self.upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize Sprout counter (graceful degradation - app still works without it)
        print("🔍 Attempting to load Sprout model...")
        self.sprout_counter = None
        self.model_available = False
        try:
            self.sprout_counter = MicrogreenSproutCounter()
            self.model_available = True
            print("✅ Successfully loaded Sprout model for counting")
        except Exception as e:
            print(f"⚠️  Sprout model unavailable: {e}")
            print("   Plant counting feature will return an error when used.")
            print("   All other app features remain fully functional.")
    
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
            if not self.sprout_counter or not self.model_available:
                raise RuntimeError("Sprout detection model is not loaded. Check that ml_engine/models/sprout_model.pl exists.")
            
            print(f"🌱 Processing image with Sprout model (conf={conf_threshold})")
            self.method = "Sprout"
            
            # Use config values instead of hardcoded/inconsistent mapping
            result = self.sprout_counter.process_image_bytes(
                image_bytes=image_bytes,
                conf_threshold=config_sprout.SCORE_THRESHOLD,
                patch_size=config_sprout.PATCH_SIZE,
                patch_overlap=config_sprout.PATCH_OVERLAP,
                iou_threshold=config_sprout.IOU_THRESHOLD
            )
            
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
    """Get or create count service instance (graceful degradation if model unavailable)"""
    global _count_service
    if _count_service is None:
        try:
            _count_service = CountService()
        except Exception as e:
            print(f"⚠️  CountService could not be initialized: {e}")
            # Return a dummy object that will fail gracefully on use
            _count_service = CountService.__new__(CountService)
            _count_service.sprout_counter = None
            _count_service.model_available = False
            _count_service.upload_dir = Path("./static/count_results")
            _count_service.upload_dir.mkdir(parents=True, exist_ok=True)
    return _count_service
