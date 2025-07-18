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
llm_service = None


def get_services():
    """Get model, classification, and LLM services"""
    global model_service, classification_service, llm_service
    from main import model_service as ms, llm_service as ls

    if ms is None:
        raise HTTPException(status_code=503, detail="Services not initialized")

    if classification_service is None:
        classification_service = ClassificationService(ms)

    # LLM service is optional
    llm_service = ls

    return ms, classification_service, llm_service


@router.post("/classify")
async def classify_image(
    image: UploadFile = File(...),
    crop_type: str = Form(...),
    notes: Optional[str] = Form(None),
    user_question: Optional[str] = Form(None),
    enable_ai_advice: bool = Form(True)
):
    """
    Classify crop disease from uploaded image with optional AI-powered advice

    Parameters:
    - image: Image file (JPEG, PNG)
    - crop_type: Type of crop (cashew, cassava, maize, tomato)
    - notes: Optional notes about the image/plant condition
    - user_question: Optional specific question about the disease/plant
    - enable_ai_advice: Whether to generate AI-powered advice (default: True)

    Returns:
    - Classification results with disease prediction, confidence, and optional AI advice
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
        model_service, classification_service, llm_service = get_services()

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
            "user_question": user_question,
            "status": "success"
        })

        # Generate AI advice if enabled and service is available
        if enable_ai_advice and llm_service and llm_service.is_available():
            try:
                logger.info("Generating AI-powered disease advice...")
                ai_advice = await llm_service.generate_disease_advice(
                    crop_type=crop_type.lower(),
                    predicted_disease=result["predicted_disease"],
                    confidence=result["confidence"],
                    is_healthy=result["is_healthy"],
                    base_description=result["description"],
                    user_question=user_question,
                    user_notes=notes
                )
                result["ai_advice"] = ai_advice
                logger.info("AI advice generated successfully")
            except Exception as e:
                logger.error(f"Failed to generate AI advice: {str(e)}")
                # Don't fail the entire request if AI advice fails
                result["ai_advice"] = None
                result["ai_advice_error"] = "AI advice temporarily unavailable"
        else:
            result["ai_advice"] = None
            if not enable_ai_advice:
                logger.info("AI advice disabled by user")
            elif not llm_service or not llm_service.is_available():
                logger.info("AI advice service not available")

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
        model_service, _, _ = get_services()

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
        model_service, _, _ = get_services()

        if crop_type.lower() not in model_service.class_mappings:
            raise HTTPException(
                status_code=404,
                detail=f"Crop type '{crop_type}' not found. Supported crops: {list(model_service.class_mappings.keys())}"
            )

        return {
            "crop_type": crop_type.lower(),
            "classes": model_service.class_mappings[crop_type.lower()],
            "model_loaded": model_service.is_model_loaded(crop_type.lower()),
            "total_classes": len(model_service.class_mappings[crop_type.lower()])
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting crop info for {crop_type}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

