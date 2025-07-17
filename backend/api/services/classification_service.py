import torch
import torch.nn.functional as F
from PIL import Image
import io
import numpy as np
from typing import Dict, Tuple, Optional
import logging

logger = logging.getLogger(__name__)


class ClassificationService:
    def __init__(self, model_service):
        self.model_service = model_service

    async def preprocess_image(self, image_bytes: bytes, crop_type: str) -> torch.Tensor:
        """Preprocess image for model inference"""
        try:
            # Open image from bytes
            image = Image.open(io.BytesIO(image_bytes))

            # Convert to RGB if necessary - ensures consistency with training
            if image.mode != 'RGB':
                image = image.convert('RGB')

            # Get transform for this crop type
            transform = self.model_service.get_transform(crop_type)
            if transform is None:
                raise ValueError(
                    f"No transform found for crop type: {crop_type}")

            # Apply transforms - identical to training transforms
            image_tensor = transform(image)

            # Add batch dimension
            image_tensor = image_tensor.unsqueeze(0)

            return image_tensor

        except Exception as e:
            logger.error(f"Error preprocessing image: {str(e)}")
            raise

    async def predict(self, image_bytes: bytes, crop_type: str) -> Dict:
        """Predict disease for given image and crop type"""
        try:
            # Validate crop type
            if not self.model_service.is_model_loaded(crop_type):
                raise ValueError(
                    f"Model not loaded for crop type: {crop_type}")

            # Preprocess image
            image_tensor = await self.preprocess_image(image_bytes, crop_type)

            # Get model and class names
            model = self.model_service.get_model(crop_type)
            class_names = self.model_service.get_class_names(crop_type)

            # Run inference
            with torch.no_grad():
                outputs = model(image_tensor)
                probabilities = F.softmax(outputs, dim=1)
                confidence, predicted_idx = torch.max(probabilities, 1)

                predicted_class = class_names[predicted_idx.item()]
                confidence_score = confidence.item()

                # Get top 3 predictions
                top_probs, top_indices = torch.topk(
                    probabilities[0], k=min(3, len(class_names)))
                top_predictions = [
                    {
                        "disease": class_names[idx.item()],
                        "confidence": prob.item()
                    }
                    for prob, idx in zip(top_probs, top_indices)
                ]

                # Determine if plant is healthy
                is_healthy = predicted_class.lower(
                ) in ['healthy', 'cassava healthy']

                # Get disease description
                description = self.get_disease_description(
                    predicted_class, crop_type)

                return {
                    "crop_type": crop_type,
                    "predicted_disease": predicted_class,
                    "confidence": round(confidence_score * 100, 2),
                    "is_healthy": is_healthy,
                    "description": description,
                    "top_predictions": [
                        {
                            "disease": pred["disease"],
                            "confidence": round(pred["confidence"] * 100, 2)
                        }
                        for pred in top_predictions
                    ]
                }

        except Exception as e:
            logger.error(f"Error during prediction: {str(e)}")
            raise

    def get_disease_description(self, disease_name: str, crop_type: str) -> str:
        """Get description for predicted disease"""
        # Disease names are lowercase with underscores in the training data
        normalized_disease = disease_name.lower()

        descriptions = {
            # Cashew diseases
            "anthracnose": "Anthracnose is a fungal disease that causes dark, sunken lesions on leaves and fruits. It thrives in warm, humid conditions. Management includes pruning affected parts, improving air circulation, and applying copper-based fungicides.",

            "gumosis": "Gummosis causes gum exudation from bark and branches, often leading to dieback. It's typically caused by fungal pathogens or stress. Management involves removing affected branches, improving drainage, and avoiding bark injuries.",

            "leaf_miner": "Leaf miners create serpentine tunnels in leaves, reducing photosynthesis. Control includes removing affected leaves, using beneficial insects, and applying appropriate insecticides when necessary.",

            "red_rust": "Red rust appears as reddish-brown pustules on leaves. It's a fungal disease that can cause defoliation. Management includes improving air circulation, avoiding overhead watering, and applying fungicides if severe.",

            # Cassava diseases
            "bacterial_blight": "Bacterial blight causes angular leaf spots, wilting, and dieback. It spreads through contaminated tools and rain splash. Management includes using clean planting material, crop rotation, and copper-based sprays.",

            "brown_spot": "Brown spot disease creates characteristic brown spots on cassava leaves, reducing photosynthesis. Management includes practicing crop rotation, ensuring proper plant spacing, and applying suitable fungicides.",

            "green_mite": "Green mites cause stippling and chlorotic spots on leaves. They can significantly reduce yield. Control measures include biological control with predatory mites and judicious use of miticides.",

            "mosaic": "Cassava mosaic disease causes characteristic mosaic patterns on leaves. It significantly reduces yield. Management includes using resistant varieties and controlling whitefly vectors.",

            # Maize diseases
            "fall_armyworm": "Fall armyworm is a destructive pest that feeds on maize leaves and stems. Control methods include early detection, biological controls, and targeted insecticide applications.",

            "grasshoper": "Grasshoppers can cause significant damage by feeding on maize leaves. Control involves early detection, field sanitation, and targeted pesticide applications when populations are high.",

            "leaf_beetle": "Leaf beetles chew holes in maize leaves, reducing photosynthesis. Control includes monitoring, crop rotation, and insecticide applications when infestation is severe.",

            "leaf_blight": "Leaf blight causes large, irregular lesions on leaves, potentially leading to significant yield loss. Management includes crop rotation, resistant varieties, and fungicide applications when necessary.",

            "leaf_spot": "Leaf spot diseases create circular or irregular spots on maize leaves. Management includes crop rotation, adequate plant spacing, and fungicide applications if severe.",

            "streak_virus": "Maize streak virus causes characteristic light streaks on leaves. It's transmitted by leafhoppers. Control includes using resistant varieties and managing vector populations.",

            # Tomato diseases
            "leaf_curl": "Leaf curl virus causes leaves to curl upward and become distorted. It's transmitted by whiteflies. Management focuses on whitefly control and using resistant varieties.",

            "septoria_leaf_spot": "Septoria leaf spot causes small, circular spots with dark borders. Management includes crop rotation, proper spacing, and fungicide applications when necessary.",

            "verticulium_wilt": "Verticillium wilt causes wilting and yellowing of leaves, starting from lower leaves. It's a soil-borne disease. Management includes crop rotation and using resistant varieties.",

            # Healthy plants
            "healthy": "Your plant appears healthy! Continue with regular care including proper watering, fertilization, and monitoring for any changes in plant health."
        }

        # First try with normalized_disease
        description = descriptions.get(normalized_disease)

        # If not found, provide generic message
        if description is None:
            description = f"No specific information available for {disease_name}. Consult with a local agricultural extension officer for detailed management advice."

        return description
