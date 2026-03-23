# [DeepForest Tuning] How to Adjust Prediction Parameters

To "fine-tune" the detection behavior (adjusting how many plants are caught or how many false positives are removed) without retraining the model, you should modify the configuration files in the `ml_engine` directory.

## DeepForest Detection Tuning

Since you have `count_deepforest.py` open, you should look at [config_deepforest.py](file:///c:/Users/hrith/OneDrive/Desktop/Urban%20sims/ml_engine/config_deepforest.py).

### Key Parameters to Adjust:

1. **Confidence Threshold (`SCORE_THRESHOLD`)**:
   - Location: `config_deepforest.py` line 65.
   - **Decrease** it (e.g., to `0.05`) to catch more small or faint plants.
   - **Increase** it (e.g., to `0.30`) if you are seeing too many "fake" detections in empty soil.

2. **IoU Threshold (`IOU_THRESHOLD`)**:
   - Location: `config_deepforest.py` line 69.
   - This controls how much overlap is allowed between two boxes before the model thinks they are the same plant.
   - **Decrease** it (e.g., to `0.1`) to be more aggressive in removing overlapping boxes.
   - **Increase** it (e.g., to `0.5`) if the model is merging two real plants that are very close together.

3. **Tile Size and Overlap (`PATCH_SIZE` & `PATCH_OVERLAP`)**:
   - Location: `config_deepforest.py` lines 61-62.
   - DeepForest works by "tiling" your tray into smaller patches.
   - If plants at the edges of patches are being missed or cut in half, increase the `PATCH_OVERLAP`.

---

## Sprout Detection Tuning

If you are using the Sprout Detection model ([count_sprout.py](file:///c:/Users/hrith/OneDrive/Desktop/Urban%20sims/ml_engine/count_sprout.py)):

- The thresholds are currently passed as arguments in `process_image_bytes` (line 46).
- Default `conf_threshold` is `0.55`.
- Default `iou_threshold` is `0.2`.
- You can modify these defaults directly in the code if needed.

---

## YOLO Detection Tuning

If you are using the YOLO model ([count_yolo.py](file:///c:/Users/hrith/OneDrive/Desktop/Urban%20sims/ml_engine/count_yolo.py)), the thresholds are currently passed as arguments:

- In `count_yolo.py`, look at the `conf_threshold` parameter in `count_plants` (line 41).
- You can change the default value `0.25` to whatever you need.

## Yield Prediction Tuning

If you meant the **Yield Prediction** (the numbers/grams forecast), the logic for how temperature and humidity affect the yield is found in [prediction_service.py](file:///c:/Users/hrith/OneDrive/Desktop/Urban%20sims/ml_engine/prediction_service.py) within the `_generate_suggestions` method (line 129).
