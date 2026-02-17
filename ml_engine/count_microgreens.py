"""
Microgreen Plant Counting using Computer Vision
Uses HSV color segmentation and blob detection to count individual plants
"""

import cv2
import numpy as np
from typing import Tuple, Dict, Optional
import os


class MicrogreenCounter:
    """
    Count microgreen plants in tray images using HSV color segmentation
    """
    
    def __init__(self):
        # Default HSV ranges for green microgreens
        # These can be adjusted based on variety
        self.hsv_ranges = {
            'green': {
                'lower': np.array([35, 40, 40]),   # Lower bound for green
                'upper': np.array([85, 255, 255])  # Upper bound for green
            },
            'red': {  # For red amaranth, red cabbage
                'lower': np.array([0, 50, 50]),
                'upper': np.array([10, 255, 255])
            },
            'purple': {  # For purple varieties
                'lower': np.array([130, 50, 50]),
                'upper': np.array([160, 255, 255])
            }
        }
        
    def preprocess_image(self, image: np.ndarray) -> np.ndarray:
        """
        Preprocess image for better segmentation
        """
        # Apply Gaussian blur to reduce noise
        blurred = cv2.GaussianBlur(image, (5, 5), 0)
        
        # Convert to HSV color space
        hsv = cv2.cvtColor(blurred, cv2.COLOR_BGR2HSV)
        
        return hsv
    
    def create_mask(self, hsv_image: np.ndarray, color_type: str = 'green') -> np.ndarray:
        """
        Create binary mask based on HSV color range
        """
        if color_type not in self.hsv_ranges:
            color_type = 'green'
        
        lower = self.hsv_ranges[color_type]['lower']
        upper = self.hsv_ranges[color_type]['upper']
        
        # Create mask
        mask = cv2.inRange(hsv_image, lower, upper)
        
        # Morphological operations to clean up mask
        kernel = np.ones((3, 3), np.uint8)
        
        # Remove small noise
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel, iterations=2)
        
        # Fill small holes
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=2)
        
        return mask
    
    def count_plants(self, mask: np.ndarray, min_area: int = 50, max_area: int = 5000) -> Tuple[int, np.ndarray]:
        """
        Count individual plants using connected components
        
        Args:
            mask: Binary mask of detected plants
            min_area: Minimum area (pixels) to count as a plant
            max_area: Maximum area (pixels) for a single plant
            
        Returns:
            count: Number of plants detected
            labels: Labeled image with each plant having unique ID
        """
        # Find connected components
        num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(mask, connectivity=8)
        
        # Filter by area (skip background label 0)
        valid_plants = 0
        plant_centroids = []
        
        for i in range(1, num_labels):
            area = stats[i, cv2.CC_STAT_AREA]
            
            if min_area <= area <= max_area:
                valid_plants += 1
                plant_centroids.append(centroids[i])
        
        return valid_plants, labels, plant_centroids
    
    def draw_detections(self, image: np.ndarray, labels: np.ndarray, 
                       centroids: list, count: int) -> np.ndarray:
        """
        Draw detection results on image
        """
        output = image.copy()
        
        # Create colored overlay for detected regions
        mask_colored = np.zeros_like(image)
        mask_colored[labels > 0] = [0, 255, 0]  # Green overlay
        
        # Blend with original image
        output = cv2.addWeighted(output, 0.7, mask_colored, 0.3, 0)
        
        # Draw centroids
        for centroid in centroids:
            x, y = int(centroid[0]), int(centroid[1])
            cv2.circle(output, (x, y), 5, (0, 0, 255), -1)  # Red dot
            cv2.circle(output, (x, y), 8, (255, 255, 255), 2)  # White circle
        
        # Add count text
        font = cv2.FONT_HERSHEY_SIMPLEX
        text = f"Plants Detected: {count}"
        
        # Add background rectangle for text
        (text_width, text_height), _ = cv2.getTextSize(text, font, 1.2, 2)
        cv2.rectangle(output, (10, 10), (20 + text_width, 50 + text_height), (0, 0, 0), -1)
        cv2.putText(output, text, (15, 45), font, 1.2, (0, 255, 0), 2)
        
        return output
    
    def process_image(self, image_path: str, color_type: str = 'green',
                     min_area: int = 50, max_area: int = 5000,
                     save_output: Optional[str] = None) -> Dict:
        """
        Complete pipeline to count plants in an image
        
        Args:
            image_path: Path to input image
            color_type: Type of microgreen color ('green', 'red', 'purple')
            min_area: Minimum plant area in pixels
            max_area: Maximum plant area in pixels
            save_output: Optional path to save annotated image
            
        Returns:
            Dictionary with count and processing info
        """
        # Read image
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError(f"Could not read image: {image_path}")
        
        # Preprocess
        hsv_image = self.preprocess_image(image)
        
        # Create mask
        mask = self.create_mask(hsv_image, color_type)
        
        # Count plants
        count, labels, centroids = self.count_plants(mask, min_area, max_area)
        
        # Draw results
        annotated_image = self.draw_detections(image, labels, centroids, count)
        
        # Save if requested
        if save_output:
            cv2.imwrite(save_output, annotated_image)
        
        return {
            'count': count,
            'centroids': [(int(c[0]), int(c[1])) for c in centroids],
            'annotated_image': annotated_image,
            'mask': mask,
            'image_shape': image.shape
        }
    
    def process_image_bytes(self, image_bytes: bytes, color_type: str = 'green',
                           min_area: int = 50, max_area: int = 5000) -> Dict:
        """
        Process image from bytes (for API usage)
        
        Args:
            image_bytes: Image data as bytes
            color_type: Type of microgreen color
            min_area: Minimum plant area
            max_area: Maximum plant area
            
        Returns:
            Dictionary with count and annotated image
        """
        # Decode image from bytes
        nparr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            raise ValueError("Could not decode image from bytes")
        
        # Preprocess
        hsv_image = self.preprocess_image(image)
        
        # Create mask
        mask = self.create_mask(hsv_image, color_type)
        
        # Count plants
        count, labels, centroids = self.count_plants(mask, min_area, max_area)
        
        # Draw results
        annotated_image = self.draw_detections(image, labels, centroids, count)
        
        # Encode annotated image back to bytes
        _, buffer = cv2.imencode('.jpg', annotated_image)
        annotated_bytes = buffer.tobytes()
        
        return {
            'count': count,
            'centroids': [(int(c[0]), int(c[1])) for c in centroids],
            'annotated_image_bytes': annotated_bytes,
            'image_shape': image.shape
        }


def main():
    """
    Test the counter with sample images
    """
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python count_microgreens.py <image_path> [color_type] [output_path]")
        print("color_type: green (default), red, purple")
        sys.exit(1)
    
    image_path = sys.argv[1]
    color_type = sys.argv[2] if len(sys.argv) > 2 else 'green'
    output_path = sys.argv[3] if len(sys.argv) > 3 else 'output_annotated.jpg'
    
    counter = MicrogreenCounter()
    
    try:
        result = counter.process_image(
            image_path=image_path,
            color_type=color_type,
            save_output=output_path
        )
        
        print(f"\n{'='*50}")
        print(f"Microgreen Count Results")
        print(f"{'='*50}")
        print(f"Image: {image_path}")
        print(f"Color Type: {color_type}")
        print(f"Plants Detected: {result['count']}")
        print(f"Image Size: {result['image_shape'][1]}x{result['image_shape'][0]}")
        print(f"Annotated image saved to: {output_path}")
        print(f"{'='*50}\n")
        
    except Exception as e:
        print(f"Error processing image: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
