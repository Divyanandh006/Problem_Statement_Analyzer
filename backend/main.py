"""
PSAdvisor — FastAPI Application Entry Point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import FRONTEND_URL
from routers import auth, chat, conversations, upload, models

# ── App ────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="PSAdvisor API",
    description="AI-powered hackathon problem statement advisor backend",
    version="1.0.0",
)

# ── CORS ───────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        FRONTEND_URL,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ────────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(conversations.router)
app.include_router(upload.router)
app.include_router(models.router)


# ── Health check (public) ──────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok", "service": "PSAdvisor API"}


@app.get("/")
async def root():
    return {"message": "PSAdvisor API is running. See /docs for Swagger UI."}
