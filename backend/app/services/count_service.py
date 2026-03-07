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

# Use DeepForest model for plant detection
from count_deepforest import MicrogreenDeepForestCounter

# Use YOLO model for plant detection
from count_yolo import MicrogreenYOLOCounter


class CountService:
    """
    Service for counting microgreens in uploaded images
    Uses DeepForest (fine-tuned RetinaNet) for plant crown detection.
    """
    
    def __init__(self, upload_dir: str = "./static/count_results"):
        self.upload_dir = Path(upload_dir)
        self.upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize DeepForest counter
        print("🔍 Attempting to load DeepForest model...")
        self.df_counter = None
        try:
            self.df_counter = MicrogreenDeepForestCounter()
            print("✅ Successfully loaded DeepForest model for counting")
        except Exception as e:
            print(f"❌ Failed to load DeepForest model: {e}")
            
        # Initialize YOLO counter
        print("🔍 Attempting to load YOLO model...")
        self.yolo_counter = None
        try:
            self.yolo_counter = MicrogreenYOLOCounter()
            print("✅ Successfully loaded YOLO model for counting")
        except Exception as e:
            print(f"❌ Failed to load YOLO model: {e}")
            
        if not self.df_counter and not self.yolo_counter:
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
            else:
                if not self.df_counter:
                    raise RuntimeError("DeepForest model is not available")
                print(f"🌱 Processing image with DeepForest (conf={conf_threshold})")
                self.method = "DeepForest"
                result = self.df_counter.process_image_bytes(
                    image_bytes=image_bytes,
                    conf_threshold=conf_threshold,
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
    """Get or create count service instance"""
    global _count_service
    if _count_service is None:
        _count_service = CountService()
    return _count_service
