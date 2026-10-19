-- =========================================================================
-- Spirit Contract Evo | Idle - Supabase Database Schema & RLS Setup
-- Run this script in the Supabase SQL Editor (https://supabase.com/dashboard)
-- Safe to re-run multiple times (Idempotent)
-- =========================================================================

-- 1. Profiles Table (Linked to Supabase Auth Users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  contractor_level INTEGER DEFAULT 1 NOT NULL,
  contractor_xp BIGINT DEFAULT 0 NOT NULL,
  avatar_emoji TEXT DEFAULT '🧙‍♂️',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_login TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for username lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- 2. Game Saves Table (Full Snapshot & Offline Reconciler)
CREATE TABLE IF NOT EXISTS public.game_saves (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  version INTEGER DEFAULT 2 NOT NULL,
  save_data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  checksum TEXT
);

-- Index for save timestamps
CREATE INDEX IF NOT EXISTS idx_game_saves_updated_at ON public.game_saves(updated_at DESC);

-- 3. Public Leaderboards & Asynchronous PvP Table
CREATE TABLE IF NOT EXISTS public.leaderboards (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT NOT NULL,
  avatar_emoji TEXT DEFAULT '🧙‍♂️',
  contractor_level INTEGER DEFAULT 1 NOT NULL,
  highest_stage INTEGER DEFAULT 0 NOT NULL,
  total_party_power INTEGER DEFAULT 0 NOT NULL,
  total_spirits_contracted INTEGER DEFAULT 0 NOT NULL,
  elo_rating INTEGER DEFAULT 1000 NOT NULL,
  defense_roster JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Idempotent migrations for existing deployments
ALTER TABLE public.leaderboards ADD COLUMN IF NOT EXISTS elo_rating INTEGER DEFAULT 1000 NOT NULL;
ALTER TABLE public.leaderboards ADD COLUMN IF NOT EXISTS defense_roster JSONB DEFAULT '[]'::jsonb;

-- Indexes for ranking & arena matchmaking queries
CREATE INDEX IF NOT EXISTS idx_leaderboards_highest_stage ON public.leaderboards(highest_stage DESC, total_party_power DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboards_party_power ON public.leaderboards(total_party_power DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboards_elo ON public.leaderboards(elo_rating DESC);

-- =========================================================================
-- 4. Enable Row Level Security (RLS) & Clean Drop/Recreate Policies
-- =========================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboards ENABLE ROW LEVEL SECURITY;

-- Grant schema and table access to both anon and authenticated roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO anon, authenticated;
GRANT ALL ON public.game_saves TO anon, authenticated;
GRANT ALL ON public.leaderboards TO anon, authenticated;

-- Profiles Policies
DROP POLICY IF EXISTS "Public profiles are readable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are readable by everyone" 
  ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE USING (auth.uid() = id OR auth.uid() IS NULL);

-- Game Saves Policies
DROP POLICY IF EXISTS "Users can read own save" ON public.game_saves;
CREATE POLICY "Users can read own save" 
  ON public.game_saves FOR SELECT USING (auth.uid() = user_id OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Users can insert own save" ON public.game_saves;
CREATE POLICY "Users can insert own save" 
  ON public.game_saves FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Users can update own save" ON public.game_saves;
CREATE POLICY "Users can update own save" 
  ON public.game_saves FOR UPDATE USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- Leaderboards Policies
DROP POLICY IF EXISTS "Public leaderboard is viewable by all" ON public.leaderboards;
CREATE POLICY "Public leaderboard is viewable by all" 
  ON public.leaderboards FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own leaderboard entry" ON public.leaderboards;
CREATE POLICY "Users can insert own leaderboard entry" 
  ON public.leaderboards FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Users can update own leaderboard entry" ON public.leaderboards;
CREATE POLICY "Users can update own leaderboard entry" 
  ON public.leaderboards FOR UPDATE USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- =========================================================================
-- 5. Auto-Profile Generation on Auth Sign Up Trigger
-- =========================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_username TEXT;
BEGIN
  -- Extract username from raw user metadata or fallback to email prefix
  default_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    SPLIT_PART(NEW.email, '@', 1),
    'Contractor_' || SUBSTRING(NEW.id::text FROM 1 FOR 6)
  );

  INSERT INTO public.profiles (id, username, created_at, last_login)
  VALUES (NEW.id, default_username, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================================
-- 6. Auto-Confirm Email for Auth Users (No Rate-Limit / Confirmation Lockout)
-- =========================================================================

CREATE OR REPLACE FUNCTION public.auto_confirm_new_user()
RETURNS TRIGGER AS $$
BEGIN
  NEW.email_confirmed_at := COALESCE(NEW.email_confirmed_at, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_auto_confirm ON auth.users;
CREATE TRIGGER on_auth_user_created_auto_confirm
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_confirm_new_user();

-- Auto-confirm any existing unconfirmed registered accounts
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;
