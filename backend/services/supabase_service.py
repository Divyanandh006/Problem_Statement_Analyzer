"""
Supabase Service — Database helpers for PSAdvisor
Uses supabase-py 2.x with the service role key for server-side operations.
"""
from supabase import create_client, Client
from config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

# ── Client (service role — bypass RLS on backend) ─────────────────────────────
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


class MockUser:
    def __init__(self, user_id: str, email: str, name: str, avatar_url: str):
        self.id = user_id
        self.email = email
        self.user_metadata = {
            "full_name": name,
            "avatar_url": avatar_url
        }

# ── Auth ───────────────────────────────────────────────────────────────────────
def get_user_from_token(jwt_token: str):
    """
    Validate a Supabase JWT token and return the user object.
    Returns None if token is invalid.
    """
    if jwt_token == "developer-token":
        return MockUser(
            user_id="d0000000-0000-0000-0000-000000000000",
            email="developer@psadvisor.local",
            name="Dev Guest",
            avatar_url="https://api.dicebear.com/7.x/identicon/svg?seed=developer"
        )
    try:
        response = supabase.auth.get_user(jwt_token)
        return response.user
    except Exception:
        return None


# ── Conversations ──────────────────────────────────────────────────────────────
def create_conversation(user_id: str, data: dict) -> dict:
    result = supabase.table("conversations").insert({
        "user_id": user_id,
        "title": data.get("title", "New PS Session"),
        "model": data.get("model", "gemini-2.5-flash"),
        "session_type": "ps_advisor",
        "ps_raw_input": data.get("ps_raw_input"),
        "ps_input_type": data.get("ps_input_type", "text"),
        "filters": data.get("filters", {}),
        "ps_count": data.get("ps_count", 0),
    }).execute()
    return result.data[0] if result.data else {}


def get_conversations(user_id: str) -> list[dict]:
    result = (
        supabase.table("conversations")
        .select("id, title, model, ps_count, top_pick, filters, created_at, updated_at, ps_input_type")
        .eq("user_id", user_id)
        .order("updated_at", desc=True)
        .execute()
    )
    return result.data or []


def get_conversation_with_messages(conversation_id: str, user_id: str) -> dict | None:
    # Fetch conversation
    conv_result = (
        supabase.table("conversations")
        .select("*")
        .eq("id", conversation_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not conv_result.data:
        return None
    conv = conv_result.data[0]

    # Fetch messages
    msgs = (
        supabase.table("messages")
        .select("*")
        .eq("conversation_id", conversation_id)
        .order("created_at", desc=False)
        .execute()
    )
    return {**conv, "messages": msgs.data or []}


def update_conversation(conversation_id: str, user_id: str, data: dict) -> dict:
    result = (
        supabase.table("conversations")
        .update(data)
        .eq("id", conversation_id)
        .eq("user_id", user_id)
        .execute()
    )
    return result.data[0] if result.data else {}


def delete_conversation(conversation_id: str, user_id: str) -> bool:
    supabase.table("conversations").delete().eq("id", conversation_id).eq("user_id", user_id).execute()
    return True


# ── Messages ───────────────────────────────────────────────────────────────────
def save_message(conversation_id: str, role: str, content: str,
                 model: str = "", message_type: str = "text") -> dict:
    result = supabase.table("messages").insert({
        "conversation_id": conversation_id,
        "role": role,
        "content": content,
        "model": model,
        "message_type": message_type,
    }).execute()
    # Bump updated_at on conversation
    try:
        from datetime import datetime, timezone
        supabase.table("conversations").update(
            {"updated_at": datetime.now(timezone.utc).isoformat()}
        ).eq("id", conversation_id).execute()
    except Exception:
        pass
    return result.data[0] if result.data else {}


def get_messages(conversation_id: str) -> list[dict]:
    result = (
        supabase.table("messages")
        .select("*")
        .eq("conversation_id", conversation_id)
        .order("created_at", desc=False)
        .execute()
    )
    return result.data or []


# ── Profiles ───────────────────────────────────────────────────────────────────
def get_profile(user_id: str) -> dict | None:
    try:
        result = (
            supabase.table("profiles")
            .select("*")
            .eq("id", user_id)
            .execute()
        )
        if result.data:
            return result.data[0]
        
        # If developer user and profile doesn't exist, create it
        if user_id == "d0000000-0000-0000-0000-000000000000":
            insert_result = supabase.table("profiles").insert({
                "id": user_id,
                "display_name": "Dev Guest",
                "avatar_url": "https://api.dicebear.com/7.x/identicon/svg?seed=developer",
                "theme": "dark",
                "default_model": "gemini-2.5-flash"
            }).execute()
            return insert_result.data[0] if insert_result.data else None
    except Exception as e:
        print("Failed to get/create profile:", e)
    return None


def update_profile(user_id: str, data: dict) -> dict:
    result = supabase.table("profiles").upsert({"id": user_id, **data}).execute()
    return result.data[0] if result.data else {}
