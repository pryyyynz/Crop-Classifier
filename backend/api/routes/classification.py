from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import JSONResponse
import logging
from typing import Optional
import asyncio

from services.classification_service import ClassificationService

logger = logging.getLogger(__name__)

router = APIRouter()

# Global services (will be initialized in main.py)
model_service = None
classification_service = None


def get_services():
    """Get model and classification services"""
    global model_service, classification_service
    from main import model_service as ms

    if ms is None:
        raise HTTPException(status_code=503, detail="Services not initialized")

    if classification_service is None:
        classification_service = ClassificationService(ms)

    return ms, classification_service


@router.post("/classify")
async def classify_image(
    image: UploadFile = File(...),
    crop_type: str = Form(...),
    notes: Optional[str] = Form(None)
):
    """
    Classify crop disease from uploaded image

    Parameters:
    - image: Image file (JPEG, PNG)
    - crop_type: Type of crop (cashew, cassava, maize, tomato)
    - notes: Optional notes about the image

    Returns:
    - Classification results with disease prediction and confidence
    """
    try:
        # Validate crop type
        supported_crops = ["cashew", "cassava", "maize", "tomato"]
        if crop_type.lower() not in supported_crops:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported crop type. Supported crops: {supported_crops}"
            )

        # Validate image file
        if not image.content_type.startswith('image/'):
            raise HTTPException(
                status_code=400,
                detail="File must be an image (JPEG, PNG, etc.)"
            )

        # Get services
        model_service, classification_service = get_services()

        # Check if models are loaded
        if not model_service.models_loaded:
            raise HTTPException(
                status_code=503,
                detail="Models are still loading. Please try again in a moment."
            )

        # Read image bytes
        image_bytes = await image.read()

        if len(image_bytes) == 0:
            raise HTTPException(status_code=400, detail="Empty image file")

        # Run prediction
        logger.info(f"Classifying {crop_type} image...")
        result = await classification_service.predict(image_bytes, crop_type.lower())

        # Add metadata
        result.update({
            "filename": image.filename,
            "file_size": len(image_bytes),
            "notes": notes,
            "status": "success"
        })

        logger.info(
            f"Classification completed: {result['predicted_disease']} ({result['confidence']}%)")

        return JSONResponse(content=result)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during classification: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/crops")
async def get_supported_crops():
    """Get list of supported crop types"""
    try:
        model_service, _ = get_services()

        crops_info = {}
        for crop_type in model_service.class_mappings.keys():
            crops_info[crop_type] = {
                "classes": model_service.class_mappings[crop_type],
                "model_loaded": model_service.is_model_loaded(crop_type)
            }

        return {
            "supported_crops": list(model_service.class_mappings.keys()),
            "crop_details": crops_info,
            "total_crops": len(model_service.class_mappings)
        }

    except Exception as e:
        logger.error(f"Error getting crop info: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/crops/{crop_type}")
async def get_crop_info(crop_type: str):
    """Get detailed information about a specific crop"""
    try:
        model_service, _ = get_services()

        if crop_type.lower() not in model_service.class_mappings:
            raise HTTPException(
                status_code=404,
                detail=f"Crop type '{crop_type}' not found"
            )

        crop_classes = model_service.class_mappings[crop_type.lower()]

        return {
            "crop_type": crop_type.lower(),
            "classes": crop_classes,
            "total_classes": len(crop_classes),
            "model_loaded": model_service.is_model_loaded(crop_type.lower()),
            "description": f"Disease classification model for {crop_type} crops"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting crop info for {crop_type}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/batch-classify")
async def batch_classify_images(
    images: list[UploadFile] = File(...),
    crop_types: list[str] = Form(...),
    notes: Optional[list[str]] = Form(None)
):
    """
    Classify multiple images in batch

    Parameters:
    - images: List of image files
    - crop_types: List of crop types (must match number of images)
    - notes: Optional list of notes for each image

    Returns:
    - List of classification results
    """
    try:
        # Validate inputs
        if len(images) != len(crop_types):
            raise HTTPException(
                status_code=400,
                detail="Number of images must match number of crop types"
            )

        if len(images) > 10:  # Limit batch size
            raise HTTPException(
                status_code=400,
                detail="Maximum 10 images per batch request"
            )

        # Get services
        model_service, classification_service = get_services()

        if not model_service.models_loaded:
            raise HTTPException(
                status_code=503,
                detail="Models are still loading. Please try again in a moment."
            )

        results = []

        for i, (image, crop_type) in enumerate(zip(images, crop_types)):
            try:
                # Validate crop type
                if crop_type.lower() not in model_service.class_mappings:
                    results.append({
                        "index": i,
                        "filename": image.filename,
                        "status": "error",
                        "error": f"Unsupported crop type: {crop_type}"
                    })
                    continue

                # Read and classify image
                image_bytes = await image.read()
                result = await classification_service.predict(image_bytes, crop_type.lower())

                # Add metadata
                result.update({
                    "index": i,
                    "filename": image.filename,
                    "file_size": len(image_bytes),
                    "notes": notes[i] if notes and i < len(notes) else None,
                    "status": "success"
                })

                results.append(result)

            except Exception as e:
                results.append({
                    "index": i,
                    "filename": image.filename,
                    "status": "error",
                    "error": str(e)
                })

        return {
            "total_images": len(images),
            "successful_classifications": len([r for r in results if r.get("status") == "success"]),
            "results": results
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during batch classification: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
