# Web Flow Document
## PSAdvisor — Page-by-Page User Journey
**Version:** 1.0

---

## 1. High-Level Flow Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        ENTRY POINT                              │
│                     / (Landing Page)                            │
└──────────────────────────┬──────────────────────────────────────┘
                           │
              ┌────────────▼─────────────┐
              │   Logged in?             │
              └─────┬───────────┬────────┘
                    │ No        │ Yes
                    ▼           ▼
            /login          /app (Dashboard)
                    │
                    ▼
         Google OAuth Flow
                    │
                    ▼
         /auth/callback
                    │
                    ▼
              /app (Dashboard)

/app routes:
  /app                → Dashboard (history + new session CTA)
  /app/session/new    → New Session (PS Intake)
  /app/session/:id    → Active/Saved Session (Chat + Results)
  /app/settings       → User settings
```

---

## 2. Page-by-Page Breakdown

---

### PAGE 1: Landing Page (`/`)

**Purpose:** Hook the user, communicate value, drive sign-in.

**Inspiration:** Grok's landing page (black hole / gravitational animation background), clean centered hero.

**Layout:**
```
┌──────────────────────────────────────────────────────┐
│  [Logo: PSAdvisor]                    [Sign In →]    │  ← Navbar
├──────────────────────────────────────────────────────┤
│                                                      │
│            [Animated BG: subtle particle / orbit]    │
│                                                      │
│         ✦  PSAdvisor                                 │
│         Pick smarter. Build better.                  │
│                                                      │
│   Stop guessing which problem statement to pick.     │
│   Upload your PS list. Get ranked, researched,       │
│   advisor-quality analysis in seconds.               │
│                                                      │
│         [ Get Started with Google → ]                │
│                                                      │
├──────────────────────────────────────────────────────┤
│  FEATURES STRIP (3 cards, horizontal)                │
│  [Multi-format input] [AI Ranking] [Deep Research]   │
├──────────────────────────────────────────────────────┤
│  HOW IT WORKS (3-step visual)                        │
│  1. Upload PS  →  2. Set Filters  →  3. Get Ranked   │
├──────────────────────────────────────────────────────┤
│  Footer: GitHub | Built for Agentic AI Workshop      │
└──────────────────────────────────────────────────────┘
```

**Interactions:**
- Background animation plays on load (subtle orbital/particle effect — no heavy WebGL)
- "Get Started" → triggers Google OAuth
- If user is already logged in → "Get Started" goes to `/app` directly
- Smooth scroll between sections

---

### PAGE 2: Auth Callback (`/auth/callback`)

**Purpose:** Handle OAuth redirect, exchange code for session, redirect to app.

**Layout:** Full-screen centered spinner + "Signing you in..." text.

**Logic:**
```
On mount:
  supabase.auth.exchangeCodeForSession()
  → success: navigate('/app')
  → error: navigate('/login?error=auth_failed')
```

No user interaction needed.

---

### PAGE 3: Dashboard (`/app`)

**Purpose:** Central hub — see all past sessions, start a new one.

**Layout:**
```
┌──────────────────────────────────────────────────────┐
│  [≡ Sidebar Toggle]  PSAdvisor     [Avatar | Name]   │  ← Topbar
├────────────┬─────────────────────────────────────────┤
│  SIDEBAR   │  MAIN CONTENT                           │
│            │                                         │
│  + New     │  ┌──────────────────────────────────┐  │
│  Session   │  │  Welcome back, {name}!            │  │
│            │  │  Ready to pick your next PS?      │  │
│  ──────    │  │  [ + New PS Session ]             │  │
│            │  └──────────────────────────────────┘  │
│  RECENT    │                                         │
│  Sessions  │  RECENT SESSIONS                        │
│  ────────  │  ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  [Session] │  │Session 1│ │Session 2│ │Session 3│  │
│  [Session] │  │ 3 PS    │ │ 7 PS    │ │ 12 PS   │  │
│  [Session] │  │ 2d ago  │ │ 5d ago  │ │ 1w ago  │  │
│  ...       │  └─────────┘ └─────────┘ └─────────┘  │
│            │                                         │
│  ──────    │                                         │
│  Settings  │                                         │
│  Sign Out  │                                         │
└────────────┴─────────────────────────────────────────┘
```

**Interactions:**
- Sidebar collapsible (persisted in localStorage)
- Session cards show: title (auto-generated from first PS), PS count, date, top-picked PS
- Click session card → `/app/session/:id`
- "New Session" button → `/app/session/new`

---

### PAGE 4: New Session / PS Intake (`/app/session/new`)

**Purpose:** Collect the PS list and initial filters before AI analysis begins.

**Layout:**
```
┌──────────────────────────────────────────────────────┐
│  [← Back]   New Session                              │
├──────────────────────────────────────────────────────┤
│                                                      │
│  STEP 1 OF 2 — Submit Your Problem Statements        │
│  ─────────────────────────────────────────────       │
│                                                      │
│  ┌─ INPUT TABS ─────────────────────────────────┐   │
│  │  [📝 Paste Text]  [📄 Upload File]  [🖼 Image] │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  [Tab: Paste Text]                                   │
│  ┌──────────────────────────────────────────────┐   │
│  │  Paste your problem statements here...        │   │
│  │  (numbered list or one per line)              │   │
│  │                                               │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  [Tab: Upload File — drag & drop zone]               │
│  ┌──────────────────────────────────────────────┐   │
│  │   ⬆  Drag & drop PDF, DOCX, or image         │   │
│  │      or click to browse                       │   │
│  │      Max 10MB                                 │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ────────────────────────────────────────────────   │
│                                                      │
│  STEP 2 OF 2 — Set Filters (Optional)               │
│  ┌──────────────────────────────────────────────┐   │
│  │  Team Size: [1][2][3][4][5][6+]              │   │
│  │  Skills: [Frontend][Backend][AI/ML]           │   │
│  │          [Hardware][Design][Blockchain]        │   │
│  │  Domain: [Web] [Mobile] [AI] [IoT] [Social]  │   │
│  │  Timeline: [24h][36h][48h][72h][1 week]      │   │
│  │  Novelty: [Safe ◄────────► Innovative]        │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│         [ ✦ Analyze My Problem Statements ]          │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Interactions:**
- Tab switching (Text / File / Image) — animated transition
- File upload shows preview (filename + page count for PDFs)
- Image upload shows thumbnail
- Filter section collapsible by default ("Add filters to personalize ranking ▼")
- "Analyze" button disabled until PS input is provided
- On submit: POST to `/api/conversations` → POST to `/api/upload` (if file) → navigate to `/app/session/:id` with streaming begin

---

### PAGE 5: Active Session (`/app/session/:id`)

**Purpose:** Main workspace — shows AI ranking/analysis + ongoing chat.

**Layout:**
```
┌──────────────────────────────────────────────────────────────┐
│  [≡]  PSAdvisor  /  Session: "SIH 2024 Analysis"  [⚙ Model] │  ← Topbar
├────────────┬───────────────────────────────────┬─────────────┤
│  SIDEBAR   │  CHAT AREA                        │ FILTER PANEL│
│            │                                   │ (toggleable)│
│  + New     │  ┌───────────────────────────┐   │             │
│  Session   │  │  [User message bubble]    │   │ Team Size   │
│            │  │  [AI response — markdown  │   │ ○ 1 ○ 2 ○3 │
│  ──────    │  │   table with PS scores]   │   │ ○ 4 ○ 5 ○6+│
│            │  │                           │   │             │
│  SESSIONS  │  │  [AI: "Would you like a   │   │ Skills      │
│  ────────  │  │   deep dive on PS #3?"]   │   │ □ Frontend  │
│  [Current] │  │                           │   │ □ Backend   │
│  [Session] │  │  [User: "Yes, deep dive   │   │ □ AI/ML     │
│  [Session] │  │   on PS #3"]              │   │ □ Hardware  │
│  ...       │  │                           │   │             │
│            │  │  [AI: streaming deep      │   │ Domain      │
│            │  │   analysis card...]       │   │ [Web ▼]     │
│            │  │                           │   │             │
│            │  └───────────────────────────┘   │ Timeline    │
│            │                                   │ [48h ▼]     │
│            │  ┌─ INPUT BAR ──────────────────┐ │             │
│            │  │ [📎] [Ask follow-up...] [↑] │ │ [ Apply ]   │
│            │  └─────────────────────────────┘ │             │
└────────────┴───────────────────────────────────┴─────────────┘
```

**Filter Panel Behavior:**
- Toggled by a [⚙ Filters] button in the topbar
- Slides in from the right (like Claude's sidebar)
- Can be docked or floating (user drags to reposition on desktop)
- Filter changes show a "Re-analyze with new filters?" prompt

**Chat Area Behaviors:**
- All AI messages render full markdown (tables, headers, bullets, bold)
- Streaming text types in progressively
- PS ranking response renders as a special **RankingCard** component (styled table, not raw markdown)
- Deep analysis response renders as a special **AnalysisCard** component (collapsible sections)
- User can click any PS name in the ranking table → auto-sends "Deep dive on [PS name]"
- Attach files mid-conversation via 📎 button
- Model selector (top right) — switching model shows a toast "Model changed to Gemini 2.5 Flash"

---

### PAGE 6: Settings (`/app/settings`)

**Purpose:** User preferences and account management.

**Sections:**
- **Account:** Name, email (read-only), sign out, delete account
- **Appearance:** Light / Dark / System theme toggle
- **Default Model:** Set preferred Gemini model (applied to all new sessions)
- **Default Filters:** Pre-fill filter panel with your usual team size and skills

---

## 3. Navigation Map

```
/                       (public)
/auth/callback          (public, transient)
/app                    (protected → Dashboard)
/app/session/new        (protected → New Session Intake)
/app/session/:id        (protected → Active Session)
/app/settings           (protected → Settings)
```

Protected routes redirect to `/` if user is not authenticated.

---

## 4. Key User Flows

### Flow A: First-Time User
```
/ → [Get Started] → Google OAuth → /auth/callback → /app
→ [New Session] → /app/session/new
→ [Paste PS list] → [Set filters] → [Analyze]
→ /app/session/:id → Streaming ranking appears
→ [Click PS #2 for deep dive] → Deep analysis streams
→ [Ask follow-up in chat] → Continue conversation
```

### Flow B: Returning User — Resume Session
```
/ → [Sign In] → /app → [Click past session card]
→ /app/session/:id → Full history loaded
→ [Continue chatting] → Pick up where they left off
```

### Flow C: Returning User — New Session
```
/app → [New Session] or sidebar [+]
→ /app/session/new → Upload PDF of PS list
→ /app/session/:id → Auto-ranking begins
```

### Flow D: Changing Filters Mid-Session
```
/app/session/:id → [⚙ Filters] (topbar)
→ Filter panel slides in
→ User changes skills / team size
→ [Apply] → Toast: "Re-analyzing with new filters..."
→ New ranking message appended to chat
```

---

## 5. Error States

| Scenario | Behavior |
|----------|---------|
| File upload fails | Red inline error below dropzone: "Upload failed. Try a smaller file or different format." |
| Gemini API error | Chat bubble: "Analysis failed — try again or switch to a different model." |
| Session not found | 404 page with [← Back to Dashboard] |
| Auth expired | Silent refresh; if fails → toast "Session expired, please sign in again" → redirect `/` |
| Render cold start (slow first load) | Loading spinner with "Waking up the server... (~30s first load)" |
