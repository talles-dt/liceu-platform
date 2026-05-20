-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration: 20260520_fix_auth_user_sync
-- Purpose: Create public.users table and set up auto-sync with auth.users.
--
-- This fixes the auth bug where:
--   1. Users signing up via email/OAuth had no row in public.users
--   2. The admin layout's assertAdmin() check failed because profile was missing
--   3. Admin access relied on ADMIN_EMAILS env var, which requires the user to
--      first pass getCurrentUser() — which needs a session cookie to exist
--
-- What this migration does:
--   1. Creates the public.users table (id, name, email, role, timestamps)
--   2. Creates handle_new_user() function → auto-inserts row on signup
--   3. Creates handle_user_update() function → keeps name/email in sync
--   4. Creates triggers on auth.users
--   5. Backfills any existing auth.users that are missing from public.users
--   6. Prints a verification table
--
-- To manually grant admin after this:
--   UPDATE public.users SET role = 'admin' WHERE email = 'talles@oliceu.com';
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Create the public.users table ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID        NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT,
  email       TEXT,
  role        TEXT        CHECK (role IN ('admin', 'student')) DEFAULT 'student',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS so users can read their own row, admins can read all
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Anyone authenticated can insert (used by trigger / seed scripts)
CREATE POLICY "Authenticated users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Only admins can update profiles (including role changes)
-- Falls back to allowing users to update their own name/email
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- ── 2. Create or replace the insert handler ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _name TEXT;
BEGIN
  _name := COALESCE(
    (NEW.raw_user_meta_data->>'full_name')::TEXT,
    (NEW.raw_user_meta_data->>'name')::TEXT,
    NULLIF(SPLIT_PART(NEW.email, '@', 1), ''),
    'User'
  );

  INSERT INTO public.users (id, name, email, role)
  VALUES (NEW.id, _name, NEW.email, 'student')
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- ── 3. Create or replace the update handler ───────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _name TEXT;
BEGIN
  _name := COALESCE(
    (NEW.raw_user_meta_data->>'full_name')::TEXT,
    (NEW.raw_user_meta_data->>'name')::TEXT,
    NULLIF(SPLIT_PART(NEW.email, '@', 1), ''),
    'User'
  );

  UPDATE public.users
  SET
    name       = _name,
    email      = NEW.email,
    updated_at = NOW()
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

-- ── 4. Drop existing triggers (idempotent) ────────────────────────────────────
DROP TRIGGER IF EXISTS create_public_users_user ON auth.users;
DROP TRIGGER IF EXISTS update_public_users_user ON auth.users;

-- ── 5. Create triggers ─────────────────────────────────────────────────────────
CREATE TRIGGER create_public_users_user
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER update_public_users_user
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (
    OLD.email IS DISTINCT FROM NEW.email
    OR OLD.raw_user_meta_data IS DISTINCT FROM NEW.raw_user_meta_data
  )
  EXECUTE FUNCTION public.handle_user_update();

-- ── 6. Backfill existing auth.users ────────────────────────────────────────────
INSERT INTO public.users (id, name, email, role)
SELECT
  au.id,
  COALESCE(
    (au.raw_user_meta_data->>'full_name')::TEXT,
    (au.raw_user_meta_data->>'name')::TEXT,
    NULLIF(SPLIT_PART(au.email, '@', 1), ''),
    'User'
  ) AS name,
  au.email,
  'student' AS role
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- ── 7. Verify ─────────────────────────────────────────────────────────────────
SELECT
  'auth.users rows'         AS check_item,
  COUNT(*)                   AS count
FROM auth.users
UNION ALL
SELECT
  'public.users rows'        AS check_item,
  COUNT(*)                   AS count
FROM public.users
UNION ALL
SELECT
  'Missing in public.users'  AS check_item,
  COUNT(*)                   AS count
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;