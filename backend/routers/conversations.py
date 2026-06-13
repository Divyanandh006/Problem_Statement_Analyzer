"""
Conversations Router — CRUD for PSAdvisor sessions
"""
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import Optional

from services.supabase_service import (
    get_user_from_token,
    create_conversation,
    get_conversations,
    get_conversation_with_messages,
    update_conversation,
    delete_conversation,
)

router = APIRouter(prefix="/api/conversations", tags=["conversations"])


def _require_auth(request: Request):
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = auth.removeprefix("Bearer ").strip()
    user = get_user_from_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user


# ── Request/Response Schemas ───────────────────────────────────────────────────

class CreateConversationRequest(BaseModel):
    title: Optional[str] = "New PS Session"
    model: Optional[str] = "gemini-2.5-flash"
    ps_raw_input: Optional[str] = None
    ps_input_type: Optional[str] = "text"
    filters: Optional[dict] = {}
    ps_count: Optional[int] = 0


class UpdateConversationRequest(BaseModel):
    title: Optional[str] = None
    filters: Optional[dict] = None
    model: Optional[str] = None
    top_pick: Optional[str] = None
    ranking_data: Optional[list] = None


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("")
async def list_conversations(request: Request):
    """List all sessions for the authenticated user."""
    user = _require_auth(request)
    convs = get_conversations(user.id)
    return {"conversations": convs}


@router.post("")
async def create_new_conversation(request: Request, body: CreateConversationRequest):
    """Create a new PSAdvisor session."""
    user = _require_auth(request)
    conv = create_conversation(user.id, body.model_dump())
    return conv


@router.get("/{conversation_id}")
async def get_conversation(request: Request, conversation_id: str):
    """Get a single conversation with full message history."""
    user = _require_auth(request)
    conv = get_conversation_with_messages(conversation_id, user.id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv


@router.patch("/{conversation_id}")
async def patch_conversation(
    request: Request, conversation_id: str, body: UpdateConversationRequest
):
    """Update conversation metadata (title, filters, model, top pick)."""
    user = _require_auth(request)
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = update_conversation(conversation_id, user.id, updates)
    if not result:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return result


@router.delete("/{conversation_id}")
async def delete_conv(request: Request, conversation_id: str):
    """Delete a conversation and all its messages."""
    user = _require_auth(request)
    delete_conversation(conversation_id, user.id)
    return {"success": True}
