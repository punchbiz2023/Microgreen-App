"""
Convert COCO format annotations to YOLO format for training
"""

import json
import os
from pathlib import Path
import shutil


def convert_coco_to_yolo(coco_json_path, images_dir, output_dir):
    """
    Convert COCO annotations to YOLO format
    
    COCO bbox format: [x, y, width, height] (absolute pixels)
    YOLO format: [class_id, x_center, y_center, width, height] (normalized 0-1)
    """
    # Load COCO annotations
    with open(coco_json_path, 'r') as f:
        coco_data = json.load(f)
    
    # Create output directories
    output_dir = Path(output_dir)
    labels_dir = output_dir / 'labels'
    images_out_dir = output_dir / 'images'
    labels_dir.mkdir(parents=True, exist_ok=True)
    images_out_dir.mkdir(parents=True, exist_ok=True)
    
    # Create category mapping (COCO category_id to YOLO class_id)
    # In YOLO, class IDs start from 0
    category_mapping = {}
    for idx, cat in enumerate(coco_data['categories']):
        category_mapping[cat['id']] = idx
    
    print(f"Categories: {coco_data['categories']}")
    print(f"Category mapping: {category_mapping}")
    
    # Create image_id to image info mapping
    image_info = {}
    for img in coco_data['images']:
        image_info[img['id']] = {
            'file_name': img['file_name'],
            'width': img['width'],
            'height': img['height']
        }
    
    # Group annotations by image_id
    annotations_by_image = {}
    for ann in coco_data['annotations']:
        img_id = ann['image_id']
        if img_id not in annotations_by_image:
            annotations_by_image[img_id] = []
        annotations_by_image[img_id].append(ann)
    
    # Convert each image's annotations
    converted_count = 0
    for img_id, img_data in image_info.items():
        file_name = img_data['file_name']
        img_width = img_data['width']
        img_height = img_data['height']
        
        # Create YOLO label file
        label_file_name = Path(file_name).stem + '.txt'
        label_path = labels_dir / label_file_name
        
        # Copy image to output directory
        src_image = Path(images_dir) / file_name
        dst_image = images_out_dir / file_name
        if src_image.exists():
            shutil.copy(src_image, dst_image)
        
        # Write YOLO annotations
        with open(label_path, 'w') as f:
            if img_id in annotations_by_image:
                for ann in annotations_by_image[img_id]:
                    # COCO bbox: [x, y, width, height]
                    # Handle both numeric and string values
                    bbox = ann['bbox']
                    x = float(bbox[0])
                    y = float(bbox[1])
                    w = float(bbox[2])
                    h = float(bbox[3])
                    
                    # Convert to YOLO format (normalized)
                    x_center = (x + w / 2) / img_width
                    y_center = (y + h / 2) / img_height
                    width_norm = w / img_width
                    height_norm = h / img_height
                    
                    # Get YOLO class ID
                    class_id = category_mapping[ann['category_id']]
                    
                    # Write YOLO format: class x_center y_center width height
                    f.write(f"{class_id} {x_center:.6f} {y_center:.6f} {width_norm:.6f} {height_norm:.6f}\n")
        
        converted_count += 1
    
    print(f"\nConversion complete!")
    print(f"Converted {converted_count} images")
    print(f"Total annotations: {len(coco_data['annotations'])}")
    print(f"Output directory: {output_dir}")
    
    # Create dataset.yaml for YOLO training
    yaml_content = f"""# Microgreens Dataset Configuration
path: {output_dir.absolute()}  # dataset root dir
train: images  # train images (relative to 'path')
val: images    # val images (using same as train for small dataset)

# Classes
names:
"""
    for cat in coco_data['categories']:
        class_id = category_mapping[cat['id']]
        yaml_content += f"  {class_id}: {cat['name']}\n"
    
    yaml_path = output_dir / 'dataset.yaml'
    with open(yaml_path, 'w') as f:
        f.write(yaml_content)
    
    print(f"Created dataset.yaml at: {yaml_path}")
    
    return output_dir


if __name__ == '__main__':
    # Paths
    coco_json = r"c:\Users\hrith\OneDrive\Desktop\Urban sims\microgreens.coco (1)\train\_annotations.coco.json"
    images_dir = r"c:\Users\hrith\OneDrive\Desktop\Urban sims\microgreens.coco (1)\train"
    output_dir = r"c:\Users\hrith\OneDrive\Desktop\Urban sims\ml_engine\yolo_dataset"
    
    convert_coco_to_yolo(coco_json, images_dir, output_dir)
