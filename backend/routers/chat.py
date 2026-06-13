"""
Chat Router — SSE streaming endpoint for PSAdvisor AI responses
POST /api/chat/stream
"""
import json
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional

from services.supabase_service import (
    get_user_from_token,
    get_messages,
    save_message,
    update_conversation,
    get_conversation_with_messages,
)
from services.gemini_service import stream_chat_response
from config import DEFAULT_MODEL

router = APIRouter(prefix="/api/chat", tags=["chat"])


def _require_auth(request: Request):
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = auth.removeprefix("Bearer ").strip()
    user = get_user_from_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user


class ChatRequest(BaseModel):
    conversation_id: str
    message: str
    model: Optional[str] = DEFAULT_MODEL
    filters: Optional[dict] = None
    ps_context: Optional[str] = None  # Only sent on first message of session


@router.post("/stream")
async def chat_stream(request: Request, body: ChatRequest):
    """
    Stream a Gemini response as Server-Sent Events (SSE).

    Flow:
    1. Validate auth
    2. Save user message to DB
    3. Load conversation history
    4. Stream Gemini response
    5. After stream completes, save assistant message to DB
    """
    user = _require_auth(request)

    # Load conversation to get stored ps_raw_input and default filters
    conv = get_conversation_with_messages(body.conversation_id, user.id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    ps_context = body.ps_context or conv.get("ps_raw_input")
    filters = body.filters if body.filters is not None else conv.get("filters")

    # Persist the user's message first
    save_message(
        conversation_id=body.conversation_id,
        role="user",
        content=body.message,
        model=body.model or DEFAULT_MODEL,
        message_type="text",
    )

    # Load history (excluding the message we just saved — it's already appended)
    raw_history = get_messages(body.conversation_id)
    # Convert to simple dicts for gemini_service
    history = [
        {"role": m["role"], "content": m["content"]}
        for m in raw_history[:-1]  # exclude the user msg we just saved
    ]

    full_response_parts: list[str] = []

    async def event_stream():
        nonlocal full_response_parts
        async for chunk in stream_chat_response(
            message=body.message,
            model=body.model or DEFAULT_MODEL,
            ps_context=ps_context,
            filters=filters,
            history=history,
        ):
            if chunk.startswith("data: [DONE]"):
                # Save the complete AI response to DB
                complete_response = "".join(full_response_parts)
                if complete_response:
                    save_message(
                        conversation_id=body.conversation_id,
                        role="assistant",
                        content=complete_response,
                        model=body.model or DEFAULT_MODEL,
                        message_type="text",
                    )
                yield chunk
            elif chunk.startswith("data: "):
                try:
                    payload = json.loads(chunk[6:])
                    if "text" in payload:
                        full_response_parts.append(payload["text"])
                except Exception:
                    pass
                yield chunk

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable Nginx buffering for SSE
        },
    )
