"""
DeepForest Training Script for Microgreen Plant Detection

Fine-tunes the pretrained DeepForest model (tree crown detector)
on custom microgreen plant annotations.

Usage:
    python train_deepforest.py
    python train_deepforest.py --epochs 100 --lr 0.00005 --batch-size 2

Prerequisites:
    1. Run convert_coco_to_deepforest.py first to generate annotations CSV
    2. pip install deepforest pytorch-lightning
"""

import argparse
import sys
from pathlib import Path

import pandas as pd

from config_deepforest import (
    DEEPFOREST_IMAGES_DIR,
    DEEPFOREST_TRAIN_CSV,
    DEEPFOREST_VAL_CSV,
    MODEL_DIR,
    MODEL_SAVE_PATH,
    EPOCHS,
    BATCH_SIZE,
    LEARNING_RATE,
    WORKERS,
    LABEL,
    DEVICE,
)


def validate_data():
    """Check that training data exists and is valid."""
    if not DEEPFOREST_TRAIN_CSV.exists():
        print("ERROR: Training CSV not found. Run convert_coco_to_deepforest.py first.")
        sys.exit(1)
    
    if not DEEPFOREST_VAL_CSV.exists():
        print("ERROR: Validation CSV not found. Run convert_coco_to_deepforest.py first.")
        sys.exit(1)
    
    train_df = pd.read_csv(DEEPFOREST_TRAIN_CSV)
    val_df = pd.read_csv(DEEPFOREST_VAL_CSV)
    
    # Verify required columns
    required_cols = {"image_path", "xmin", "ymin", "xmax", "ymax", "label"}
    for name, df in [("train", train_df), ("val", val_df)]:
        missing = required_cols - set(df.columns)
        if missing:
            print(f"ERROR: {name} CSV missing columns: {missing}")
            sys.exit(1)
    
    # Verify images exist
    missing_images = []
    for img in train_df["image_path"].unique():
        if not (DEEPFOREST_IMAGES_DIR / img).exists():
            missing_images.append(img)
    
    if missing_images:
        print(f"WARNING: {len(missing_images)} training images not found in {DEEPFOREST_IMAGES_DIR}")
        print(f"   First missing: {missing_images[0]}")
        sys.exit(1)
    
    print(f"Data validation passed:")
    print(f"   Train: {len(train_df)} annotations, {train_df['image_path'].nunique()} images")
    print(f"   Val:   {len(val_df)} annotations, {val_df['image_path'].nunique()} images")
    print(f"   Label: '{train_df['label'].unique()[0]}'")
    
    return train_df, val_df


def create_model():
    """
    Initialize the DeepForest model.
    
    Loads the pretrained tree crown checkpoint (auto-loaded in v2.x)
    and configures it for single-class plant detection.
    """
    print("\nLoading pretrained DeepForest model...")
    
    from deepforest.main import deepforest
    
    # Create model instance - v2.x auto-loads pretrained NEON tree crown weights
    model = deepforest()
    
    print("Pretrained model loaded (NEON tree crown weights)")
    print(f"   Architecture: RetinaNet with ResNet-50 backbone")
    print(f"   Device: {DEVICE}")
    
    return model


def train(model, train_csv, val_csv, epochs, lr, batch_size, workers):
    """
    Fine-tune the DeepForest model on microgreen data.
    
    Args:
        model: DeepForest model instance
        train_csv: Path to training annotations CSV
        val_csv: Path to validation annotations CSV
        epochs: Number of training epochs
        lr: Learning rate
        batch_size: Training batch size
        workers: Number of dataloader workers
    """
    print("\n" + "=" * 60)
    print("TRAINING CONFIGURATION")
    print("=" * 60)
    print(f"   Epochs:       {epochs}")
    print(f"   Batch size:   {batch_size}")
    print(f"   Learning rate: {lr}")
    print(f"   Workers:      {workers}")
    print(f"   Device:       {DEVICE}")
    print(f"   Train CSV:    {train_csv}")
    print(f"   Val CSV:      {val_csv}")
    print(f"   Image dir:    {DEEPFOREST_IMAGES_DIR}")
    print("=" * 60)
    
    # ---- Configure training parameters (DeepForest v2.x API) ----
    model.config["train"]["csv_file"] = str(train_csv)
    model.config["train"]["root_dir"] = str(DEEPFOREST_IMAGES_DIR)
    model.config["train"]["epochs"] = epochs
    model.config["train"]["lr"] = lr
    
    # Validation configuration
    model.config["validation"]["csv_file"] = str(val_csv)
    model.config["validation"]["root_dir"] = str(DEEPFOREST_IMAGES_DIR)
    
    # Top-level config (v2.x structure)
    model.config["batch_size"] = batch_size
    model.config["workers"] = workers
    model.label_dict = {LABEL: 0}
    
    # ---- Create trainer and start training ----
    print("\nStarting fine-tuning...")
    print("   (This may take a while, especially on CPU)\n")
    
    # create_trainer() sets up the PyTorch Lightning Trainer
    model.create_trainer()
    model.trainer.fit(model)
    
    print("\nTraining complete!")
    
    return model


def save_model(model, save_path):
    """Save the fine-tuned model checkpoint."""
    save_path = Path(save_path)
    save_path.parent.mkdir(parents=True, exist_ok=True)
    
    import torch
    torch.save(model.model.state_dict(), save_path)
    
    print(f"Model saved to: {save_path}")
    print(f"   File size: {save_path.stat().st_size / (1024*1024):.1f} MB")


def evaluate(model, val_csv):
    """Run evaluation on validation set and print metrics."""
    print("\nEvaluating on validation set...")
    
    try:
        results = model.evaluate(
            csv_file=str(val_csv),
            root_dir=str(DEEPFOREST_IMAGES_DIR),
            iou_threshold=0.4,
        )
        
        if results is not None:
            print(f"   Validation results:")
            if isinstance(results, dict):
                for key, value in results.items():
                    print(f"   {key}: {value}")
            else:
                print(f"   {results}")
        
        return results
    except Exception as e:
        print(f"WARNING: Evaluation failed (non-critical): {e}")
        return None


def main():
    parser = argparse.ArgumentParser(
        description="Fine-tune DeepForest for microgreen plant detection"
    )
    parser.add_argument("--epochs", type=int, default=EPOCHS,
                        help=f"Number of training epochs (default: {EPOCHS})")
    parser.add_argument("--lr", type=float, default=LEARNING_RATE,
                        help=f"Learning rate (default: {LEARNING_RATE})")
    parser.add_argument("--batch-size", type=int, default=BATCH_SIZE,
                        help=f"Batch size (default: {BATCH_SIZE})")
    parser.add_argument("--workers", type=int, default=WORKERS,
                        help=f"Dataloader workers (default: {WORKERS})")
    parser.add_argument("--no-eval", action="store_true",
                        help="Skip evaluation after training")
    parser.add_argument("--output", type=str, default=str(MODEL_SAVE_PATH),
                        help=f"Model save path (default: {MODEL_SAVE_PATH})")
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("DeepForest Microgreen Plant Detection - Training")
    print("=" * 60)
    
    # Step 1: Validate data
    print("\nValidating training data...")
    train_df, val_df = validate_data()
    
    # Step 2: Create model
    model = create_model()
    
    # Step 3: Train
    model = train(
        model=model,
        train_csv=DEEPFOREST_TRAIN_CSV,
        val_csv=DEEPFOREST_VAL_CSV,
        epochs=args.epochs,
        lr=args.lr,
        batch_size=args.batch_size,
        workers=args.workers,
    )
    
    # Step 4: Save model
    save_model(model, args.output)
    
    # Step 5: Evaluate
    if not args.no_eval:
        evaluate(model, DEEPFOREST_VAL_CSV)
    
    print("\n" + "=" * 60)
    print("TRAINING PIPELINE COMPLETE")
    print("=" * 60)
    print(f"   Model saved to: {args.output}")
    print(f"   To run inference: python inference_deepforest.py --image <path>")


if __name__ == "__main__":
    main()
