"""
Microgreen Plant Counting using Trained YOLO Model
Uses YOLOv8 for individual plant detection
"""

from ultralytics import YOLO
import cv2
import numpy as np
from typing import Tuple, Dict, Optional
from pathlib import Path
from sklearn.cluster import DBSCAN


class MicrogreenYOLOCounter:
    """
    Count microgreen plants using trained YOLO model
    """
    
    def __init__(self, model_path: str = None):
        """
        Initialize with trained YOLO model
        
        Args:
            model_path: Path to trained model weights (best.pt)
        """
        if model_path is None:
            # Default to the trained model in project root runs/ directory
            # Go up from ml_engine to project root
            project_root = Path(__file__).parent.parent
            model_path = project_root / "runs" / "detect" / "microgreen_detector" / "weights" / "best.pt"
        
        model_path = Path(model_path)
        if not model_path.exists():
            raise FileNotFoundError(
                f"Model not found: {model_path}\n"
                f"Please train the model first using: python ml_engine/train_yolo.py"
            )
        
        self.model = YOLO(str(model_path))
        print(f"✓ Loaded YOLO model from: {model_path}")
    
    def count_plants(self, image: np.ndarray, conf_threshold: float = 0.25) -> Tuple[int, list]:
        """
        Count plants in image using YOLO detection
        
        Args:
            image: Input image (BGR format)
            conf_threshold: Confidence threshold for detections
            
        Returns:
            count: Number of plants detected
            boxes: List of detection boxes [x1, y1, x2, y2, conf]
        """
        # Run inference
        results = self.model(image, conf=conf_threshold, verbose=False)
        
        # Extract detections (leaf level)
        leaf_boxes = []
        for r in results:
            if r.boxes is not None and len(r.boxes) > 0:
                for box in r.boxes:
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    conf = float(box.conf[0])
                    leaf_boxes.append([x1, y1, x2, y2, conf])
        
        if not leaf_boxes:
            return 0, []
            
        # Extract centers for clustering
        centers = []
        for box in leaf_boxes:
            cx = (box[0] + box[2]) / 2.0
            cy = (box[1] + box[3]) / 2.0
            centers.append([cx, cy])
            
        centers = np.array(centers)
        
        # Perform DBSCAN clustering
        # eps is the maximum distance between two leaves to be considered part of the same plant
        # min_samples=1 so isolated leaves form their own plant (cluster)
        eps = 40.0  # Adjust as necessary based on image scale
        clustering = DBSCAN(eps=eps, min_samples=1).fit(centers)
        labels = clustering.labels_
        
        num_clusters = len(set(labels)) - (1 if -1 in labels else 0)
        
        # Merge bounding boxes by cluster
        plant_boxes = []
        for cluster_id in set(labels):
            if cluster_id == -1:
                # Treat noise points as individual plants, or ignore them. We'll treat as individual.
                noise_indices = np.where(labels == -1)[0]
                for idx in noise_indices:
                    plant_boxes.append(leaf_boxes[idx])
                continue
                
            cluster_indices = np.where(labels == cluster_id)[0]
            cluster_leaf_boxes = [leaf_boxes[i] for i in cluster_indices]
            
            # Find the bounding box that encompasses all leaves in the cluster
            min_x = min([b[0] for b in cluster_leaf_boxes])
            min_y = min([b[1] for b in cluster_leaf_boxes])
            max_x = max([b[2] for b in cluster_leaf_boxes])
            max_y = max([b[3] for b in cluster_leaf_boxes])
            
            # Average confidence
            avg_conf = np.mean([b[4] for b in cluster_leaf_boxes])
            
            plant_boxes.append([min_x, min_y, max_x, max_y, avg_conf])
            
        count = len(plant_boxes)
        return count, plant_boxes
    
    def draw_detections(self, image: np.ndarray, boxes: list, count: int) -> np.ndarray:
        """
        Draw detection results on image with professional styling
        """
        output = image.copy()
        
        # Professional color scheme (BGR format)
        # Using a bright but thin color for visibility without clutter
        box_color = (0, 255, 255)       # Yellow/Cyan mix for high contrast
        center_color = (0, 0, 255)      # Red for center points
        
        # Draw each detection
        for box in boxes:
            x1, y1, x2, y2, conf = box
            x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)
            
            # Draw bounding box - THIN line (1px)
            cv2.rectangle(output, (x1, y1), (x2, y2), box_color, 1)
            
            # Draw center point - SMALL dot (1px radius)
            cx, cy = (x1 + x2) // 2, (y1 + y2) // 2
            cv2.circle(output, (cx, cy), 1, center_color, -1)
            
            # REMOVED: Confidence labels and backgrounds to reduce clutter
            # For microgreens with 50+ items, text is too messy
        
        # REMOVED: Large "Plants Detected" badge on the image
        # The UI already displays the count clearly
        
        return output
    
    def process_image(self, image_path: str, conf_threshold: float = 0.25,
                     save_output: Optional[str] = None) -> Dict:
        """
        Complete pipeline to count plants in an image
        
        Args:
            image_path: Path to input image
            conf_threshold: Confidence threshold for detections
            save_output: Optional path to save annotated image
            
        Returns:
            Dictionary with count and processing info
        """
        # Read image
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError(f"Could not read image: {image_path}")
        
        # Count plants
        count, boxes = self.count_plants(image, conf_threshold)
        
        # Draw results
        annotated_image = self.draw_detections(image, boxes, count)
        
        # Save if requested
        if save_output:
            cv2.imwrite(save_output, annotated_image)
        
        # Extract centroids
        centroids = []
        for box in boxes:
            x1, y1, x2, y2, _ = box
            cx = int((x1 + x2) / 2)
            cy = int((y1 + y2) / 2)
            centroids.append((cx, cy))
        
        return {
            'count': count,
            'centroids': centroids,
            'boxes': boxes,
            'annotated_image': annotated_image,
            'image_shape': image.shape
        }
    
    def process_image_bytes(self, image_bytes: bytes, conf_threshold: float = 0.25) -> Dict:
        """
        Process image from bytes (for API usage)
        
        Args:
            image_bytes: Image data as bytes
            conf_threshold: Confidence threshold
            
        Returns:
            Dictionary with count and annotated image
        """
        # Decode image from bytes
        nparr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            raise ValueError("Could not decode image from bytes")
        
        # Count plants
        count, boxes = self.count_plants(image, conf_threshold)
        
        # Draw results
        annotated_image = self.draw_detections(image, boxes, count)
        
        # Encode annotated image back to bytes
        _, buffer = cv2.imencode('.jpg', annotated_image)
        annotated_bytes = buffer.tobytes()
        
        # Extract centroids
        centroids = []
        for box in boxes:
            x1, y1, x2, y2, _ = box
            cx = int((x1 + x2) / 2)
            cy = int((y1 + y2) / 2)
            centroids.append((cx, cy))
        
        return {
            'count': count,
            'centroids': centroids,
            'annotated_image_bytes': annotated_bytes,
            'image_shape': image.shape
        }


def main():
    """
    Test the YOLO counter with sample images
    """
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python count_yolo.py <image_path> [output_path]")
        sys.exit(1)
    
    image_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else 'output_yolo_annotated.jpg'
    
    counter = MicrogreenYOLOCounter()
    
    try:
        result = counter.process_image(
            image_path=image_path,
            conf_threshold=0.25,
            save_output=output_path
        )
        
        print(f"\n{'='*50}")
        print(f"YOLO Microgreen Count Results")
        print(f"{'='*50}")
        print(f"Image: {image_path}")
        print(f"Plants Detected: {result['count']}")
        print(f"Image Size: {result['image_shape'][1]}x{result['image_shape'][0]}")
        print(f"Annotated image saved to: {output_path}")
        print(f"{'='*50}\n")
        
    except Exception as e:
        print(f"Error processing image: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
