"""
Convert COCO annotations to DeepForest CSV format.

COCO format: bbox = [x, y, width, height] (top-left origin)
DeepForest CSV: image_path, xmin, ymin, xmax, ymax, label

This script:
1. Reads the COCO JSON annotations
2. Converts each bbox to (xmin, ymin, xmax, ymax) format
3. Copies images to the DeepForest data directory
4. Writes a single CSV with all annotations labeled as "plant"
5. Splits into train/validation CSVs
"""

import json
import shutil
import pandas as pd
import numpy as np
from pathlib import Path

from config_deepforest import (
    COCO_DATASET_DIR,
    COCO_ANNOTATIONS_FILE,
    DEEPFOREST_DATA_DIR,
    DEEPFOREST_IMAGES_DIR,
    DEEPFOREST_ANNOTATIONS_CSV,
    DEEPFOREST_TRAIN_CSV,
    DEEPFOREST_VAL_CSV,
    LABEL,
    TRAIN_SPLIT,
)


def load_coco_annotations(json_path: Path) -> dict:
    """Load and parse COCO JSON annotation file."""
    if not json_path.exists():
        raise FileNotFoundError(f"COCO annotations not found at: {json_path}")
    
    with open(json_path, "r") as f:
        coco = json.load(f)
    
    print(f"✅ Loaded COCO annotations:")
    print(f"   Images: {len(coco['images'])}")
    print(f"   Annotations: {len(coco['annotations'])}")
    print(f"   Categories: {[c['name'] for c in coco['categories']]}")
    return coco


def convert_coco_to_deepforest_csv(coco: dict) -> pd.DataFrame:
    """
    Convert COCO annotations to DeepForest CSV format.
    
    COCO bbox: [x, y, width, height] → DeepForest: [xmin, ymin, xmax, ymax]
    
    Args:
        coco: Parsed COCO annotation dictionary
        
    Returns:
        DataFrame with columns: image_path, xmin, ymin, xmax, ymax, label
    """
    # Build image_id → filename mapping
    id_to_filename = {img["id"]: img["file_name"] for img in coco["images"]}
    
    rows = []
    for ann in coco["annotations"]:
        image_id = ann["image_id"]
        filename = id_to_filename.get(image_id)
        
        if filename is None:
            print(f"⚠️  Skipping annotation {ann['id']}: no matching image for id {image_id}")
            continue
        
        # COCO bbox = [x, y, width, height]
        x, y, w, h = ann["bbox"]
        x, y, w, h = float(x), float(y), float(w), float(h)
        
        # Convert to absolute pixel coordinates
        xmin = int(round(x))
        ymin = int(round(y))
        xmax = int(round(x + w))
        ymax = int(round(y + h))
        
        # Skip degenerate boxes
        if xmax <= xmin or ymax <= ymin:
            print(f"⚠️  Skipping degenerate box for image {filename}: "
                  f"[{xmin}, {ymin}, {xmax}, {ymax}]")
            continue
        
        rows.append({
            "image_path": filename,
            "xmin": xmin,
            "ymin": ymin,
            "xmax": xmax,
            "ymax": ymax,
            "label": LABEL,
        })
    
    df = pd.DataFrame(rows)
    print(f"✅ Converted {len(df)} annotations across {df['image_path'].nunique()} images")
    return df


def copy_images(coco: dict, src_dir: Path, dst_dir: Path):
    """Copy dataset images to the DeepForest data directory."""
    dst_dir.mkdir(parents=True, exist_ok=True)
    
    copied = 0
    for img in coco["images"]:
        src = src_dir / img["file_name"]
        dst = dst_dir / img["file_name"]
        
        if src.exists():
            shutil.copy2(src, dst)
            copied += 1
        else:
            print(f"⚠️  Image not found: {src}")
    
    print(f"✅ Copied {copied}/{len(coco['images'])} images to {dst_dir}")


def split_train_val(df: pd.DataFrame, train_ratio: float = 0.8):
    """
    Split annotations into train/validation sets by image.
    
    Ensures all annotations for a given image go to the same split.
    
    Args:
        df: Full annotations DataFrame
        train_ratio: Fraction of images to use for training
        
    Returns:
        (train_df, val_df) tuple
    """
    np.random.seed(42)
    
    unique_images = df["image_path"].unique()
    np.random.shuffle(unique_images)
    
    split_idx = int(len(unique_images) * train_ratio)
    train_images = set(unique_images[:split_idx])
    val_images = set(unique_images[split_idx:])
    
    train_df = df[df["image_path"].isin(train_images)].reset_index(drop=True)
    val_df = df[df["image_path"].isin(val_images)].reset_index(drop=True)
    
    print(f"✅ Split: {len(train_images)} train images ({len(train_df)} annotations), "
          f"{len(val_images)} val images ({len(val_df)} annotations)")
    
    return train_df, val_df


def main():
    """Run the full COCO → DeepForest conversion pipeline."""
    print("=" * 60)
    print("COCO → DeepForest Annotation Converter")
    print("=" * 60)
    
    # Step 1: Create output directories
    DEEPFOREST_DATA_DIR.mkdir(parents=True, exist_ok=True)
    DEEPFOREST_IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    
    # Step 2: Load COCO annotations
    print("\n📂 Loading COCO annotations...")
    coco = load_coco_annotations(COCO_ANNOTATIONS_FILE)
    
    # Step 3: Convert to DeepForest format
    print("\n🔄 Converting annotations...")
    df = convert_coco_to_deepforest_csv(coco)
    
    # Step 4: Copy images
    print("\n📸 Copying images...")
    copy_images(coco, COCO_DATASET_DIR, DEEPFOREST_IMAGES_DIR)
    
    # Step 5: Save full annotations CSV
    df.to_csv(DEEPFOREST_ANNOTATIONS_CSV, index=False)
    print(f"\n💾 Full annotations saved to: {DEEPFOREST_ANNOTATIONS_CSV}")
    
    # Step 6: Split into train/val
    print("\n✂️  Splitting into train/validation...")
    train_df, val_df = split_train_val(df, TRAIN_SPLIT)
    
    train_df.to_csv(DEEPFOREST_TRAIN_CSV, index=False)
    val_df.to_csv(DEEPFOREST_VAL_CSV, index=False)
    print(f"💾 Train CSV: {DEEPFOREST_TRAIN_CSV}")
    print(f"💾 Val CSV:   {DEEPFOREST_VAL_CSV}")
    
    # Step 7: Summary
    print("\n" + "=" * 60)
    print("✅ CONVERSION COMPLETE")
    print("=" * 60)
    print(f"   Total images:      {df['image_path'].nunique()}")
    print(f"   Total annotations: {len(df)}")
    print(f"   Label:             '{LABEL}'")
    print(f"   Train images:      {train_df['image_path'].nunique()}")
    print(f"   Val images:        {val_df['image_path'].nunique()}")
    
    # Show sample
    print("\n📋 Sample annotations (first 5 rows):")
    print(df.head().to_string(index=False))


if __name__ == "__main__":
    main()
