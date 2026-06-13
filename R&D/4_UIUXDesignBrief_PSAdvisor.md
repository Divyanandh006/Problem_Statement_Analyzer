# UI/UX Design Brief
## PSAdvisor — Visual Design & Experience Guidelines
**Version:** 1.0

---

## 1. Design Philosophy

PSAdvisor should feel like a **smart, focused research tool** — not a generic AI chatbot. The experience should communicate:

- **Confidence:** Users should feel like they have an expert in the room
- **Clarity:** Dense AI output (tables, analysis) must be scannable and beautiful
- **Motion:** Animations guide attention; they never distract
- **Focus:** No clutter — every element on screen earns its place

**References:**
- **Grok (xAI):** Landing page gravity/orbital background animation, dark hero, centered minimal layout
- **Google AI Studio:** Clean workspace feel, model selector in header, smooth transitions, professional but approachable
- **Gemini:** Card-based content rendering, smooth text streaming effect, rounded components
- **Antigravity platform:** Bold hero aesthetic, smooth scroll, techy-premium feel

---

## 2. Color System

### 2.1 Base Themes
PSAdvisor supports **Light**, **Dark**, and **System** themes. The dark theme is primary (default) — it fits the analytical/techy product feel and matches the Grok/AI Studio references.

### 2.2 Dark Theme Palette
| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#0A0A0F` | Main page background |
| `--bg-surface` | `#111118` | Cards, sidebar, panels |
| `--bg-elevated` | `#1A1A24` | Input fields, hover states |
| `--bg-overlay` | `#22222E` | Modals, tooltips |
| `--border` | `#2A2A38` | Dividers, card borders |
| `--border-subtle` | `#1E1E2A` | Subtle separators |
| `--text-primary` | `#F0F0FF` | Headings, main content |
| `--text-secondary` | `#9090A8` | Subtext, labels |
| `--text-muted` | `#5A5A70` | Placeholders, timestamps |
| `--accent-primary` | `#7C6DFA` | CTAs, active states, links |
| `--accent-secondary` | `#5B6AF0` | Hover on primary |
| `--accent-glow` | `rgba(124,109,250,0.15)` | Glow effects on accent elements |
| `--success` | `#34C78A` | Score badges (high), positive indicators |
| `--warning` | `#F5A623` | Score badges (medium) |
| `--danger` | `#FF5A5A` | Score badges (low), errors |
| `--score-bar` | gradient: success→warning→danger | Score visualization bars |

### 2.3 Light Theme Palette
| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#F8F8FC` | Main page background |
| `--bg-surface` | `#FFFFFF` | Cards, sidebar |
| `--bg-elevated` | `#F0F0F8` | Input fields, hover |
| `--border` | `#E0E0EC` | Dividers |
| `--text-primary` | `#0A0A1A` | Headings |
| `--text-secondary` | `#50507A` | Subtext |
| `--accent-primary` | `#6055E8` | CTAs (slightly darker for contrast) |

### 2.4 Accent Rationale
The **indigo-violet accent** (`#7C6DFA`) was chosen because:
- It feels premium and technical without being cold (unlike pure blue)
- It contrasts well on both dark and light backgrounds
- It differentiates from Gemini's blue and GPT's green

---

## 3. Typography

| Role | Font | Weight | Size |
|------|------|--------|------|
| Display (hero) | Inter or Geist | 700 | 48–64px |
| Heading H1 | Inter | 600 | 32px |
| Heading H2 | Inter | 600 | 24px |
| Heading H3 | Inter | 500 | 18px |
| Body | Inter | 400 | 15px |
| Small / Label | Inter | 400 | 13px |
| Code / AI output | JetBrains Mono | 400 | 14px |
| Chat AI response | Inter | 400 | 15px |

**Font source:** Google Fonts (free). Inter for all UI; JetBrains Mono for code blocks inside AI output.

**Line heights:**
- Display: 1.1
- Body: 1.6
- Chat messages: 1.7 (extra breathing room for long markdown)

---

## 4. Spacing & Layout

### 4.1 Spacing Scale
Uses an 8px base unit:
`4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96px`

### 4.2 Layout Grid
- **Desktop (1280px+):** 3-column layout (sidebar 240px | main flex | filter panel 280px)
- **Tablet (768–1279px):** Sidebar collapses to icon strip; filter panel becomes a bottom sheet
- **Mobile (< 768px):** Single column; sidebar is a drawer; filter panel is a bottom sheet

### 4.3 Border Radius
| Element | Radius |
|---------|--------|
| Buttons | 10px |
| Input fields | 12px |
| Cards | 16px |
| Modals | 20px |
| Avatars | 50% |
| Chat bubbles | 18px (2px on sender corner) |

---

## 5. Component Specifications

### 5.1 Landing Page — Animated Background
- **Inspiration:** Grok's black hole / gravitational lensing effect
- **Implementation:** CSS + canvas (no heavy WebGL) — subtle orbital rings or particle field slowly drifting
- **Behavior:** Pauses when tab is not visible (performance); reduced motion respected via `prefers-reduced-motion`
- **Color:** Dark purples/indigos matching the accent palette; subtle glow at center

### 5.2 Primary Button
```
Background: --accent-primary
Text: white, 14px, weight 500
Padding: 10px 20px
Border radius: 10px
Hover: scale(1.02) + glow shadow: 0 0 20px var(--accent-glow)
Active: scale(0.98)
Transition: all 200ms ease
```

### 5.3 Chat Bubbles
**User message:**
```
Background: --accent-primary (filled)
Text: white
Alignment: right
Max-width: 75%
Border radius: 18px 18px 4px 18px
```

**AI message:**
```
Background: --bg-surface
Border: 1px solid --border
Alignment: left
Max-width: 85%
Border radius: 18px 18px 18px 4px
Padding: 16px 20px
```

### 5.4 Ranking Card (Special AI Component)
When AI returns a PS ranking, render as a styled card — not raw markdown:
```
┌─────────────────────────────────────────────────────┐
│  📊 PS Rankings                          [Expand ▼] │
├────┬──────────────────┬─────┬──────┬──────┬─────────┤
│ #  │ Problem Statement│ Fea │ Imp  │ Inn  │  Total  │
├────┼──────────────────┼─────┼──────┼──────┼─────────┤
│ 1  │ Smart Waste Mgmt │  8  │  9   │  7   │ █ 38/50 │
│ 2  │ Mental Health App│  7  │  9   │  8   │ █ 36/50 │
│ 3  │ Rural EdTech     │  6  │  8   │  6   │ █ 32/50 │
└────┴──────────────────┴─────┴──────┴──────┴─────────┘
  Top pick: [Smart Waste Management] — Click for deep dive →
```
- Score bars colored: green (8–10), amber (5–7), red (1–4)
- Top pick highlighted with accent border + subtle glow
- Clickable rows → auto-trigger deep dive

### 5.5 Analysis Card (Special AI Component)
When AI returns a deep analysis, render with collapsible sections:
```
┌─────────────────────────────────────────────────────┐
│  🔍 Smart Waste Management — Full Analysis          │
│  ⭐ Score: 8.2 / 10                     [Collapse ▲]│
├─────────────────────────────────────────────────────┤
│  🔎 Pain Points & Core Understanding         [▼]    │
│  ⚙️  Feasibility of Execution               [▼]    │
│  🌍 Impact & Relevance                       [▼]    │
│  💡 Scope of Innovation                      [▼]    │
│  🧩 Clarity of Problem Statement             [▼]    │
│  🎯 Evaluator's Perspective                  [▼]    │
│  👥 Strategy for Team Fit                    [▼]    │
├─────────────────────────────────────────────────────┤
│  📊 Key Takeaway: [2-sentence verdict box]          │
└─────────────────────────────────────────────────────┘
```

### 5.6 Filter Panel
- Slides in from the right edge of the screen
- Backdrop blur on the content behind it (not a full overlay)
- Sticky "Apply Filters" button at the bottom of the panel
- On mobile: slides up from the bottom (bottom sheet)

### 5.7 Input Bar (Chat)
```
┌────────────────────────────────────────────────────┐
│  [📎]  Ask a follow-up question...        [↑ Send] │
└────────────────────────────────────────────────────┘
```
- Rounded pill shape
- Auto-expands vertically for multi-line input (max 6 lines)
- Send button glows on hover
- Shows character count at 500+ chars

### 5.8 Model Selector
Located in topbar, right side:
```
  [⚡ Gemini 2.5 Flash ▼]
```
- Dropdown on click showing 3 model options
- Each option shows name + one-line description
- Animated dropdown with smooth open/close

---

## 6. Animation Principles

All animations follow these rules:
- **Duration:** 150–300ms for UI transitions; 600–1200ms for page-level
- **Easing:** `cubic-bezier(0.4, 0, 0.2, 1)` (Material-inspired ease-in-out)
- **Never block interaction:** animations should never gate user actions
- **Respect reduced motion:** all animations wrapped in `@media (prefers-reduced-motion: reduce)`

| Element | Animation |
|---------|-----------|
| Page transitions | Fade + slight translateY(8px) → 0 |
| Sidebar open/close | translateX slide |
| Filter panel | translateX from right |
| Chat messages appear | fadeIn + translateY(4px) |
| Streaming text | Character-by-character with cursor blink |
| Button hover | scale + glow, 150ms |
| Ranking card appear | Staggered row reveal (100ms delay between rows) |
| Score bars | Width animates from 0 on first render |
| Toast notifications | Slide in from bottom-right |

---

## 7. Mobile Design Guidelines

- **Touch targets:** Minimum 44x44px for all interactive elements
- **Sidebar:** Hidden by default; triggered by hamburger; overlays content with dark backdrop
- **Filter panel:** Bottom sheet (slides up); handle bar at top for drag-dismiss
- **Chat input:** Fixed to bottom of viewport; keyboard-aware (adjusts when keyboard opens)
- **Cards:** Full width; font size bumped by 1px for readability
- **Ranking table:** Horizontal scroll on very small screens; only show top 3 scores (collapsible rest)

---

## 8. Iconography

- **Library:** Lucide React (consistent, minimal, MIT licensed)
- **Size:** 16px (inline), 20px (buttons/actions), 24px (navigation)
- **Style:** Stroke-based (not filled) — matches the minimal aesthetic

Key icons used:
| Icon | Usage |
|------|-------|
| `Plus` | New session |
| `MessageSquare` | Session / chat |
| `Upload` | File upload |
| `Settings2` | Filter panel toggle |
| `ChevronDown/Up` | Expand/collapse |
| `Sparkles` | AI indicator |
| `Star` | Score |
| `LogOut` | Sign out |
| `Moon/Sun` | Theme toggle |

---

## 9. Empty States

Each empty state should be helpful, not just a blank space.

| State | Illustration idea | Message |
|-------|------------------|---------|
| No sessions yet | Subtle orbit/planet icon | "No sessions yet. Start by uploading your first PS list." |
| Empty chat | PSAdvisor logo centered | "Paste your PS list above to get started." |
| No filter applied | Sliders icon | "Add filters to personalize your ranking." |

---

## 10. Design Decisions Summary

| Decision | Choice | Reason |
|----------|--------|--------|
| Default theme | Dark | Matches AI tool aesthetic; Grok reference |
| Primary accent | Indigo-violet | Premium, technical, distinct from competitors |
| Font | Inter | Clean, highly readable, free, widely used in modern SaaS |
| Animation library | Framer Motion | React-native, production-quality, easy API |
| AI output render | Custom cards > raw markdown | More polished, better scannability |
| Mobile approach | Mobile-optimized (not mobile-first) | Desktop is primary; mobile is fully supported |
| Landing animation | CSS canvas particles (no WebGL) | Performance on mid-range devices |
