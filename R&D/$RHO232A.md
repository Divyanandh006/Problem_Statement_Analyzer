# Product Requirements Document (PRD)
## PSAdvisor — AI-Powered Hackathon Problem Statement Advisor
**Version:** 1.0  
**Status:** Draft  
**Project:** Agentic AI Workshop Final Project  

---

## 1. Product Overview

### 1.1 Product Name
**PSAdvisor** *(tagline: "Pick smarter. Build better.")*

> Alternative names considered: StatementIQ, PSense, HackPick, DecideAI — **PSAdvisor** chosen for clarity and domain specificity.

### 1.2 Product Summary
PSAdvisor is a specialized AI-powered web application that helps hackathon students (SIH, Smart India Hackathon, internal college hackathons, open hackathons) analyze, rank, and confidently choose a Problem Statement (PS) from a given set. It goes beyond a generic chatbot by acting as a domain-expert advisor — performing structured research on each PS, scoring them across multiple parameters, and delivering clear, actionable guidance.

### 1.3 Problem Statement
Students participating in hackathons routinely receive 5–30 problem statements and must choose one within hours or days. They lack the tools and domain knowledge to:
- Quickly evaluate technical feasibility
- Assess innovation potential vs. difficulty
- Match a PS to their team's skill set
- Understand what evaluators actually look for

This leads to poor PS choices, wasted effort, and low-quality submissions.

### 1.4 Solution
A purpose-built AI chatbot that accepts a list of PS (via text, file, or image), applies user-defined filters (team skills, domain, timeline), and delivers a ranked breakdown with deep per-PS research — enabling confident, data-backed decisions.

---

## 2. Goals & Success Criteria

### 2.1 Primary Goal
Enable any hackathon student to go from "I have a list of PS" to "I know exactly which one to pick and why" in under 10 minutes.

### 2.2 Secondary Goals
- Provide reusable, shareable PS research sessions
- Build a tool polished enough for workshop demo and real-world deployment
- Demonstrate agentic AI capabilities (multi-modal input, structured reasoning, web-grounded research)

### 2.3 Success Metrics
| Metric | Target |
|--------|--------|
| Time to first PS ranking output | < 60 seconds after submission |
| User can complete full flow (upload → rank → deep dive) without assistance | Yes |
| Works on mobile without broken layout | Yes |
| Supports at least 3 input types | Text, PDF, Image |
| Session history is retrievable | Yes |

---

## 3. Target Users

### 3.1 Primary Users
**Hackathon students (any hackathon broadly)** — including but not limited to:
- SIH (Smart India Hackathon) participants
- College-level internal hackathon participants
- Open hackathon participants (HackWithInfy, DevSprint, etc.)
- Solo participants and teams of 2–6

### 3.2 User Characteristics
- Age: 18–26
- Technical familiarity: moderate (can use a web app, upload a PDF)
- Context: time-pressured, often first-time hackathon participants
- Device: desktop preferred for research, mobile for quick checks

### 3.3 Out of Scope Users
- Hackathon organizers (not a PS creation tool)
- Professional product managers or startup founders (not the target persona)

---

## 4. Core Features

### 4.1 Feature List

#### F1 — Multi-Modal PS Input
Users can submit their PS list via:
- **Text:** Paste or type directly into an intake form
- **File:** Upload a PDF or DOCX containing the PS list
- **Image:** Upload a photo/screenshot of a PS sheet or whiteboard

#### F2 — PS Ranking (Mode 1)
After input, PSAdvisor automatically generates a ranked table of all PS scored across:
- Feasibility (can it be built in a hackathon?)
- Impact (real-world value)
- Innovation (novelty of approach)
- Team Fit (based on user's declared skills)
- Clarity (is the PS well-defined?)

Output: a markdown table with scores + a highlighted top 2–3 recommendation.

#### F3 — Deep PS Analysis (Mode 2)
On user request ("deep dive on PS #2"), PSAdvisor generates a full structured analysis covering:
- Pain Points & Core Understanding
- Feasibility of Execution
- Impact & Relevance
- Scope of Innovation (with competitor analysis)
- Clarity of PS
- Evaluator's Perspective
- Strategy for Team Fit

#### F4 — Filter / Parameter Panel
Users can set optional filters that influence ranking and analysis:
- Team size (1–6)
- Available skills (frontend, backend, AI/ML, hardware, design, etc.)
- Domain preference (web, mobile, AI, IoT, blockchain, social impact, etc.)
- Hackathon timeline (24h, 36h, 48h, 72h, 1 week)
- Novelty preference (safe & feasible vs. innovative & risky)

Filter panel accessible both before starting a session and mid-conversation (floating panel, like Claude's sidebar).

#### F5 — Conversational Follow-up
After ranking/analysis, users can continue the chat to ask follow-ups:
- "What tech stack should we use for PS #3?"
- "Compare PS #1 and PS #4 head-to-head"
- "What if our team had more ML experience — would the ranking change?"

#### F6 — Session Persistence & History
- Users log in via Google OAuth
- All PS sessions are saved and retrievable
- Users can resume a past session and continue the conversation
- Each session stores: PS input, filters used, ranking output, chat history

#### F7 — Model Selector
Users can choose which Gemini model powers their session:
- gemini-1.5-flash (fast, free)
- gemini-2.0-flash (balanced)
- gemini-2.5-flash (most capable, latest)

#### F8 — Streaming Responses
All AI responses stream in real time (token by token) for perceived speed and engagement.

---

## 5. User Stories

| ID | As a... | I want to... | So that... |
|----|---------|-------------|-----------|
| US-01 | Hackathon student | Upload a PDF of my PS list | I don't have to retype everything |
| US-02 | Hackathon student | See a ranked table of all my PS | I can quickly shortlist |
| US-03 | Team lead | Set team size and skills as filters | Rankings are relevant to my team |
| US-04 | Student | Get a deep-dive analysis of my top pick | I fully understand what I'm getting into |
| US-05 | Student | Ask follow-up questions after analysis | I can explore edge cases |
| US-06 | Returning user | Find my past PS sessions | I can revisit research from yesterday |
| US-07 | Student | Switch to a more powerful Gemini model | I get better analysis for complex PS |
| US-08 | Mobile user | Use the tool on my phone | I can check analyses on the go |

---

## 6. Non-Goals (What PSAdvisor Will NOT Do)

- **Not a PS generator** — it does not create problem statements, only analyzes provided ones
- **Not a solution builder** — it advises on PS selection, not on building the actual project
- **Not a team-formation tool** — it does not match users with teammates
- **Not a submission portal** — it has no integration with SIH or any hackathon platform
- **Not a general-purpose chatbot** — it will refuse or redirect off-topic queries politely
- **Not a plagiarism checker** — it does not verify PS originality

---

## 7. Authentication & Accounts

- **Login method:** Google OAuth (via Supabase Auth, with custom OAuth app on Google Cloud — not Supabase's default URL)
- **Session:** JWT-based, persisted across browser sessions
- **Account data stored:** user profile (name, email, avatar), conversation history, filter preferences
- **Guest mode:** Not supported in V1 (login required to use the tool)

---

## 8. Constraints & Assumptions

| Constraint | Detail |
|------------|--------|
| Budget | Free tier only — Gemini API (Google AI Studio free tier), Supabase free, Vercel free, Render free |
| AI Provider | Google Gemini only (gemini-1.5-flash through gemini-2.5-flash) |
| File size limit | Max 10MB per uploaded file |
| PS list size | Supports 1–30 problem statements per session |
| Concurrent users | Designed for low-to-medium load (workshop demo scale) |

---

## 9. Out of Scope for V1 (Future Roadmap)

- Team collaboration (multiple users on one session)
- PS comparison report as downloadable PDF
- Integration with SIH portal or hackathon APIs
- Voice input for PS submission
- Leaderboard or community-shared PS analyses
- Notification/reminder system ("your hackathon is in 2 days")
