import os
import json
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Dataset
from torchvision import transforms
from PIL import Image
import timm
import wandb
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import numpy as np
from pathlib import Path
import onnx
import torch.onnx
from torch.cuda.amp import GradScaler, autocast
import matplotlib.pyplot as plt
import seaborn as sns


class TomatoDataset(Dataset):
    def __init__(self, data_dir, split='train_set', transform=None):
        self.data_dir = Path(data_dir)
        self.transform = transform

        # Load tree.json to get class names
        with open(self.data_dir / 'tree.json', 'r') as f:
            tree_data = json.load(f)

        self.classes = tree_data['Combined']['Augmented']['Tomato'][split]
        self.class_to_idx = {cls: idx for idx, cls in enumerate(self.classes)}

        # Build file paths
        self.samples = []
        augmented_path = self.data_dir / 'Combined' / 'Augmented' / 'Tomato' / split

        for class_name in self.classes:
            class_dir = augmented_path / class_name
            if class_dir.exists():
                for img_path in class_dir.glob('*'):
                    if img_path.suffix.lower() in ['.jpg', '.jpeg', '.png']:
                        self.samples.append(
                            (str(img_path), self.class_to_idx[class_name]))

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        img_path, label = self.samples[idx]
        image = Image.open(img_path).convert('RGB')

        if self.transform:
            image = self.transform(image)

        return image, label


class EfficientNetClassifier(nn.Module):
    def __init__(self, num_classes=5, model_name='efficientnet_b1'):
        super(EfficientNetClassifier, self).__init__()
        # Load pretrained EfficientNet-B1
        self.backbone = timm.create_model(model_name, pretrained=True)

        # Freeze backbone except for the last few blocks
        for name, param in self.backbone.named_parameters():
            if 'blocks.6' not in name and 'blocks.5' not in name and 'classifier' not in name:
                param.requires_grad = False

        # Replace classifier
        in_features = self.backbone.classifier.in_features
        self.backbone.classifier = nn.Sequential(
            nn.Dropout(0.3),
            nn.Linear(in_features, 512),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(512, num_classes)
        )

    def forward(self, x):
        return self.backbone(x)


def get_transforms():
    # EfficientNet-B1 input size is 240x240
    train_transform = transforms.Compose([
        transforms.Resize((240, 240)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[
                             0.229, 0.224, 0.225])
    ])

    val_transform = transforms.Compose([
        transforms.Resize((240, 240)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[
                             0.229, 0.224, 0.225])
    ])

    return train_transform, val_transform


def train_epoch(model, dataloader, criterion, optimizer, scaler, device):
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0

    for batch_idx, (data, target) in enumerate(dataloader):
        data, target = data.to(device), target.to(device)

        optimizer.zero_grad()

        # Mixed precision training
        with autocast():
            output = model(data)
            loss = criterion(output, target)

        scaler.scale(loss).backward()
        scaler.step(optimizer)
        scaler.update()

        running_loss += loss.item()
        _, predicted = torch.max(output.data, 1)
        total += target.size(0)
        correct += (predicted == target).sum().item()

        if batch_idx % 100 == 0:
            print(
                f'Batch {batch_idx}/{len(dataloader)}, Loss: {loss.item():.4f}')

    epoch_loss = running_loss / len(dataloader)
    epoch_acc = 100. * correct / total

    return epoch_loss, epoch_acc


def validate_epoch(model, dataloader, criterion, device):
    model.eval()
    running_loss = 0.0
    correct = 0
    total = 0
    all_predictions = []
    all_targets = []

    with torch.no_grad():
        for data, target in dataloader:
            data, target = data.to(device), target.to(device)

            with autocast():
                output = model(data)
                loss = criterion(output, target)

            running_loss += loss.item()
            _, predicted = torch.max(output.data, 1)
            total += target.size(0)
            correct += (predicted == target).sum().item()

            all_predictions.extend(predicted.cpu().numpy())
            all_targets.extend(target.cpu().numpy())

    epoch_loss = running_loss / len(dataloader)
    epoch_acc = 100. * correct / total

    return epoch_loss, epoch_acc, all_predictions, all_targets


def save_model_as_onnx(model, save_path, device):
    """Save the trained model as ONNX format"""
    model.eval()
    dummy_input = torch.randn(1, 3, 240, 240).to(device)

    torch.onnx.export(
        model,
        dummy_input,
        save_path,
        export_params=True,
        opset_version=11,
        do_constant_folding=True,
        input_names=['input'],
        output_names=['output'],
        dynamic_axes={
            'input': {0: 'batch_size'},
            'output': {0: 'batch_size'}
        }
    )
    print(f"Model saved as ONNX: {save_path}")


def plot_confusion_matrix(y_true, y_pred, class_names, save_path):
    """Plot and save confusion matrix"""
    cm = confusion_matrix(y_true, y_pred)
    plt.figure(figsize=(10, 8))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
                xticklabels=class_names, yticklabels=class_names)
    plt.title('Confusion Matrix - Tomato Disease Classification')
    plt.ylabel('True Label')
    plt.xlabel('Predicted Label')
    plt.tight_layout()
    plt.savefig(save_path)
    plt.close()


def main():
    # Configuration
    config = {
        'model_name': 'efficientnet_b1',
        'num_classes': 5,
        'batch_size': 48,
        'num_epochs': 50,
        'learning_rate': 1e-4,
        'weight_decay': 1e-5,
        'patience': 10,
        'crop_name': 'tomato'
    }

    # Initialize Weights & Biases
    wandb.init(
        project="crop-classifier",
        name=f"{config['crop_name']}_efficientnet_b1",
        config=config
    )

    # Set device
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Using device: {device}")

    # Data paths
    data_dir = Path('data')
    models_dir = Path('models')
    models_dir.mkdir(exist_ok=True)

    # Load class names from tree.json
    with open(data_dir / 'tree.json', 'r') as f:
        tree_data = json.load(f)
    class_names = tree_data['Combined']['Augmented']['Tomato']['train_set']
    print(f"Classes: {class_names}")

    # Transforms
    train_transform, val_transform = get_transforms()

    # Datasets
    train_dataset = TomatoDataset(
        data_dir, split='train_set', transform=train_transform)
    val_dataset = TomatoDataset(
        data_dir, split='test_set', transform=val_transform)

    print(f"Train dataset size: {len(train_dataset)}")
    print(f"Validation dataset size: {len(val_dataset)}")

    # Data loaders
    train_loader = DataLoader(
        train_dataset,
        batch_size=config['batch_size'],
        shuffle=True,
        num_workers=4,
        pin_memory=True
    )
    val_loader = DataLoader(
        val_dataset,
        batch_size=config['batch_size'],
        shuffle=False,
        num_workers=4,
        pin_memory=True
    )

    # Model
    model = EfficientNetClassifier(
        num_classes=config['num_classes'],
        model_name=config['model_name']
    ).to(device)

    # Loss and optimizer
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.AdamW(
        model.parameters(),
        lr=config['learning_rate'],
        weight_decay=config['weight_decay']
    )

    # Learning rate scheduler
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(
        optimizer, mode='min', factor=0.5, patience=5
    )

    # Mixed precision scaler
    scaler = GradScaler()

    # Training loop
    best_val_acc = 0.0
    patience_counter = 0

    for epoch in range(config['num_epochs']):
        print(f"\nEpoch {epoch+1}/{config['num_epochs']}")
        print("-" * 50)

        # Training
        train_loss, train_acc = train_epoch(
            model, train_loader, criterion, optimizer, scaler, device)

        # Validation
        val_loss, val_acc, val_predictions, val_targets = validate_epoch(
            model, val_loader, criterion, device)

        # Scheduler step
        scheduler.step(val_loss)

        # Log to wandb
        wandb.log({
            'epoch': epoch + 1,
            'train_loss': train_loss,
            'train_accuracy': train_acc,
            'val_loss': val_loss,
            'val_accuracy': val_acc,
            'learning_rate': optimizer.param_groups[0]['lr']
        })

        print(f"Train Loss: {train_loss:.4f}, Train Acc: {train_acc:.2f}%")
        print(f"Val Loss: {val_loss:.4f}, Val Acc: {val_acc:.2f}%")

        # Save best model
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            patience_counter = 0

            # Save PyTorch model
            torch.save(model.state_dict(), models_dir /
                       f'best_{config["crop_name"]}_model.pth')

            # Save as ONNX
            save_model_as_onnx(model, models_dir /
                               f'best_{config["crop_name"]}_model.onnx', device)

            # Generate classification report
            report = classification_report(
                val_targets, val_predictions, target_names=class_names)
            print(f"\nBest validation accuracy: {best_val_acc:.2f}%")
            print("Classification Report:")
            print(report)

            # Save confusion matrix
            plot_confusion_matrix(
                val_targets, val_predictions, class_names,
                models_dir / f'{config["crop_name"]}_confusion_matrix.png'
            )

        else:
            patience_counter += 1

        # Early stopping
        if patience_counter >= config['patience']:
            print(
                f"Early stopping triggered after {config['patience']} epochs without improvement")
            break

    print(
        f"\nTraining completed! Best validation accuracy: {best_val_acc:.2f}%")
    wandb.finish()


if __name__ == "__main__":
    main()
