-- Database trigger to auto-create user record in public.users when auth.users entry is created
-- Role defaults to 'student'; app-level env-based admin check handles admin authorization

-- 1. Create or replace the function that handles new auth users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(
      (NEW.raw_user_meta_data->>'full_name')::TEXT,
      (NEW.raw_user_meta_data->>'name')::TEXT,
      NEW.email
    ),
    NEW.email,
    'student'
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email;

  RETURN NEW;
END;
$$;

-- 2. Drop existing trigger if any, then create
DROP TRIGGER IF EXISTS create_public_users_user ON auth.users;

CREATE TRIGGER create_public_users_user
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- 3. Handle updates (email/meta changes)
CREATE OR REPLACE FUNCTION handle_user_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.users
  SET
    name = COALESCE(
      (NEW.raw_user_meta_data->>'full_name')::TEXT,
      (NEW.raw_user_meta_data->>'name')::TEXT,
      NEW.email
    ),
    email = NEW.email
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_public_users_user ON auth.users;

CREATE TRIGGER update_public_users_user
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (
    OLD.email IS DISTINCT FROM NEW.email OR
    OLD.raw_user_meta_data IS DISTINCT FROM NEW.raw_user_meta_data
  )
  EXECUTE FUNCTION handle_user_update();

-- 4. Backfill any existing auth users who don't have a public.users row yet
INSERT INTO public.users (id, name, email, role)
SELECT
  au.id,
  COALESCE(
    (au.raw_user_meta_data->>'full_name')::TEXT,
    (au.raw_user_meta_data->>'name')::TEXT,
    au.email
  ),
  au.email,
  'student'
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;
