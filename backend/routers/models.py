"""
Models Router — list available Gemini models
"""
from fastapi import APIRouter
from config import AVAILABLE_MODELS

router = APIRouter(prefix="/api/models", tags=["models"])


@router.get("")
async def list_models():
    """Return the list of available Gemini models with metadata."""
    return {
        "models": [
            {"id": k, **v}
            for k, v in AVAILABLE_MODELS.items()
        ]
    }
