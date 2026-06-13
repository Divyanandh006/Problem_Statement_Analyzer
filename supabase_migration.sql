-- ═══════════════════════════════════════════════════════
-- PSAdvisor Database Migration
-- Run in Supabase SQL Editor (in this exact order)
-- ═══════════════════════════════════════════════════════

-- ── 1. profiles table ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name    TEXT,
  avatar_url      TEXT,
  theme           TEXT DEFAULT 'dark' CHECK (theme IN ('dark', 'light', 'system')),
  default_model   TEXT DEFAULT 'gemini-2.5-flash',
  default_filters JSONB DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── 2. conversations table ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.conversations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title           TEXT DEFAULT 'New PS Session',
  model           TEXT DEFAULT 'gemini-2.5-flash',
  system_prompt   TEXT,
  session_type    TEXT DEFAULT 'ps_advisor' CHECK (session_type IN ('ps_advisor', 'general')),
  ps_raw_input    TEXT,
  ps_input_type   TEXT CHECK (ps_input_type IN ('text', 'file', 'image')),
  filters         JSONB DEFAULT '{}'::jsonb,
  ps_count        INTEGER DEFAULT 0,
  top_pick        TEXT,
  ranking_data    JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. messages table ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content         TEXT NOT NULL,
  model           TEXT DEFAULT '',
  message_type    TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'ranking', 'analysis', 'system')),
  attachments     JSONB DEFAULT '[]'::jsonb,
  metadata        JSONB DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. uploaded_files table ────────────────────────────
CREATE TABLE IF NOT EXISTS public.uploaded_files (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  file_name       TEXT NOT NULL,
  file_type       TEXT NOT NULL CHECK (file_type IN ('pdf', 'image', 'docx')),
  storage_path    TEXT NOT NULL DEFAULT '',
  file_size_bytes INTEGER,
  extracted_text  TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── 5. Indexes ─────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at ASC);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_user_id ON uploaded_files(user_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_conversation_id ON uploaded_files(conversation_id);

-- ── 6. Row Level Security ──────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own conversations" ON conversations;
CREATE POLICY "Users can manage own conversations"
  ON conversations FOR ALL USING (auth.uid() = user_id);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own messages" ON messages;
CREATE POLICY "Users can manage own messages"
  ON messages FOR ALL
  USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()
    )
  );

ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own files" ON uploaded_files;
CREATE POLICY "Users can manage own files"
  ON uploaded_files FOR ALL USING (auth.uid() = user_id);

-- ── 7. Done! ──────────────────────────────────────────
-- Next: Create the 'ps-uploads' storage bucket in Supabase Dashboard
-- Storage → Buckets → New Bucket → name: ps-uploads → Private

-- ── 8. Developer Mock User Seeding (Required for Local Dev Sign-In) ──
INSERT INTO auth.users (id, email, raw_user_meta_data, aud, role)
VALUES (
  'd0000000-0000-0000-0000-000000000000',
  'developer@psadvisor.local',
  '{"full_name": "Dev Guest", "avatar_url": "https://api.dicebear.com/7.x/identicon/svg?seed=developer"}'::jsonb,
  'authenticated',
  'authenticated'
)
ON CONFLICT (id) DO NOTHING;

