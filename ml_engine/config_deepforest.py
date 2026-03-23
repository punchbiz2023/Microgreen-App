"""
DeepForest Configuration for Microgreen Plant Detection

Centralized configuration for all DeepForest pipeline parameters.
Modify these settings to tune performance for your specific tray setup.
"""

import os
from pathlib import Path

# =============================================================================
# PATH CONFIGURATION
# =============================================================================

# Base directories
ML_ENGINE_DIR = Path(__file__).parent.resolve()
PROJECT_ROOT = ML_ENGINE_DIR.parent

# Dataset paths
COCO_DATASET_DIR = Path(r"C:\Users\hrith\Downloads\My First Project.coco\train")
COCO_ANNOTATIONS_FILE = COCO_DATASET_DIR / "_annotations.coco.json"

# DeepForest data directory (converted annotations + copied images)
DEEPFOREST_DATA_DIR = ML_ENGINE_DIR / "deepforest_data"
DEEPFOREST_IMAGES_DIR = DEEPFOREST_DATA_DIR / "images"
DEEPFOREST_ANNOTATIONS_CSV = DEEPFOREST_DATA_DIR / "annotations.csv"
DEEPFOREST_TRAIN_CSV = DEEPFOREST_DATA_DIR / "train.csv"
DEEPFOREST_VAL_CSV = DEEPFOREST_DATA_DIR / "val.csv"

# Model save path
MODEL_DIR = ML_ENGINE_DIR / "models"
MODEL_SAVE_PATH = MODEL_DIR / "deepforest_microgreens.pt"

# =============================================================================
# LABEL CONFIGURATION
# =============================================================================

# All annotations mapped to this single label
LABEL = "plant"

# =============================================================================
# TRAINING CONFIGURATION
# =============================================================================

# Training hyperparameters
EPOCHS = 50
BATCH_SIZE = 4
LEARNING_RATE = 0.0001
WORKERS = 0  # Set to 0 for Windows compatibility

# Train/validation split ratio
TRAIN_SPLIT = 0.8

# =============================================================================
# INFERENCE CONFIGURATION
# =============================================================================

# Patch-based prediction for dense, small-object detection
# Smaller patch_size = better detection of small plants but slower
# Higher patch_overlap = fewer missed plants at patch boundaries
PATCH_SIZE = 300
PATCH_OVERLAP = 0.5

# Confidence threshold: lower catches more plants but increases false positives
SCORE_THRESHOLD = 0.10

# IoU threshold for Non-Maximum Suppression
# Lower = more aggressive duplicate removal
IOU_THRESHOLD = 0.4

# =============================================================================
# VISUALIZATION
# =============================================================================

# Bounding box drawing settings
BOX_COLOR = (0, 255, 255)  # Yellow boxes (BGR)
BOX_THICKNESS = 1
CENTER_COLOR = (0, 0, 255) # Red center dot

# =============================================================================
# DEVICE CONFIGURATION
# =============================================================================

def get_device():
    """Auto-detect best available device for training/inference."""
    try:
        import torch
        if torch.cuda.is_available():
            return "cuda"
    except ImportError:
        pass
    return "cpu"

DEVICE = get_device()
