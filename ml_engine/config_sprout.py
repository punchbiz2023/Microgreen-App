"""
Configuration parameters for the Sprout Detection Model (PyTorch Lightning)
Adjust these values to fine-tune the detection accuracy without changing code.
"""

# Confidence threshold: lower catches more sprouts but increases false positives.
# Suggested: 0.30 - 0.40 for dense trays.
SCORE_THRESHOLD = 0.35

# IoU (Intersection over Union) threshold for overlapping detections.
# Lower values reduce overlapping boxes by removing those with lower confidence.
IOU_THRESHOLD = 0.15

# Patch Size: The image is split into tiles of this size for processing.
PATCH_SIZE = 300

# Patch Overlap: How much the tiles overlap (0.0 to 1.0).
# Increasing this helps ensure sprouts at boundaries are captured fully.
PATCH_OVERLAP = 0.4

# Max Box Size: Filter out artifacts/false positives larger than this (in pixels).
# Microgreen sprouts are typically small (20-60px). Anything > 150px is likely an error.
MAX_BOX_SIZE = 150
