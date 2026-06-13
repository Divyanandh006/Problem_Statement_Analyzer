# Database Schema
## PSAdvisor — Supabase (PostgreSQL) Schema
**Version:** 1.0

---

## 1. Overview

### 1.1 Existing Tables (from `nova-chatbot` Supabase project)
From the screenshots provided, the current schema has:

| Table | Columns seen |
|-------|-------------|
| `conversations` | `id` (uuid), `user_id` (uuid), `title` (text), `model` (text), `system_prompt` (text) |
| `messages` | `id` (uuid), `conversation_id` (uuid), `role` (text), `content` (text), `model` (text) |
| `document_chunks` | (visible in sidebar, schema not shown) |

### 1.2 Migration Strategy
The existing tables are **extended, not replaced**. New columns are added via `ALTER TABLE`. New tables are added for PSAdvisor-specific features.

---

## 2. Final Schema

---

### Table: `users` (Supabase Auth — managed)
Supabase Auth automatically manages user records. We extend with a `profiles` table.

---

### Table: `profiles`
Stores per-user preferences and display info. Linked 1:1 to `auth.users`.

```sql
CREATE TABLE public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT,
  avatar_url    TEXT,
  theme         TEXT DEFAULT 'dark' CHECK (theme IN ('dark', 'light', 'system')),
  default_model TEXT DEFAULT 'gemini-2.5-flash',
  default_filters JSONB DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

**Columns:**
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Foreign key to `auth.users.id` |
| `display_name` | TEXT | User's name from Google OAuth |
| `avatar_url` | TEXT | Google profile picture URL |
| `theme` | TEXT | UI theme preference: dark/light/system |
| `default_model` | TEXT | Default Gemini model for new sessions |
| `default_filters` | JSONB | Saved filter preferences |
| `created_at` | TIMESTAMPTZ | Auto-set on creation |
| `updated_at` | TIMESTAMPTZ | Updated on any profile change |

**RLS:**
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);
```

**Trigger (auto-create profile on signup):**
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

### Table: `conversations` (Extended from existing)
Existing table + new PSAdvisor-specific columns added.

```sql
-- Existing columns: id, user_id, title, model, system_prompt
-- Add new columns:
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS session_type   TEXT DEFAULT 'ps_advisor' 
    CHECK (session_type IN ('ps_advisor', 'general')),
  ADD COLUMN IF NOT EXISTS ps_raw_input   TEXT,
  ADD COLUMN IF NOT EXISTS ps_input_type  TEXT 
    CHECK (ps_input_type IN ('text', 'file', 'image')),
  ADD COLUMN IF NOT EXISTS filters        JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS ps_count       INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS top_pick       TEXT,
  ADD COLUMN IF NOT EXISTS ranking_data   JSONB,
  ADD COLUMN IF NOT EXISTS created_at     TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at     TIMESTAMPTZ DEFAULT NOW();
```

**Full column reference:**
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Conversation identifier |
| `user_id` | UUID FK | References `auth.users.id` |
| `title` | TEXT | Auto-generated (first PS title or user-edited) |
| `model` | TEXT | Gemini model used for this session |
| `system_prompt` | TEXT | Full assembled system prompt (for replay/debug) |
| `session_type` | TEXT | Always `ps_advisor` for PSAdvisor sessions |
| `ps_raw_input` | TEXT | The raw PS list text (pasted or extracted from file) |
| `ps_input_type` | TEXT | How the PS was submitted: text/file/image |
| `filters` | JSONB | Snapshot of filters at session start |
| `ps_count` | INTEGER | Number of PS detected in input |
| `top_pick` | TEXT | Title of the AI's top recommended PS |
| `ranking_data` | JSONB | Structured ranking output (scores per PS) |
| `created_at` | TIMESTAMPTZ | Session creation time |
| `updated_at` | TIMESTAMPTZ | Last message time |

**JSONB `filters` shape:**
```json
{
  "team_size": 4,
  "skills": ["backend", "AI/ML", "design"],
  "domain": "web",
  "timeline": "48h",
  "novelty": "balanced"
}
```

**JSONB `ranking_data` shape:**
```json
[
  {
    "rank": 1,
    "title": "Smart Waste Management System",
    "scores": {
      "feasibility": 8,
      "impact": 9,
      "innovation": 7,
      "team_fit": 8,
      "clarity": 9
    },
    "total": 41,
    "summary": "Highly feasible with strong real-world impact..."
  }
]
```

**RLS:**
```sql
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own conversations"
  ON conversations FOR ALL USING (auth.uid() = user_id);
```

---

### Table: `messages` (Extended from existing)
Existing table + new columns for file attachments and PS context.

```sql
-- Existing columns: id, conversation_id, role, content, model
-- Add new columns:
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS message_type   TEXT DEFAULT 'text'
    CHECK (message_type IN ('text', 'ranking', 'analysis', 'system')),
  ADD COLUMN IF NOT EXISTS attachments    JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS metadata       JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at     TIMESTAMPTZ DEFAULT NOW();
```

**Full column reference:**
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Message identifier |
| `conversation_id` | UUID FK | References `conversations.id` |
| `role` | TEXT | `user` or `assistant` |
| `content` | TEXT | Full message content (markdown for AI) |
| `model` | TEXT | Model that generated this message |
| `message_type` | TEXT | text / ranking / analysis / system |
| `attachments` | JSONB | File references attached to this message |
| `metadata` | JSONB | Extra data (e.g. which PS was analyzed, score) |
| `created_at` | TIMESTAMPTZ | Message timestamp |

**JSONB `attachments` shape:**
```json
[
  {
    "file_name": "ps_list.pdf",
    "file_type": "pdf",
    "storage_path": "uploads/user-uuid/session-uuid/ps_list.pdf",
    "extracted_text_length": 2048
  }
]
```

**RLS:**
```sql
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own messages"
  ON messages FOR ALL
  USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()
    )
  );
```

---

### Table: `uploaded_files`
Tracks files uploaded per session (separate from message attachments for file management).

```sql
CREATE TABLE public.uploaded_files (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  file_name       TEXT NOT NULL,
  file_type       TEXT NOT NULL CHECK (file_type IN ('pdf', 'image', 'docx')),
  storage_path    TEXT NOT NULL,
  file_size_bytes INTEGER,
  extracted_text  TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

**Columns:**
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | File record identifier |
| `user_id` | UUID FK | Owner |
| `conversation_id` | UUID FK | Session this file belongs to |
| `file_name` | TEXT | Original filename |
| `file_type` | TEXT | pdf / image / docx |
| `storage_path` | TEXT | Path in Supabase Storage |
| `file_size_bytes` | INTEGER | For quota tracking |
| `extracted_text` | TEXT | Text extracted by backend (injected as PS context) |
| `created_at` | TIMESTAMPTZ | Upload time |

**RLS:**
```sql
ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own files"
  ON uploaded_files FOR ALL USING (auth.uid() = user_id);
```

---

### Table: `document_chunks` (Existing — defer to V2)
The existing `document_chunks` table supports the RAG pipeline (pgvector embeddings). Since RAG is untested and not required for V1 of PSAdvisor (PS analysis is done via direct prompt injection, not vector retrieval), this table is **left untouched** for now.

For V2, it will store chunked embeddings of PS documents for semantic search.

---

## 3. Supabase Storage

### Bucket: `ps-uploads`
```
Bucket name: ps-uploads
Access: Private (user-scoped via RLS)
Max file size: 10MB
Allowed MIME types: application/pdf, image/png, image/jpeg, image/webp,
                    application/vnd.openxmlformats-officedocument.wordprocessingml.document
```

**Path convention:**
```
ps-uploads/{user_id}/{conversation_id}/{filename}
```

---

## 4. Entity Relationship Diagram

```
auth.users (Supabase managed)
    │
    ├── profiles (1:1)
    │
    ├── conversations (1:many)
    │       │
    │       ├── messages (1:many)
    │       │
    │       └── uploaded_files (1:many)
    │
    └── uploaded_files (1:many, user-level)
```

---

## 5. Indexes

```sql
-- Conversations: fast lookup by user
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);

-- Messages: fast lookup by conversation
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at ASC);

-- Uploaded files: fast lookup by user + conversation
CREATE INDEX idx_uploaded_files_user_id ON uploaded_files(user_id);
CREATE INDEX idx_uploaded_files_conversation_id ON uploaded_files(conversation_id);
```

---

## 6. Migration Script Summary

Run in order in Supabase SQL Editor:

```
1. Create profiles table + trigger
2. ALTER conversations (add new columns)
3. ALTER messages (add new columns)
4. Create uploaded_files table
5. Add all indexes
6. Apply RLS policies
7. Create ps-uploads storage bucket
```
