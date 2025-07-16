from training.train_cassava import EfficientNetClassifier, get_transforms
import os
import json
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, Dataset
from torchvision import transforms
from PIL import Image
import timm
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import numpy as np
from pathlib import Path
from torch.cuda.amp import autocast
import matplotlib.pyplot as plt
import seaborn as sns
import sys

# Add parent directory to path to import from training module
sys.path.append(str(Path(__file__).parent.parent))


class CassavaRawDataset(Dataset):
    def __init__(self, data_dir, transform=None):
        self.data_dir = Path(data_dir)
        self.transform = transform

        # Load tree.json to get class names
        with open(self.data_dir / 'tree.json', 'r') as f:
            tree_data = json.load(f)

        # Get class names from augmented data (to maintain same order)
        self.classes = tree_data['Combined']['Augmented']['Cassava']['train_set']
        self.class_to_idx = {cls: idx for idx, cls in enumerate(self.classes)}

        # Build file paths from raw data
        self.samples = []
        raw_path = self.data_dir / 'Combined' / 'Raw' / 'CCMT' / 'Cassava'

        for class_name in self.classes:
            class_dir = raw_path / class_name
            if class_dir.exists():
                for img_path in class_dir.glob('*'):
                    if img_path.suffix.lower() in ['.jpg', '.jpeg', '.png']:
                        self.samples.append(
                            (str(img_path), self.class_to_idx[class_name]))

        print(f"Found {len(self.samples)} images in raw dataset")

        # Print distribution
        class_counts = {cls: 0 for cls in self.classes}
        for _, label in self.samples:
            class_name = self.classes[label]
            class_counts[class_name] += 1

        print("\nClass distribution in raw data:")
        for cls, count in class_counts.items():
            print(f"  {cls}: {count} images")

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        img_path, label = self.samples[idx]
        image = Image.open(img_path).convert('RGB')

        if self.transform:
            image = self.transform(image)

        return image, label, img_path


def test_on_raw_data(model, dataloader, device, class_names):
    """Test the model on raw data and return detailed results"""
    model.eval()
    all_predictions = []
    all_targets = []
    all_probs = []
    misclassified = []

    with torch.no_grad():
        for batch_idx, (data, target, paths) in enumerate(dataloader):
            data, target = data.to(device), target.to(device)

            with autocast():
                output = model(data)
                probs = torch.softmax(output, dim=1)

            _, predicted = torch.max(output.data, 1)

            all_predictions.extend(predicted.cpu().numpy())
            all_targets.extend(target.cpu().numpy())
            all_probs.extend(probs.cpu().numpy())

            # Track misclassified images
            for i in range(len(predicted)):
                if predicted[i] != target[i]:
                    misclassified.append({
                        'path': paths[i],
                        'true_label': class_names[target[i]],
                        'predicted_label': class_names[predicted[i]],
                        'confidence': probs[i][predicted[i]].item()
                    })

            if batch_idx % 10 == 0:
                print(f'Testing batch {batch_idx}/{len(dataloader)}')

    accuracy = accuracy_score(all_targets, all_predictions)
    return accuracy, all_predictions, all_targets, all_probs, misclassified


def plot_detailed_results(y_true, y_pred, class_names, save_dir):
    """Generate detailed visualizations of test results"""
    save_dir = Path(save_dir)

    # 1. Confusion Matrix
    cm = confusion_matrix(y_true, y_pred)
    plt.figure(figsize=(12, 10))

    # Calculate percentages
    cm_normalized = cm.astype('float') / cm.sum(axis=1)[:, np.newaxis] * 100

    # Create annotation text with both count and percentage
    annotations = np.empty_like(cm).astype(str)
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            annotations[i, j] = f'{cm[i, j]}\n({cm_normalized[i, j]:.1f}%)'

    sns.heatmap(cm, annot=annotations, fmt='', cmap='Blues',
                xticklabels=class_names, yticklabels=class_names,
                cbar_kws={'label': 'Count'})
    plt.title('Confusion Matrix - Raw Data Test Results', fontsize=16)
    plt.ylabel('True Label', fontsize=12)
    plt.xlabel('Predicted Label', fontsize=12)
    plt.xticks(rotation=45, ha='right')
    plt.tight_layout()
    plt.savefig(save_dir / 'cassava_raw_confusion_matrix.png', dpi=300)
    plt.close()

    # 2. Per-class accuracy bar chart
    per_class_accuracy = []
    for i, class_name in enumerate(class_names):
        class_mask = np.array(y_true) == i
        if class_mask.sum() > 0:
            class_acc = accuracy_score(
                np.array(y_true)[class_mask],
                np.array(y_pred)[class_mask]
            ) * 100
            per_class_accuracy.append(class_acc)
        else:
            per_class_accuracy.append(0)

    plt.figure(figsize=(10, 6))
    bars = plt.bar(class_names, per_class_accuracy)

    # Color bars based on accuracy
    for i, (bar, acc) in enumerate(zip(bars, per_class_accuracy)):
        if acc >= 90:
            bar.set_color('green')
        elif acc >= 80:
            bar.set_color('yellow')
        else:
            bar.set_color('red')

        # Add value labels on bars
        plt.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 1,
                 f'{acc:.1f}%', ha='center', va='bottom')

    plt.title('Per-Class Accuracy on Raw Data', fontsize=16)
    plt.xlabel('Disease Class', fontsize=12)
    plt.ylabel('Accuracy (%)', fontsize=12)
    plt.xticks(rotation=45, ha='right')
    plt.ylim(0, 105)
    plt.tight_layout()
    plt.savefig(save_dir / 'cassava_raw_per_class_accuracy.png', dpi=300)
    plt.close()


def main():
    # Configuration
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Using device: {device}")

    # Paths
    data_dir = Path('../data')  # Updated path to go up one level
    models_dir = Path('../training/models')  # Updated path to training/models
    results_dir = Path('test_results')
    results_dir.mkdir(exist_ok=True)

    # Load class names
    with open(data_dir / 'tree.json', 'r') as f:
        tree_data = json.load(f)
    class_names = tree_data['Combined']['Augmented']['Cassava']['train_set']
    print(f"\nClasses: {class_names}")

    # Load model
    model = EfficientNetClassifier(num_classes=5, model_name='efficientnet_b1')
    model_path = models_dir / 'best_cassava_model.pth'

    if not model_path.exists():
        print(f"Error: Model file not found at {model_path}")
        return

    model.load_state_dict(torch.load(model_path, map_location=device))
    model = model.to(device)
    model.eval()
    print(f"\nLoaded model from {model_path}")

    # Get transforms (same as validation transforms)
    _, test_transform = get_transforms()

    # Create raw dataset
    print("\nLoading raw test data...")
    raw_dataset = CassavaRawDataset(data_dir, transform=test_transform)

    # DataLoader
    test_loader = DataLoader(
        raw_dataset,
        batch_size=32,
        shuffle=False,
        num_workers=4,
        pin_memory=True
    )

    # Test on raw data
    print("\nTesting on raw data...")
    accuracy, predictions, targets, probabilities, misclassified = test_on_raw_data(
        model, test_loader, device, class_names
    )

    # Print results
    print(f"\n{'='*60}")
    print(f"TEST RESULTS ON RAW DATA")
    print(f"{'='*60}")
    print(f"Overall Accuracy: {accuracy*100:.2f}%")
    print(f"Total Images Tested: {len(targets)}")
    print(f"Correctly Classified: {int(accuracy * len(targets))}")
    print(f"Misclassified: {len(misclassified)}")

    # Classification report
    print("\nDetailed Classification Report:")
    report = classification_report(
        targets, predictions,
        target_names=class_names,
        digits=3
    )
    print(report)

    # Save classification report
    with open(results_dir / 'cassava_raw_classification_report.txt', 'w') as f:
        f.write(f"TEST RESULTS ON RAW DATA\n")
        f.write(f"{'='*60}\n")
        f.write(f"Overall Accuracy: {accuracy*100:.2f}%\n")
        f.write(f"Total Images Tested: {len(targets)}\n")
        f.write(f"Correctly Classified: {int(accuracy * len(targets))}\n")
        f.write(f"Misclassified: {len(misclassified)}\n\n")
        f.write("Detailed Classification Report:\n")
        f.write(report)

    # Generate visualizations
    print("\nGenerating visualizations...")
    plot_detailed_results(targets, predictions, class_names, results_dir)

    # Print some misclassified examples
    if misclassified:
        print(f"\nTop 10 Misclassified Images:")
        print("-" * 80)
        for i, miss in enumerate(misclassified[:10]):
            print(f"{i+1}. Image: {Path(miss['path']).name}")
            print(
                f"   True: {miss['true_label']} | Predicted: {miss['predicted_label']} (Confidence: {miss['confidence']:.2f})")

    # Calculate confidence statistics
    confidence_scores = [prob[pred]
                         for prob, pred in zip(probabilities, predictions)]
    avg_confidence = np.mean(confidence_scores)

    print(f"\n{'='*60}")
    print(f"CONFIDENCE STATISTICS")
    print(f"{'='*60}")
    print(f"Average Confidence: {avg_confidence:.3f}")
    print(f"Min Confidence: {min(confidence_scores):.3f}")
    print(f"Max Confidence: {max(confidence_scores):.3f}")

    # Confidence distribution for correct vs incorrect predictions
    correct_confidences = [conf for conf, pred, true in zip(
        confidence_scores, predictions, targets) if pred == true]
    incorrect_confidences = [conf for conf, pred, true in zip(
        confidence_scores, predictions, targets) if pred != true]

    if correct_confidences:
        print(
            f"\nCorrect Predictions - Avg Confidence: {np.mean(correct_confidences):.3f}")
    if incorrect_confidences:
        print(
            f"Incorrect Predictions - Avg Confidence: {np.mean(incorrect_confidences):.3f}")

    print(f"\nTest results saved to {results_dir}/")
    print("Done!")


if __name__ == "__main__":
    main()
