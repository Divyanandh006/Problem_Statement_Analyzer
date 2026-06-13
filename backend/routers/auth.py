"""
Auth Router — validate current Supabase session
"""
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import Optional
from services.supabase_service import get_user_from_token, get_profile, update_profile

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _extract_token(request: Request) -> str:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    return auth.removeprefix("Bearer ").strip()


@router.get("/session")
async def get_session(request: Request):
    """Validate the current JWT and return user info + profile."""
    token = _extract_token(request)
    user = get_user_from_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    profile = get_profile(user.id)
    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.user_metadata.get("full_name", ""),
            "avatar_url": user.user_metadata.get("avatar_url", ""),
        },
        "profile": profile or {},
    }


class ProfileUpdate(BaseModel):
    theme: Optional[str] = None
    default_model: Optional[str] = None
    default_filters: Optional[dict] = None


@router.patch("/profile")
async def patch_profile(request: Request, body: ProfileUpdate):
    """Update the authenticated user's profile preferences."""
    token = _extract_token(request)
    user = get_user_from_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = update_profile(user.id, updates)
    return result
