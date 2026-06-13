"""
PSAdvisor Configuration
Loads env variables and defines model/app constants.
"""
import os
from dotenv import load_dotenv

load_dotenv()

# ── Core Secrets ───────────────────────────────────────────────────────────────
GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")

# ── Available Gemini Models ────────────────────────────────────────────────────
AVAILABLE_MODELS: dict = {
    "gemini-2.5-flash-lite": {
        "display_name": "Gemini 2.5 Flash Lite",
        "description": "Fast and highly capable lite model (Recommended, Active Free Tier)",
        "context_window": 1048576,
    },
    "gemini-2.5-flash": {
        "display_name": "Gemini 2.5 Flash",
        "description": "Most capable Flash model (Daily limit of 20 free requests)",
        "context_window": 1048576,
    },
    "gemini-flash-lite-latest": {
        "display_name": "Gemini 1.5 Flash Lite",
        "description": "Legacy light model (Active Free Tier)",
        "context_window": 1048576,
    },
    "gemini-2.0-flash": {
        "display_name": "Gemini 2.0 Flash",
        "description": "Standard Gemini 2.0 (Currently 0 quota on Free Tier)",
        "context_window": 1048576,
    },
    "gemini-1.5-flash": {
        "display_name": "Gemini 1.5 Flash",
        "description": "Standard 1.5 Flash (May hit API version/method limits)",
        "context_window": 1048576,
    },
}

DEFAULT_MODEL: str = "gemini-2.5-flash-lite"

# ── App Constants ──────────────────────────────────────────────────────────────
MAX_FILE_SIZE_BYTES: int = 10 * 1024 * 1024  # 10 MB
ALLOWED_MIME_TYPES: list[str] = [
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/webp",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]
