# DeepForest for Microgreens: A Comprehensive Guide

This guide explains how we use the **DeepForest** library to automatically count microgreens in your trays. We've designed this to be easy to understand, even if you're new to machine learning.

---

## 1. What is the DeepForest Python Package?

**DeepForest** is a specialized tool used by researchers to find and count trees in aerial photos (taken from planes or drones). 

- **How it works:** It uses an AI architecture called **RetinaNet** which is exceptionally good at finding small objects in large images.
- **The "Pretrained" Advantage:** It comes "pre-trained" on millions of trees, meaning it already knows what a circular, green crown looks like from above.

---

## 2. How Do We Use It for Microgreens?

You might wonder: *If it's for trees, how does it count microgreens?*

The secret is that **microgreens look like tiny trees** when viewed from directly above! Both have a roughly circular shape and a green "crown." 

We use a technique called **Transfer Learning**:
1. We take the model that knows about trees.
2. We "tile" the microgreen tray image into smaller patches (like looking through a magnifying glass).
3. The model identifies each sprout as if it were a small tree.

---

## 3. How Did We Customize It?

While the tree model is a great start, microgreens are much closer together and look slightly different. We customized it through **Fine-Tuning**:

1. **Custom Data:** We collected hundreds of photos of microgreen trays.
2. **Annotation:** We "boxed" each plant in those photos so the AI knew exactly what a microgreen looks like in *your* environment.
3. **Training:** We ran the `train_deepforest.py` script, which taught the model to shift its focus from giant forest trees to tiny microgreen sprouts.
4. **Specific Labels:** We simplified the model to look for just one thing: a `"plant"`.

---

## 4. How Is It Implemented? (The "Brain" Behind the Scenes)

The logic lives in a file called `ml_engine/count_deepforest.py`. Here is the step-by-step process when you upload a photo:

1. **Magnification (Tiling):** Instead of looking at the whole tray at once (which might be too blurry), the system cuts the image into small squares (tiles) of 400x400 pixels.
2. **Detection:** The AI looks at each tile and draws boxes around everything it thinks is a plant.
3. **Cleaning (NMS):** Sometimes two tiles overlap, and the AI might count the same plant twice. We use a "Non-Maximum Suppression" (NMS) algorithm to delete the duplicate boxes.
4. **Counting:** The system counts the remaining boxes and calculates the center point (centroid) of each plant.
5. **Visualization:** It draws yellow boxes and red dots on your image so you can see exactly what it "saw."

---

## 5. How to Change Parameters (Tuning)

You can adjust how "sensitive" the AI is without needing to be a coder. All these settings are in `ml_engine/config_deepforest.py`.

### The Most Important Knobs:

| Parameter | What it does | When to change it |
| :--- | :--- | :--- |
| **`SCORE_THRESHOLD`** | **Confidence.** (Current: 0.12) | **Decrease** (e.g., 0.05) if it's missing plants. **Increase** (e.g., 0.25) if it's counting "ghost" plants in empty soil. |
| **`PATCH_SIZE`** | **Zoom Level.** (Current: 400) | **Decrease** (e.g., 300) if your plants are very tiny and dense. |
| **`IOU_THRESHOLD`** | **Overlap Filter.** (Current: 0.3) | **Decrease** (e.g., 0.1) if you see "double boxes" on the same plant. |

---

## 6. Detailed Working Summary for Beginners

Imagine you have a giant puzzle of a forest. 
1. You take a **magnifying glass** (the `PATCH_SIZE`) and look at one small square at a time.
2. You have a **checklist** (`SCORE_THRESHOLD`) of what a tree looks like. If you're 12% sure it's a tree, you mark it.
3. If you move your magnifying glass and see the **same tree again**, you cross it off your list (`IOU_THRESHOLD`) so you don't count it twice.
4. At the end, you count all your marks. 

That is exactly what this code does, just millions of times faster!

---

### Key Files in your Project:
- [config_deepforest.py](file:///c:/Users/hrith/OneDrive/Desktop/Urban%20sims/ml_engine/config_deepforest.py): Where you change the "knobs" (parameters).
- [count_deepforest.py](file:///c:/Users/hrith/OneDrive/Desktop/Urban%20sims/ml_engine/count_deepforest.py): The actual engine that runs the detection.
- [train_deepforest.py](file:///c:/Users/hrith/OneDrive/Desktop/Urban%20sims/ml_engine/train_deepforest.py): The script used to "teach" the AI about your specific plants.
