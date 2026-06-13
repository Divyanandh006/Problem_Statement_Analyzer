# Technical Requirements Document (TRD)
## PSAdvisor — AI-Powered Hackathon Problem Statement Advisor
**Version:** 1.0  
**Status:** Draft  

---

## 1. System Architecture Overview

PSAdvisor follows a **decoupled client-server architecture** with three tiers:

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT (React)                      │
│          Vercel — React + Vite + TailwindCSS            │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS / SSE
┌────────────────────────▼────────────────────────────────┐
│                  BACKEND (FastAPI)                      │
│           Render — Python + FastAPI + Uvicorn           │
│   Routers: chat, conversations, upload, models, auth    │
└──────────┬──────────────────────────────┬───────────────┘
           │                              │
┌──────────▼──────────┐       ┌───────────▼───────────────┐
│   Supabase (DB)     │       │     Google Gemini API      │
│ PostgreSQL+pgvector │       │  gemini-1.5/2.0/2.5-flash  │
│ Supabase Auth       │       │  + Grounding (Search)      │
└─────────────────────┘       └────────────────────────────┘
```

---

## 2. Technology Stack

### 2.1 Frontend
| Layer | Technology | Reason |
|-------|-----------|--------|
| Framework | React 18 + Vite | Existing codebase; fast HMR |
| Styling | TailwindCSS | Utility-first; easy responsive design |
| Animations | Framer Motion | Smooth page transitions and micro-animations |
| State Management | React Context API + useState/useReducer | Existing pattern; no Redux needed at this scale |
| Streaming | EventSource (SSE) | Matches existing backend SSE implementation |
| Auth | Supabase JS Client | Google OAuth session management |
| HTTP Client | Axios / Fetch API | API calls to FastAPI backend |
| Markdown Rendering | react-markdown + remark-gfm | Render AI responses with tables, bullets |
| Icons | Lucide React | Lightweight, consistent icon set |
| File Handling | react-dropzone | Drag-and-drop file upload UI |

### 2.2 Backend
| Layer | Technology | Reason |
|-------|-----------|--------|
| Framework | FastAPI (Python 3.11+) | Existing codebase; async-native; SSE support |
| Server | Uvicorn | ASGI server for FastAPI |
| AI SDK | google-generativeai | Official Gemini SDK |
| File Parsing | PyMuPDF (fitz) for PDF, Pillow for images, python-docx for DOCX | Multi-format PS extraction |
| Embeddings | Gemini text-embedding-004 | Free, integrates with pgvector |
| Vector Store | pgvector (via Supabase) | Already set up in existing project |
| Auth Validation | supabase-py | Validate JWT tokens from frontend |
| Environment | python-dotenv | Config management |
| CORS | FastAPI CORSMiddleware | Already configured |

### 2.3 Database
| Component | Technology |
|-----------|-----------|
| Database | Supabase (PostgreSQL) |
| Vector Extension | pgvector |
| Auth | Supabase Auth (Google OAuth via custom Google Cloud app) |
| Storage | Supabase Storage (for uploaded PS files) |

### 2.4 Infrastructure
| Service | Platform | Tier |
|---------|---------|------|
| Frontend Hosting | Vercel | Free |
| Backend Hosting | Render | Free (Web Service) |
| Database | Supabase | Free |
| AI API | Google AI Studio (Gemini) | Free tier |
| Domain/OAuth | Google Cloud Console | Free (OAuth app) |

---

## 3. API Specification

### 3.1 Authentication
All protected endpoints require a `Bearer` JWT token in the `Authorization` header, validated against Supabase.

```
Authorization: Bearer <supabase_jwt_token>
```

### 3.2 Endpoints

#### Auth
| Method | Endpoint | Description |
|--------|---------|-------------|
| GET | `/api/auth/session` | Validate current session |

#### Conversations
| Method | Endpoint | Description |
|--------|---------|-------------|
| GET | `/api/conversations` | List all conversations for user |
| POST | `/api/conversations` | Create new conversation/session |
| GET | `/api/conversations/{id}` | Get conversation with messages |
| PATCH | `/api/conversations/{id}` | Update title or filters |
| DELETE | `/api/conversations/{id}` | Delete conversation |

#### Chat
| Method | Endpoint | Description |
|--------|---------|-------------|
| POST | `/api/chat/stream` | Send message, stream response (SSE) |

**Request body for `/api/chat/stream`:**
```json
{
  "conversation_id": "uuid",
  "message": "string",
  "model": "gemini-2.5-flash",
  "filters": {
    "team_size": 4,
    "skills": ["backend", "AI/ML"],
    "domain": "web",
    "timeline": "36h",
    "novelty": "balanced"
  },
  "ps_context": "string (serialized PS list, injected once per session)"
}
```

#### Upload
| Method | Endpoint | Description |
|--------|---------|-------------|
| POST | `/api/upload` | Upload PS file (PDF/image/DOCX), returns extracted text |

**Response:**
```json
{
  "extracted_text": "1. Build a platform for...\n2. Develop an AI model for...",
  "file_name": "ps_list.pdf",
  "file_type": "pdf",
  "pages": 2
}
```

#### Models
| Method | Endpoint | Description |
|--------|---------|-------------|
| GET | `/api/models` | List available Gemini models |

#### Theme (existing)
| Method | Endpoint | Description |
|--------|---------|-------------|
| GET/POST | `/api/theme` | Get/set user theme preference |

---

## 4. AI Integration

### 4.1 Model Configuration
```python
AVAILABLE_MODELS = {
    "gemini-1.5-flash": {
        "display_name": "Gemini 1.5 Flash",
        "description": "Fast and efficient",
        "context_window": 1048576
    },
    "gemini-2.0-flash": {
        "display_name": "Gemini 2.0 Flash",
        "description": "Balanced performance",
        "context_window": 1048576
    },
    "gemini-2.5-flash": {
        "display_name": "Gemini 2.5 Flash",
        "description": "Most capable (recommended)",
        "context_window": 1048576
    }
}
```

### 4.2 System Prompt Architecture
The system prompt is assembled dynamically per request:

```
[BASE_PERSONA] + [PS_CONTEXT] + [FILTER_CONTEXT] + [MODE_INSTRUCTIONS]
```

**BASE_PERSONA (static):**
```
You are PSAdvisor — an expert analyst specializing in helping students
choose hackathon problem statements (SIH, college hackathons, open hackathons).
You are precise, structured, and always output well-formatted markdown.
You ONLY discuss problem statement analysis and hackathon strategy.
If asked anything unrelated, politely redirect to your core purpose.
```

**PS_CONTEXT (injected once at session start):**
```
The user has submitted the following problem statements:
{ps_list}
Keep these in context for all subsequent analysis.
```

**FILTER_CONTEXT (injected when filters are set):**
```
User's team profile:
- Team size: {team_size}
- Available skills: {skills}
- Domain preference: {domain}
- Hackathon timeline: {timeline}
- Preference: {novelty}
Factor all of the above into every score and recommendation.
```

**MODE_INSTRUCTIONS (static, defines both modes):**
```
You operate in two modes:

── MODE 1: RANKING (triggered when user provides PS list or asks to rank) ──
Generate a markdown table scoring all PS on: Feasibility, Impact, Innovation,
Team Fit, and Clarity (each /10). Sum for Total. Highlight top 2–3.
End with: "Would you like a deep dive on any of these?"

── MODE 2: DEEP ANALYSIS (triggered when user selects a specific PS) ──
Use this exact structure:
## [PS Title] — Full Analysis
### 🔎 Pain Points & Core Understanding
### ⚙️ Feasibility of Execution
### 🌍 Impact & Relevance
### 💡 Scope of Innovation
### 🧩 Clarity of Problem Statement
### 🎯 Evaluator's Perspective
### 👥 Strategy for Team Fit
---
**📊 Key Takeaway:** [2-sentence verdict]
**⭐ Score: X/10** — [one-line reason]
```

### 4.3 Gemini Search Grounding
For deep analysis requests, enable Gemini's search grounding tool to fetch real competitor data, papers, and existing solutions:

```python
from google.generativeai.types import Tool, GoogleSearchRetrieval

tools = [Tool(google_search_retrieval=GoogleSearchRetrieval())]
model = genai.GenerativeModel(model_name, tools=tools, system_instruction=system_prompt)
```

### 4.4 File Processing Pipeline
```
Upload (PDF/Image/DOCX)
        │
        ▼
Extract text (PyMuPDF / Pillow OCR via Gemini Vision / python-docx)
        │
        ▼
Return extracted_text to frontend
        │
        ▼
Frontend stores as ps_context in session state
        │
        ▼
Injected into system prompt on first chat message
```

---

## 5. Google OAuth Configuration

### 5.1 Current Setup
- Supabase project: `nova-chatbot` (existing)
- Google Cloud OAuth app: already created (separate from Supabase defaults)
- Redirect URI must be set to the **production frontend URL** (Vercel domain), not `*.supabase.co`

### 5.2 Required Configuration
```
Google Cloud Console → OAuth 2.0 Client:
  Authorized JavaScript origins: https://psadvisor.vercel.app
  Authorized redirect URIs:
    https://<supabase-project-ref>.supabase.co/auth/v1/callback

Supabase Dashboard → Auth → Providers → Google:
  Client ID: <from Google Cloud>
  Client Secret: <from Google Cloud>
  Redirect URL: https://psadvisor.vercel.app/auth/callback
```

### 5.3 Frontend Auth Flow
```
User clicks "Sign in with Google"
        │
        ▼
supabase.auth.signInWithOAuth({ provider: 'google' })
        │
        ▼
Redirect to Google consent screen
        │
        ▼
Callback to /auth/callback (React route)
        │
        ▼
supabase.auth.exchangeCodeForSession()
        │
        ▼
JWT stored in localStorage / Supabase session
        │
        ▼
User redirected to /app (main tool)
```

---

## 6. Streaming Architecture (SSE)

Backend streams Gemini responses token by token:

```python
async def stream_gemini(prompt, model, system_prompt):
    response = model.generate_content(prompt, stream=True)
    for chunk in response:
        yield f"data: {json.dumps({'text': chunk.text})}\n\n"
    yield "data: [DONE]\n\n"
```

Frontend handles SSE:
```javascript
const source = new EventSource('/api/chat/stream', { withCredentials: true });
source.onmessage = (e) => {
  if (e.data === '[DONE]') { source.close(); return; }
  const { text } = JSON.parse(e.data);
  setMessages(prev => appendToLastMessage(prev, text));
};
```

---

## 7. Environment Variables

### Backend (`.env`)
```
GEMINI_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
FRONTEND_URL=https://psadvisor.vercel.app
```

### Frontend (`.env`)
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_BASE_URL=https://psadvisor-api.onrender.com
```

---

## 8. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| First token latency | < 3 seconds |
| File upload processing | < 10 seconds for 10MB PDF |
| API response availability | 99% uptime (Render free tier caveat: cold starts ~30s) |
| Mobile responsive | 375px and above |
| Accessibility | WCAG AA minimum (contrast, focus states) |
| Browser support | Chrome, Firefox, Safari, Edge (last 2 versions) |

---

## 9. Security Considerations

- All API endpoints protected by JWT validation (no public routes except `/health`)
- Files uploaded to Supabase Storage with user-scoped bucket policies
- RLS (Row Level Security) enabled on all Supabase tables
- No API keys exposed to frontend (all Gemini calls server-side)
- CORS restricted to production frontend URL only

---

## 10. Existing Codebase — What to Keep vs. Change

| Component | Status | Action |
|-----------|--------|--------|
| FastAPI structure + routers | ✅ Solid | Keep, extend |
| SSE streaming pipeline | ✅ Working | Keep as-is |
| Supabase auth integration | ✅ Working | Fix OAuth redirect URL only |
| File upload endpoint | ⚠️ Partial | Fix + add text extraction |
| RAG / pgvector pipeline | ❌ Untested | Defer to V2 (not needed for PS ranking) |
| Gemini provider | ✅ Working | Update to support 2.5-flash + model selector |
| React frontend components | ⚠️ Issues | Keep architecture, redesign UI |
| Chat streaming (frontend) | ✅ Working | Keep |
| System prompt | ❌ Generic | Replace entirely with PSAdvisor persona |
