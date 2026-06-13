# PSAdvisor — AI-Powered Hackathon Problem Statement Advisor

> **"Pick smarter. Build better."**

PSAdvisor is a full-stack AI web application that helps hackathon students analyze, rank, and confidently choose a problem statement from a given set.

---

## Quick Start

### 1. Database Setup (Supabase)

1. Open your [Supabase project](https://supabase.com/dashboard)
2. Go to **SQL Editor**
3. Run the contents of [`supabase_migration.sql`](./supabase_migration.sql)
4. Go to **Storage → Buckets** → Create bucket named `ps-uploads` (Private)
5. Go to **Authentication → Providers → Google** and enable Google OAuth

### 2. Backend Setup

```bash
cd backend
pip install -r requirements.txt
# .env is already populated
uvicorn main:app --reload --port 8000
```

The API will be running at http://localhost:8000
Swagger docs: http://localhost:8000/docs

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app will be running at http://localhost:5173

---

## Project Structure

```
PSAdvisor/
├── backend/                 # FastAPI Python backend
│   ├── main.py             # App entry point + CORS
│   ├── config.py           # Env vars + model config
│   ├── prompts.py          # PSAdvisor system prompt builder
│   ├── requirements.txt
│   ├── .env                # ← Your secrets (do not commit)
│   ├── routers/
│   │   ├── auth.py         # GET /api/auth/session, PATCH /api/auth/profile
│   │   ├── chat.py         # POST /api/chat/stream (SSE)
│   │   ├── conversations.py # CRUD /api/conversations
│   │   ├── upload.py       # POST /api/upload
│   │   └── models.py       # GET /api/models
│   └── services/
│       ├── gemini_service.py    # google-genai SDK, streaming, search grounding
│       ├── supabase_service.py  # DB helpers
│       └── file_parser.py       # PDF, DOCX, image extraction
│
├── frontend/                # React + Vite + TailwindCSS
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx  # Animated orbital background hero
│   │   │   ├── AuthCallback.jsx # OAuth redirect handler
│   │   │   ├── Dashboard.jsx    # Session history
│   │   │   ├── NewSession.jsx   # PS intake (text/file/image)
│   │   │   ├── Session.jsx      # Chat workspace
│   │   │   └── Settings.jsx     # User preferences
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.jsx      # Collapsible session list
│   │   │   │   └── FilterPanel.jsx  # Slide-in filter panel
│   │   │   ├── chat/
│   │   │   │   ├── MessageList.jsx  # Chat bubbles + streaming
│   │   │   │   ├── ChatInput.jsx    # Auto-resize input bar
│   │   │   │   ├── RankingCard.jsx  # Styled PS ranking table
│   │   │   │   └── AnalysisCard.jsx # Collapsible deep analysis
│   │   │   └── ui/
│   │   │       ├── Spinner.jsx
│   │   │       └── Toast.jsx
│   │   ├── contexts/AuthContext.jsx  # Google OAuth + session
│   │   └── lib/
│   │       ├── supabase.js      # Supabase client
│   │       └── timeUtils.js     # "2 days ago" formatter
│   ├── .env                 # ← Your frontend secrets
│   └── index.css            # Full design system (dark/light themes)
│
└── supabase_migration.sql   # Run this first in Supabase SQL Editor
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TailwindCSS + Framer Motion |
| Backend | FastAPI (Python 3.11+) + Uvicorn |
| AI SDK | `google-genai` (current SDK, not deprecated `google-generativeai`) |
| Auth | Supabase Auth (Google OAuth) |
| Database | Supabase (PostgreSQL) |
| File Parsing | PyMuPDF + python-docx + Gemini Vision |
| Hosting | Render (backend) + Vercel (frontend) |

---

## Key Features

- **Multi-modal PS input**: paste text, upload PDF/DOCX, or photo of a PS sheet
- **Mode 1 — Ranking**: scored table across Feasibility, Impact, Innovation, Team Fit, Clarity
- **Mode 2 — Deep Analysis**: 7-section structured analysis with competitor research (search grounding)
- **Streaming responses**: token-by-token via SSE
- **Filter panel**: personalize rankings by team size, skills, domain, timeline
- **Session persistence**: all conversations saved and resumable
- **Model selector**: Gemini 1.5/2.0/2.5 Flash

---

## Deployment

### Backend → Render
1. Connect GitHub repo to Render
2. Root directory: `backend`
3. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add all env vars from `backend/.env`

### Frontend → Vercel
1. Connect GitHub repo to Vercel
2. Root directory: `frontend`
3. Add env vars from `frontend/.env` (update `VITE_API_BASE_URL` to your Render URL)

---

## Environment Variables

### Backend `.env`
```
GEMINI_API_KEY=your_key
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
FRONTEND_URL=http://localhost:5173
```

### Frontend `.env`
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_BASE_URL=http://localhost:8000
```
