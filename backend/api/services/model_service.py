import boto3
import torch
import torch.nn as nn
import torchvision.transforms as transforms
import timm
import os
import logging
from typing import Dict, Optional
from pathlib import Path
import tempfile
import json

logger = logging.getLogger(__name__)


class EfficientNetClassifier(nn.Module):
    """Wrapper class to match the training architecture exactly"""

    def __init__(self, num_classes=5, model_name='efficientnet_b1'):
        super(EfficientNetClassifier, self).__init__()
        # Load pretrained EfficientNet-B1
        self.backbone = timm.create_model(model_name, pretrained=False)

        # Replace classifier with the same architecture used in training
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


class ModelService:
    def __init__(self):
        self.models: Dict[str, torch.nn.Module] = {}
        self.transforms: Dict[str, transforms.Compose] = {}
        self.class_names: Dict[str, list] = {}
        self.models_loaded = False
        self.s3_client = boto3.client(
            's3',
            region_name=os.getenv('AWS_DEFAULT_REGION'),
        )
        self.bucket_name = "ghana-ai-hackathon"
        self.model_prefix = "models/"

        # Define hardcoded class mappings - these match exactly what's in tree.json
        # This ensures we don't rely on tree.json at runtime for the API service
        self.class_mappings = {
            "cashew": [
                "anthracnose", "gumosis", "healthy", "leaf_miner", "red_rust"
            ],
            "cassava": [
                "bacterial_blight", "brown_spot", "green_mite", "healthy", "mosaic"
            ],
            "maize": [
                "fall_armyworm", "grasshoper", "healthy", "leaf_beetle",
                "leaf_blight", "leaf_spot", "streak_virus"
            ],
            "tomato": [
                "healthy", "leaf_blight", "leaf_curl", "septoria_leaf_spot", "verticulium_wilt"
            ]
        }

        logger.info(f"Using hardcoded class mappings: {self.class_mappings}")

        # Define image transforms for each crop - exactly matching training transforms
        self.image_transforms = {
            "cashew": transforms.Compose([
                transforms.Resize((240, 240)),  # EfficientNet-B1 input size
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[
                                     0.229, 0.224, 0.225])
            ]),
            "cassava": transforms.Compose([
                transforms.Resize((240, 240)),
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[
                                     0.229, 0.224, 0.225])
            ]),
            "maize": transforms.Compose([
                transforms.Resize((240, 240)),
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[
                                     0.229, 0.224, 0.225])
            ]),
            "tomato": transforms.Compose([
                transforms.Resize((240, 240)),
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[
                                     0.229, 0.224, 0.225])
            ])
        }

    async def download_model_from_s3(self, model_name: str) -> str:
        """Download model from S3 and return local path"""
        try:
            # Create temporary directory for models
            temp_dir = tempfile.mkdtemp()
            local_path = os.path.join(temp_dir, f"{model_name}.pth")
            s3_key = f"{self.model_prefix}best_{model_name}_model.pth"

            logger.info(f"Downloading {s3_key} from S3...")
            self.s3_client.download_file(self.bucket_name, s3_key, local_path)
            logger.info(f"Downloaded {model_name} model to {local_path}")

            return local_path
        except Exception as e:
            logger.error(f"Error downloading {model_name} model: {str(e)}")
            raise

    def create_model_architecture(self, crop_type: str, num_classes: int) -> torch.nn.Module:
        """Create model architecture based on crop type"""
        try:
            # Use the same EfficientNetClassifier wrapper as in training
            model = EfficientNetClassifier(
                num_classes=num_classes, model_name='efficientnet_b1')

            logger.info(
                f"Created EfficientNetClassifier for {crop_type} with {num_classes} classes")
            return model

        except Exception as e:
            logger.error(
                f"Error creating model architecture for {crop_type}: {str(e)}")
            raise

    async def load_model(self, crop_type: str) -> torch.nn.Module:
        """Load a specific crop model"""
        try:
            # Download model from S3
            model_path = await self.download_model_from_s3(crop_type)

            # Get number of classes for this crop
            num_classes = len(self.class_mappings[crop_type])

            # Create model architecture
            model = self.create_model_architecture(crop_type, num_classes)

            # Load model weights
            checkpoint = torch.load(model_path, map_location='cpu')

            # Handle different checkpoint formats
            if 'model_state_dict' in checkpoint:
                model.load_state_dict(checkpoint['model_state_dict'])
            elif 'state_dict' in checkpoint:
                model.load_state_dict(checkpoint['state_dict'])
            else:
                model.load_state_dict(checkpoint)

            model.eval()
            logger.info(f"Loaded {crop_type} model successfully")

            # Clean up temporary file
            os.remove(model_path)

            return model

        except Exception as e:
            logger.error(f"Error loading {crop_type} model: {str(e)}")
            raise

    async def initialize_models(self):
        """Initialize all crop models"""
        try:
            logger.info("Initializing models...")

            # Load all crop models
            for crop_type in self.class_mappings.keys():
                logger.info(f"Loading {crop_type} model...")
                self.models[crop_type] = await self.load_model(crop_type)
                self.transforms[crop_type] = self.image_transforms[crop_type]
                self.class_names[crop_type] = self.class_mappings[crop_type]

            self.models_loaded = True
            logger.info("All models loaded successfully!")

        except Exception as e:
            logger.error(f"Error initializing models: {str(e)}")
            self.models_loaded = False
            raise

    def get_model(self, crop_type: str) -> Optional[torch.nn.Module]:
        """Get model for specific crop"""
        return self.models.get(crop_type.lower())

    def get_transform(self, crop_type: str) -> Optional[transforms.Compose]:
        """Get image transform for specific crop"""
        return self.transforms.get(crop_type.lower())

    def get_class_names(self, crop_type: str) -> Optional[list]:
        """Get class names for specific crop"""
        return self.class_names.get(crop_type.lower())

    def is_model_loaded(self, crop_type: str) -> bool:
        """Check if model is loaded for specific crop"""
        return crop_type.lower() in self.models
