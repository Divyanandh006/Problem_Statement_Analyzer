# 🏆 PSAdvisor
### **Pick Smarter. Build Better.** — *An AI-Powered Hackathon Problem Statement Advisor*

[![Vite](https://img.shields.io/badge/Vite-5.x-purple.svg?style=flat-square&logo=vite)](https://vite.dev/)
[![React](https://img.shields.io/badge/React-18.x-blue.svg?style=flat-square&logo=react)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111.x-009688.svg?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E.svg?style=flat-square&logo=supabase)](https://supabase.com/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-Flash%20Lite-4285F4.svg?style=flat-square&logo=googlegemini)](https://ai.google.dev/)

**PSAdvisor** is a premium, specialized web application built to help hackathon teams (e.g., SIH - Smart India Hackathon, college internal hackathons, and open innovation challenges) choose the ideal problem statement. 

Instead of manual search or basic text scanning, PSAdvisor operates as a domain-expert virtual advisor. It parses document uploads, scores statements across multiple key dimensions based on your team's skills, and performs deep-dive research with live web-grounding.

---

## 🌟 Key Features

### 📅 Multi-Format Input Parsing
* **Document Extraction:** Direct parsing of PDF and Word (`.docx`) file structures.
* **Whiteboard OCR:** Snapshot analysis of handouts or team whiteboard sessions via multimodal image recognition.
* **Direct Input:** Paste lists of statements directly into the setup pane.

### 📊 Dimensional Matrix Scoring (Mode 1)
* Computes a structured matrix evaluation grading statements across 5 key dimensions:
  1. **Feasibility:** Technical difficulty vs. project timelines (e.g., 24h, 36h, 48h).
  2. **Impact:** Real-world relevance, societal impact, and scale.
  3. **Innovation:** Scope of uniqueness and creative additions.
  4. **Team Fit:** Alignment against the team's custom technical skills.
  5. **Clarity:** Quality and completeness of the statement's instructions.
* Outputs a clean, interactive glassmorphic ranking table sorted from best to worst.

### 🔎 Grounded Deep-Dive Analysis (Mode 2)
* Enables structural analysis detailing:
  * Core Pain Points & Understanding
  * Tech Stack & Hackathon Roadmap
  * Real-World Relevance & Competitive Landscape
  * **Evaluator's Perspective** (what judges seek)
  * Demo strategy (critical features to build vs. mock)
* Uses live **Google Search Grounding** to research existing open-source codebases and active competitor products.

### 🔐 Multi-Tier Secure Authentication
* Native **Supabase JWT** Email & Password authentication.
* **Developer Guest Access** bypass, simulating session tokens for rapid local styling and pipeline sandbox testing.

---

## 🏗️ System Architecture

```
   ┌────────────────────────────────────────┐
   │         React Frontend (Vite)          │
   │   - Framer Motion animations           │
   │   - Tailwind CSS design system         │
   │   - SSE stream rendering               │
   └──────────────────┬─────────────────────┘
                      │
                      │ HTTP / Server-Sent Events (SSE)
                      ▼
   ┌────────────────────────────────────────┐
   │           FastAPI Backend              │
   │   - Asynchronous endpoints             │
   │   - PDF/DOCX binary parsers            │
   │   - Gemini prompt assembler            │
   └──────┬──────────────────────────┬──────┘
          │                          │
          ▼ SQL / JWT Token Auth     ▼ Client Requests (google-genai)
   ┌──────────────┐          ┌──────────────┐
   │   Supabase   │          │  Google API  │
   │  (Postgres)  │          │   (Gemini)   │
   └──────────────┘          └──────────────┘
```

---

## 📂 Project Structure

```
Problem_Statement_Analyser/
├── backend/
│   ├── routers/             # FastAPI Route controllers (chat, upload, auth)
│   ├── services/            # Application logic (gemini_service, supabase_service)
│   ├── main.py              # Backend application entrance point & CORS configuration
│   ├── config.py            # Model configurations & environment variables
│   ├── prompts.py           # Persona architecture & prompt structuring templates
│   └── requirements.txt     # Python backend dependencies
├── frontend/
│   ├── src/
│   │   ├── components/      # Modular UI controls (Sidebar, Chat components, UI wrappers)
│   │   ├── contexts/        # AuthState & profile synchronization context
│   │   ├── pages/           # Landing page tabs, Session details, Dashboard
│   │   ├── App.jsx          # Route management & global layout setup
│   │   └── index.css        # Glassmorphic Tailwind variables and base styles
│   ├── package.json         # Node packaging metadata
│   └── vite.config.js       # Vite bundler configurations
└── supabase_migration.sql   # SQL migration code creating DB tables, indexes, and triggers
```

---

## ⚡ Quick Start & Local Setup

### 1. Database Setup (Supabase)
Create a new Supabase project and execute the contents of [supabase_migration.sql](file:///c:/Users/divya/OneDrive/antigravity/summer_intern/Problem_Statement_Analyser/supabase_migration.sql) in the **SQL Editor** to initialize:
* `profiles` (for user preferences and visual themes).
* `conversations` (storing raw inputs and parameter filter states).
* `messages` (tracking session conversations).

### 2. Backend Installation (FastAPI)
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Create a `.env` configuration file:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   SUPABASE_URL=your_supabase_project_url_here
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
   ```
4. Start the FastAPI development server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

### 3. Frontend Installation (React)
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` configuration file:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url_here
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   VITE_API_BASE=http://localhost:8000
   ```
4. Launch the local Vite dev server:
   ```bash
   npm run dev
   ```

---

## 🛡️ Model Fallbacks & Resilience

To prevent service interruptions on free tier quotas, the backend implements:
* **Model Mapping:** Redirects legacy queries automatically to active models (`gemini-2.5-flash-lite`).
* **503 / 429 Redirection:** Automatically intercepts API rate limits or network unavailability errors, switching dynamically to Lite model configurations or disabling web grounding tools to guarantee a successful completion stream.
