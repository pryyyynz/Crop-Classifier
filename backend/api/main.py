from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
from dotenv import load_dotenv

from routes.classification import router as classification_router
from services.model_service import ModelService

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Crop Disease Classification API",
    description="AI-powered crop disease detection API for Cashew, Cassava, Maize, and Tomato",
    version="1.0.0"
)

# CORS middleware for web and mobile app access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize model service on startup
model_service = ModelService()


@app.on_event("startup")
async def startup_event():
    """Initialize models on startup"""
    await model_service.initialize_models()


@app.get("/")
async def root():
    return {
        "message": "Crop Disease Classification API",
        "version": "1.0.0",
        "supported_crops": ["cashew", "cassava", "maize", "tomato"],
        "endpoints": {
            "classification": "/classify",
            "health": "/health"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "models_loaded": model_service.models_loaded}

# Include classification routes
app.include_router(classification_router, prefix="/api",
                   tags=["classification"])

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=5003,
        reload=True
    )
