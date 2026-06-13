# Implementation Plan
## PSAdvisor — Sequenced Build Guide
**Version:** 1.0  
**Team:** 3 members  

---

## 1. Team Role Suggestions

Choose roles based on your team's strengths. Suggested split:

| Role | Responsibilities |
|------|----------------|
| **Member A — Backend & AI** | FastAPI routers, Gemini integration, system prompt, file parsing, Supabase DB, OAuth fix |
| **Member B — Frontend Core** | React pages, routing, auth flow, chat components, streaming, state management |
| **Member C — UI/UX & Integration** | Design system, landing page animation, component polish, filter panel, integration testing |

> Overlap is healthy — Member C can help Member B with components while A finishes backend.

---

## 2. Build Phases

The implementation is split into **5 sequential phases**. Each phase produces testable, working output before the next begins.

---

## PHASE 0 — Project Setup & Repo Sync
**Goal:** Everyone starts from the same clean foundation.

### Tasks

#### P0.1 — Repo & Branch Setup
- [ ] Push existing `ChatBot` codebase to GitHub (if not already)
- [ ] Create branch structure: `main` (production), `dev` (working), feature branches per phase
- [ ] Set up `.env.example` files for both frontend and backend
- [ ] Confirm all 3 team members can run the project locally

#### P0.2 — Rename & Rebrand
- [ ] Rename project from `nova-chatbot` to `psadvisor` everywhere (package.json, FastAPI title, README)
- [ ] Update Supabase project name (cosmetic only, in dashboard)
- [ ] Update all hardcoded "NOVA" references in backend to "PSAdvisor"

#### P0.3 — Dependency Audit
- [ ] Frontend: confirm React, Vite, TailwindCSS, react-markdown, Lucide React are installed
- [ ] Add: `framer-motion`, `react-dropzone`
- [ ] Backend: confirm FastAPI, google-generativeai, supabase-py, python-dotenv installed
- [ ] Add: `PyMuPDF` (fitz), `Pillow`, `python-docx`

#### P0.4 — Supabase Migrations
- [ ] Run all 6 migration scripts from the Database Schema doc in Supabase SQL Editor
- [ ] Confirm RLS policies are active on all tables
- [ ] Create `ps-uploads` storage bucket with correct settings
- [ ] Test that auth trigger creates a `profiles` row on new user signup

#### P0.5 — Fix Google OAuth Redirect URL
- [ ] In Google Cloud Console: update Authorized redirect URIs to include the Vercel preview URL and `localhost:5173`
- [ ] In Supabase Auth settings: confirm Google provider is active with correct Client ID/Secret
- [ ] In frontend: update Supabase client to use the correct redirect URL
- [ ] Test full OAuth login flow end-to-end locally

**Exit criteria:** All 3 devs can log in with Google OAuth locally and see the app without errors.

---

## PHASE 1 — Backend Core: PSAdvisor AI Engine
**Goal:** Backend can accept a PS list and return a streamed ranking and deep analysis.

### Tasks

#### P1.1 — Replace System Prompt (PSAdvisor Persona)
- [ ] In backend, locate the existing system prompt in `gemini.py` (the `system_instruction`)
- [ ] Replace with the two-mode PSAdvisor system prompt from the TRD
- [ ] Add dynamic assembly: `BASE_PERSONA + PS_CONTEXT + FILTER_CONTEXT + MODE_INSTRUCTIONS`
- [ ] Write a unit test: send a sample PS list, confirm output matches expected Mode 1 format

#### P1.2 — Update Gemini Model Support
- [ ] Update `llm_providers.py` or equivalent to support `gemini-1.5-flash`, `gemini-2.0-flash`, `gemini-2.5-flash`
- [ ] Update `/api/models` endpoint to return the 3 models with display names + descriptions
- [ ] Test model switching: confirm each model responds correctly

#### P1.3 — Enable Gemini Search Grounding
- [ ] Add `GoogleSearchRetrieval` tool to Gemini calls (for deep analysis mode)
- [ ] Gate grounding behind a flag (only enable for deep analysis, not ranking — keeps ranking fast)
- [ ] Test: send a deep analysis request, confirm response includes competitor/real-world references

#### P1.4 — Fix & Extend File Upload Endpoint
- [ ] Fix the existing `/api/upload` endpoint (currently partially broken)
- [ ] Add PDF text extraction: `PyMuPDF` → extract all text → return as `extracted_text`
- [ ] Add image processing: send image to Gemini Vision with prompt "Extract all problem statements from this image as a numbered list"
- [ ] Add DOCX extraction: `python-docx` → extract paragraphs → return as text
- [ ] Return structured response: `{ extracted_text, file_name, file_type, page_count }`
- [ ] Test all 3 file types with real sample files

#### P1.5 — Update Chat Endpoint for PS Context
- [ ] Update `/api/chat/stream` request schema to accept: `ps_context`, `filters`, updated `model`
- [ ] Inject `ps_context` into system prompt on first message of a session
- [ ] Inject `filters` into system prompt when filters are set
- [ ] Confirm streaming still works correctly after changes

#### P1.6 — Update Conversations Endpoints
- [ ] Update `POST /api/conversations` to accept and store: `ps_raw_input`, `ps_input_type`, `filters`, `ps_count`
- [ ] Update `GET /api/conversations` to return enriched conversation cards (title, ps_count, top_pick, updated_at)
- [ ] Update `GET /api/conversations/:id` to return full conversation with all messages
- [ ] Add `PATCH /api/conversations/:id` for updating filters mid-session
- [ ] Test all endpoints with Postman or HTTPie

**Exit criteria:** Postman can send a PS list → receive a streamed ranking response. File upload returns extracted text for PDF, image, and DOCX.

---

## PHASE 2 — Frontend: Auth + Dashboard + Navigation
**Goal:** Users can log in, see the dashboard, navigate between pages.

### Tasks

#### P2.1 — Design System Setup
- [ ] Set up TailwindCSS with custom config: add all CSS variables from the Design Brief (colors, spacing)
- [ ] Create `theme.css` with dark and light theme CSS variables
- [ ] Add theme toggle logic: reads from `profiles.theme`, saves back on change
- [ ] Install and configure Framer Motion
- [ ] Create base component library: `Button`, `Card`, `Input`, `Badge`, `Spinner`, `Toast`

#### P2.2 — Landing Page (`/`)
- [ ] Build layout: navbar, hero section, features strip, how-it-works, footer
- [ ] Implement background animation: CSS canvas particle/orbital effect (respects `prefers-reduced-motion`)
- [ ] Add responsive layout (desktop + mobile)
- [ ] Connect "Get Started" button to Google OAuth flow
- [ ] Add redirect logic: if already logged in → skip to `/app`

#### P2.3 — Auth Flow Pages
- [ ] Implement `/auth/callback` route: exchange code, redirect to `/app`
- [ ] Implement auth context: `AuthProvider` wrapping the app, exposes `user`, `loading`, `signOut`
- [ ] Implement protected route wrapper: redirect to `/` if not authenticated
- [ ] Test: full sign-in → callback → dashboard flow

#### P2.4 — Dashboard (`/app`)
- [ ] Build sidebar: logo, "New Session" button, sessions list, Settings link, Sign Out
- [ ] Persist sidebar open/closed state in localStorage
- [ ] Build main area: welcome card + "New Session" CTA + recent sessions grid
- [ ] Session cards: show title, PS count, top pick, time ago
- [ ] Fetch conversations from `/api/conversations` on load
- [ ] Add loading skeleton for session cards
- [ ] Click card → navigate to `/app/session/:id`

#### P2.5 — Settings Page (`/app/settings`)
- [ ] Build page with sections: Account, Appearance, Default Model, Default Filters
- [ ] Connect theme toggle to `profiles` table
- [ ] Connect default model selector to `profiles.default_model`
- [ ] Connect default filters to `profiles.default_filters`
- [ ] Show user name/avatar from Google profile

**Exit criteria:** User can sign in, land on dashboard, see session history, navigate to settings, and sign out.

---

## PHASE 3 — Frontend: New Session Intake + Chat Workspace
**Goal:** Core product flow works — PS intake → ranking → deep dive → follow-up chat.

### Tasks

#### P3.1 — New Session Page (`/app/session/new`)
- [ ] Build tabbed PS input: Text tab (textarea), File tab (drag-drop zone), Image tab (image uploader)
- [ ] File tab: `react-dropzone` with PDF/DOCX/image accept, 10MB limit, progress indicator
- [ ] On file upload: POST to `/api/upload`, show extracted text preview
- [ ] Image tab: same as file but shows image thumbnail + extracted PS preview
- [ ] Build filters section (collapsible): team size, skills multi-select, domain, timeline, novelty slider
- [ ] "Analyze" button: disabled until PS input is provided; enabled once text/file is ready
- [ ] On submit: `POST /api/conversations` → navigate to `/app/session/:id` with PS context in state

#### P3.2 — Session Page Shell (`/app/session/:id`)
- [ ] Build 3-column layout: sidebar (reuse from dashboard) | chat area | filter panel
- [ ] Topbar: session title (editable inline), model selector dropdown, filter panel toggle button
- [ ] Load existing conversation on mount: `GET /api/conversations/:id` → render all past messages
- [ ] Handle empty state (new session): show initial prompt

#### P3.3 — Filter Panel
- [ ] Build filter panel component with same fields as intake page
- [ ] Slide-in animation from right (Framer Motion)
- [ ] "Apply" triggers: PATCH `/api/conversations/:id` with new filters + appends re-analysis request to chat
- [ ] On mobile: render as bottom sheet instead

#### P3.4 — Chat Interface
- [ ] Build message list: renders user bubbles (right) and AI bubbles (left)
- [ ] Implement markdown rendering in AI bubbles: `react-markdown` + `remark-gfm`
- [ ] Implement streaming: SSE connection to `/api/chat/stream`, append tokens to last AI message
- [ ] Build chat input bar: textarea (auto-resize), send button, attachment button
- [ ] Attachment button: opens file picker, uploads to `/api/upload`, injects extracted text into next message

#### P3.5 — Ranking Card Component
- [ ] Detect when AI response is a ranking (message_type === 'ranking' or parse from markdown)
- [ ] Render `RankingCard`: styled table with score bars, top pick highlighted
- [ ] Make rows clickable → auto-send "Deep dive on [PS title]" message
- [ ] Animate: staggered row reveal + score bar fill animation

#### P3.6 — Analysis Card Component
- [ ] Detect when AI response is a deep analysis
- [ ] Render `AnalysisCard`: collapsible sections per analysis dimension
- [ ] Score badge at top with color (green/amber/red)
- [ ] Key Takeaway box at bottom (highlighted)
- [ ] All sections collapsed by default; user expands what they need

**Exit criteria:** Full flow works — paste PS list → see ranking card → click PS → see analysis card → ask follow-up in chat → get response.

---

## PHASE 4 — Integration, Polish & Mobile
**Goal:** Everything works together, looks great, runs on mobile.

### Tasks

#### P4.1 — End-to-End Integration Testing
- [ ] Test Flow A: new user sign-in → new session → paste text PS → ranking → deep dive → follow-up
- [ ] Test Flow B: upload PDF → extraction → ranking → session saved → come back next day → resume
- [ ] Test Flow C: set filters → ranking → change filters mid-session → re-ranking
- [ ] Test model switching: change model mid-session, confirm next response uses new model
- [ ] Test all 3 file types: PDF, image, DOCX

#### P4.2 — Mobile Responsiveness
- [ ] Audit all pages at 375px, 414px, 768px viewport widths
- [ ] Fix sidebar: implement drawer behavior on mobile
- [ ] Fix filter panel: implement bottom sheet on mobile
- [ ] Fix ranking table: horizontal scroll + collapse extra columns on small screens
- [ ] Fix chat input: keyboard-aware (viewport resize on mobile)
- [ ] Fix landing page: adjust hero text sizing, animation performance

#### P4.3 — Loading & Error States
- [ ] Add loading skeleton to session history
- [ ] Add streaming indicator (animated dots) while AI is responding
- [ ] Add error toast for: API failure, upload failure, auth expiry
- [ ] Add cold-start warning: if first backend request takes >5s, show "Server waking up (~30s)..."
- [ ] Handle empty states for all pages

#### P4.4 — Animation Polish
- [ ] Add page transition animations (fade + slide) on all route changes
- [ ] Add chat message appear animation (fade + slide up)
- [ ] Ensure all animations respect `prefers-reduced-motion`
- [ ] Check animation performance on mid-range Android device (no jank)

#### P4.5 — Accessibility
- [ ] Add `aria-label` to all icon-only buttons
- [ ] Ensure keyboard navigation works through filter panel and chat input
- [ ] Check color contrast on all text (minimum AA)
- [ ] Add `focus-visible` styles to interactive elements

---

## PHASE 5 — Deployment
**Goal:** PSAdvisor is live on a public URL, end-to-end.

### Tasks

#### P5.1 — Backend Deployment (Render)
- [ ] Create new Render Web Service
- [ ] Connect to GitHub repo, set root directory to backend folder
- [ ] Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- [ ] Add all environment variables from TRD (GEMINI_API_KEY, SUPABASE_URL, etc.)
- [ ] Set `FRONTEND_URL` to production Vercel URL
- [ ] Deploy and confirm `/health` endpoint returns `{"status": "ok"}`
- [ ] Note the Render backend URL (e.g. `https://psadvisor-api.onrender.com`)

#### P5.2 — Frontend Deployment (Vercel)
- [ ] Connect GitHub repo to Vercel
- [ ] Set root directory to frontend folder
- [ ] Add all environment variables (VITE_SUPABASE_URL, VITE_API_BASE_URL, etc.)
- [ ] Deploy and confirm app loads at Vercel URL
- [ ] Test login flow on production URL

#### P5.3 — OAuth Production Config
- [ ] Add production Vercel URL to Google Cloud Console: Authorized JavaScript Origins
- [ ] Confirm Supabase redirect URL is set to production `/auth/callback`
- [ ] Test full OAuth sign-in on production URL

#### P5.4 — Smoke Test (Production)
- [ ] Sign in with Google on production URL
- [ ] Create a session, upload a PDF, get a ranking
- [ ] Request a deep dive, get a full analysis
- [ ] Sign out and sign back in, confirm session history loads
- [ ] Test on mobile (real device)

**Exit criteria:** PSAdvisor is publicly accessible, all core flows work, tested on both desktop and mobile.

---

## 3. Implementation Sequence Summary

```
PHASE 0: Setup & Foundation (do first, everyone unblocked)
    ↓
PHASE 1: Backend AI Engine (Member A)
    ↓ (runs parallel with Phase 2)
PHASE 2: Frontend Auth + Dashboard (Members B + C)
    ↓
PHASE 3: Core Chat Workspace (Members B + C, with P1 done)
    ↓
PHASE 4: Integration + Polish (all 3 members together)
    ↓
PHASE 5: Deployment (Member A backend, Member B/C frontend)
```

---

## 4. Risk Register

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Render free tier cold starts (~30s) | User sees slow first response | Add loading message "Server waking up..."; upgrade to paid if needed post-workshop |
| Gemini API rate limits on free tier | Analysis fails under load | Add retry logic with exponential backoff; switch to Flash for ranking (faster, cheaper) |
| File extraction quality for images | OCR may misread PS | Use Gemini Vision for image extraction (better than traditional OCR); add manual edit option |
| Supabase free tier row limits | DB full | 500MB free is more than enough for workshop scale; not a concern |
| Streaming breaks on Render | SSE disconnect issues | Add reconnect logic on frontend; fallback to non-streaming if SSE fails |
| OAuth redirect mismatch on deploy | Login broken on production | Test OAuth config immediately after Vercel deploy (Phase 5, step P5.3 is critical path) |

---

## 5. Definition of Done

PSAdvisor is **done** when:
- [ ] A user can sign in, submit a PS list (text or file), and receive a ranked analysis
- [ ] A user can request a deep dive on any PS and receive full structured analysis
- [ ] All sessions are saved and retrievable
- [ ] The app works on mobile (375px+)
- [ ] It is deployed at a public URL
- [ ] All 3 team members have tested the full flow on the live URL
