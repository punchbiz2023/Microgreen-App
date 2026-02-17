"""
Service layer for microgreen plant counting
Handles image processing and count operations using trained YOLO model
"""

import os
import sys
from pathlib import Path
from typing import Dict, Optional
import uuid

# Add ml_engine to path
ml_engine_path = Path(__file__).parent.parent.parent / 'ml_engine'
sys.path.insert(0, str(ml_engine_path))

try:
    from count_yolo import MicrogreenYOLOCounter
    USE_YOLO = True
except ImportError:
    print("Warning: YOLO model not available, falling back to HSV segmentation")
    from count_microgreens import MicrogreenCounter
    USE_YOLO = False


class CountService:
    """
    Service for counting microgreens in uploaded images
    """
    
    def __init__(self, upload_dir: str = "./static/count_results"):
        self.upload_dir = Path(upload_dir)
        self.upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize counter (YOLO if available, otherwise HSV)
        if USE_YOLO:
            try:
                print("🔍 Attempting to load YOLO model...")
                self.counter = MicrogreenYOLOCounter()
                self.method = "YOLO"
                print("✅ Successfully loaded YOLO model for counting")
            except FileNotFoundError as e:
                print(f"⚠️  YOLO model not found: {e}")
                print("📊 Falling back to HSV color segmentation method")
                self.counter = MicrogreenCounter()
                self.method = "HSV"
            except Exception as e:
                print(f"⚠️  Failed to load YOLO model: {e}")
                print("📊 Falling back to HSV color segmentation method")
                self.counter = MicrogreenCounter()
                self.method = "HSV"
        else:
            print("📊 Using HSV color segmentation method (YOLO not available)")
            self.counter = MicrogreenCounter()
            self.method = "HSV"
    
    def count_from_bytes(self, image_bytes: bytes, 
                        color_type: str = 'green',
                        min_area: int = 50,
                        max_area: int = 5000,
                        conf_threshold: float = 0.25,
                        save_annotated: bool = True) -> Dict:
        """
        Count plants from image bytes
        
        Args:
            image_bytes: Image data as bytes
            color_type: Microgreen color type (for HSV method)
            min_area: Minimum plant area (for HSV method)
            max_area: Maximum plant area (for HSV method)
            conf_threshold: Confidence threshold (for YOLO method)
            save_annotated: Whether to save the annotated image
            
        Returns:
            Dictionary with count and annotated image path
        """
        try:
            # Process image based on available method
            if self.method == "YOLO":
                print(f"🎯 Processing image with YOLO model (conf={conf_threshold})")
                result = self.counter.process_image_bytes(
                    image_bytes=image_bytes,
                    conf_threshold=conf_threshold
                )
            else:
                print(f"🌈 Processing image with HSV method (color={color_type}, area={min_area}-{max_area})")
                result = self.counter.process_image_bytes(
                    image_bytes=image_bytes,
                    color_type=color_type,
                    min_area=min_area,
                    max_area=max_area
                )
            
            # Save annotated image if requested
            annotated_path = None
            if save_annotated:
                # Generate unique filename
                filename = f"count_{uuid.uuid4().hex[:8]}.jpg"
                annotated_path = self.upload_dir / filename
                
                # Save annotated image
                with open(annotated_path, 'wb') as f:
                    f.write(result['annotated_image_bytes'])
                
                # Return relative path for API response
                annotated_path = f"/static/count_results/{filename}"
            
            print(f"✅ Count complete: {result['count']} plants detected using {self.method} method")
            
            return {
                'count': result['count'],
                'centroids': result['centroids'],
                'annotated_image_url': annotated_path,
                'image_width': result['image_shape'][1],
                'image_height': result['image_shape'][0],
                'method': self.method,
                'parameters': {
                    'conf_threshold': conf_threshold if self.method == "YOLO" else None,
                    'color_type': color_type if self.method == "HSV" else None,
                    'min_area': min_area if self.method == "HSV" else None,
                    'max_area': max_area if self.method == "HSV" else None
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
