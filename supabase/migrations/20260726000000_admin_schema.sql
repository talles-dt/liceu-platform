-- ─── ADMIN SCHEMA: Access Grants, Partnerships, Audit Logs ───────────────────

-- Access types enum
CREATE TYPE access_grant_type AS ENUM (
  'payment',
  'early_access',
  'partnership',
  'admin_override',
  'mentorship',
  'course_bundle'
);

-- Partnership status enum
CREATE TYPE partnership_status AS ENUM (
  'pending',
  'active',
  'suspended',
  'terminated'
);

-- Audit action types
CREATE TYPE audit_action AS ENUM (
  'user_created',
  'user_updated',
  'user_deleted',
  'access_granted',
  'access_revoked',
  'partnership_created',
  'partnership_updated',
  'partnership_terminated',
  'module_access_changed',
  'course_access_changed',
  'role_changed',
  'login',
  'logout',
  'content_published',
  'content_unpublished',
  'content_updated',
  'settings_changed'
);

-- ─── USERS TABLE (extend existing) ──────────────────────────────────────────
-- Adding fields to existing users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

-- ─── ACCESS GRANTS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.access_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  grant_type access_grant_type NOT NULL,
  source_id UUID, -- reference to payment_id, partnership_id, etc.
  source_type TEXT, -- 'payment', 'partnership', 'manual'
  modules UUID[], -- array of module IDs (liceu_modules) - NULL = all modules
  courses UUID[], -- array of course IDs - NULL = all courses
  expires_at TIMESTAMPTZ,
  granted_by UUID NOT NULL REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES auth.users(id),
  revoke_reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT access_grants_check CHECK (
    (modules IS NOT NULL AND array_length(modules, 1) > 0) OR
    (courses IS NOT NULL AND array_length(courses, 1) > 0) OR
    (modules IS NULL AND courses IS NULL)
  )
);

CREATE INDEX idx_access_grants_user_id ON public.access_grants(user_id);
CREATE INDEX idx_access_grants_active ON public.access_grants(user_id, granted_at);
CREATE INDEX idx_access_grants_source ON public.access_grants(source_id, source_type);

-- ─── PARTNERSHIPS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.partnerships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  contact_email TEXT NOT NULL,
  contact_name TEXT,
  status partnership_status NOT NULL DEFAULT 'pending',
  partner_type TEXT NOT NULL, -- 'institution', 'company', 'influencer', 'affiliate', 'other'
  modules UUID[], -- modules this partnership grants access to
  courses UUID[], -- courses this partnership grants access to
  max_seats INTEGER,
  used_seats INTEGER DEFAULT 0,
  access_grant_type access_grant_type NOT NULL DEFAULT 'partnership',
  settings JSONB DEFAULT '{}'::jsonb, -- custom settings (discount %, custom branding, etc.)
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  terminated_at TIMESTAMPTZ,
  terminated_by UUID REFERENCES auth.users(id),
  termination_reason TEXT
);

CREATE INDEX idx_partnerships_status ON public.partnerships(status);
CREATE INDEX idx_partnerships_slug ON public.partnerships(slug);

-- Partnership members (users granted access via partnership)
CREATE TABLE IF NOT EXISTS public.partnership_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partnership_id UUID NOT NULL REFERENCES public.partnerships(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_grant_id UUID REFERENCES public.access_grants(id) ON DELETE SET NULL,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES auth.users(id),
  revoke_reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(partnership_id, user_id)
);

CREATE INDEX idx_partnership_members_partnership ON public.partnership_members(partnership_id);
CREATE INDEX idx_partnership_members_user ON public.partnership_members(user_id);

-- ─── AUDIT LOGS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id), -- who performed the action
  actor_email TEXT, -- denormalized for easy querying
  action audit_action NOT NULL,
  target_type TEXT, -- 'user', 'access_grant', 'partnership', 'module', 'course', 'content', 'settings'
  target_id UUID, -- ID of the affected entity
  target_identifier TEXT, -- human-readable identifier (email, name, slug)
  old_values JSONB, -- previous state
  new_values JSONB, -- new state
  metadata JSONB DEFAULT '{}'::jsonb, -- additional context (IP, user agent, etc.)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_actor ON public.audit_logs(actor_id, created_at DESC);
CREATE INDEX idx_audit_logs_target ON public.audit_logs(target_type, target_id, created_at DESC);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action, created_at DESC);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- ─── RLS POLICIES ───────────────────────────────────────────────────────────

-- Users can read their own profile
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_read_own" ON public.users;
CREATE POLICY "users_read_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Admins can read all users
DROP POLICY IF EXISTS "users_admin_read" ON public.users;
CREATE POLICY "users_admin_read" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Admins can update users
DROP POLICY IF EXISTS "users_admin_update" ON public.users;
CREATE POLICY "users_admin_update" ON public.users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Access grants: users can read their own active grants
ALTER TABLE public.access_grants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "access_grants_read_own" ON public.access_grants;
CREATE POLICY "access_grants_read_own" ON public.access_grants
  FOR SELECT USING (
    auth.uid() = user_id 
    AND revoked_at IS NULL 
    AND (expires_at IS NULL OR expires_at > NOW())
  );

-- Admins can manage all access grants
DROP POLICY IF EXISTS "access_grants_admin_all" ON public.access_grants;
CREATE POLICY "access_grants_admin_all" ON public.access_grants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Partnerships: admins only
ALTER TABLE public.partnerships ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "partnerships_admin_all" ON public.partnerships;
CREATE POLICY "partnerships_admin_all" ON public.partnerships
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Partnership members: admins can manage, users can read their own
ALTER TABLE public.partnership_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "partnership_members_read_own" ON public.partnership_members;
CREATE POLICY "partnership_members_read_own" ON public.partnership_members
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "partnership_members_admin_all" ON public.partnership_members;
CREATE POLICY "partnership_members_admin_all" ON public.partnership_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Audit logs: admins only
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "audit_logs_admin_read" ON public.audit_logs;
CREATE POLICY "audit_logs_admin_read" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- ─── TRIGGERS FOR updated_at ────────────────────────────────────────────────
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'access_grants',
    'partnerships',
    'partnership_members'
  ])
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS update_%s_updated_at ON public.%s;
      CREATE TRIGGER update_%s_updated_at
        BEFORE UPDATE ON public.%s
        FOR EACH ROW
        EXECUTE FUNCTION public.update_updated_at_column();
    ', t, t, t, t);
  END LOOP;
END $$;

-- ─── HELPER FUNCTIONS ───────────────────────────────────────────────────────

-- Check if user has access to a module
CREATE OR REPLACE FUNCTION public.user_has_module_access(p_user_id UUID, p_module_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  has_access BOOLEAN := FALSE;
BEGIN
  -- Check direct access grants
  SELECT EXISTS (
    SELECT 1 FROM public.access_grants ag
    WHERE ag.user_id = p_user_id
      AND ag.revoked_at IS NULL
      AND (ag.expires_at IS NULL OR ag.expires_at > NOW())
      AND (ag.modules IS NULL OR p_module_id = ANY(ag.modules))
  ) INTO has_access;
  
  IF has_access THEN
    RETURN TRUE;
  END IF;
  
  -- Check partnership membership
  SELECT EXISTS (
    SELECT 1 FROM public.partnership_members pm
    JOIN public.partnerships p ON p.id = pm.partnership_id
    WHERE pm.user_id = p_user_id
      AND pm.revoked_at IS NULL
      AND p.status = 'active'
      AND (p.modules IS NULL OR p_module_id = ANY(p.modules))
  ) INTO has_access;
  
  RETURN has_access;
END;
$$;

-- Check if user has access to a course
CREATE OR REPLACE FUNCTION public.user_has_course_access(p_user_id UUID, p_course_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  has_access BOOLEAN := FALSE;
BEGIN
  -- Check direct access grants
  SELECT EXISTS (
    SELECT 1 FROM public.access_grants ag
    WHERE ag.user_id = p_user_id
      AND ag.revoked_at IS NULL
      AND (ag.expires_at IS NULL OR ag.expires_at > NOW())
      AND (ag.courses IS NULL OR p_course_id = ANY(ag.courses))
  ) INTO has_access;
  
  IF has_access THEN
    RETURN TRUE;
  END IF;
  
  -- Check partnership membership
  SELECT EXISTS (
    SELECT 1 FROM public.partnership_members pm
    JOIN public.partnerships p ON p.id = pm.partnership_id
    WHERE pm.user_id = p_user_id
      AND pm.revoked_at IS NULL
      AND p.status = 'active'
      AND (p.courses IS NULL OR p_course_id = ANY(p.courses))
  ) INTO has_access;
  
  RETURN has_access;
END;
$$;

-- Grant access to user (creates access_grant + audit log)
CREATE OR REPLACE FUNCTION public.grant_user_access(
  p_user_id UUID,
  p_grant_type access_grant_type,
  p_granted_by UUID,
  p_modules UUID[] DEFAULT NULL,
  p_courses UUID[] DEFAULT NULL,
  p_expires_at TIMESTAMPTZ DEFAULT NULL,
  p_source_id UUID DEFAULT NULL,
  p_source_type TEXT DEFAULT 'manual',
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_grant_id UUID;
  v_user_email TEXT;
BEGIN
  -- Get user email for audit
  SELECT email INTO v_user_email FROM auth.users WHERE id = p_user_id;
  
  -- Create access grant
  INSERT INTO public.access_grants (
    user_id, grant_type, modules, courses, expires_at,
    source_id, source_type, granted_by, metadata
  ) VALUES (
    p_user_id, p_grant_type, p_modules, p_courses, p_expires_at,
    p_source_id, p_source_type, p_granted_by, p_metadata
  ) RETURNING id INTO v_grant_id;
  
  -- Audit log
  INSERT INTO public.audit_logs (
    actor_id, actor_email, action, target_type, target_id, target_identifier,
    new_values, metadata
  ) VALUES (
    p_granted_by,
    (SELECT email FROM auth.users WHERE id = p_granted_by),
    'access_granted',
    'access_grant',
    v_grant_id,
    v_user_email,
    jsonb_build_object(
      'user_id', p_user_id,
      'grant_type', p_grant_type,
      'modules', p_modules,
      'courses', p_courses,
      'expires_at', p_expires_at
    ),
    p_metadata
  );
  
  RETURN v_grant_id;
END;
$$;

-- Revoke access grant
CREATE OR REPLACE FUNCTION public.revoke_user_access(
  p_grant_id UUID,
  p_revoked_by UUID,
  p_reason TEXT
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_grant RECORD;
  v_user_email TEXT;
BEGIN
  SELECT * INTO v_grant FROM public.access_grants WHERE id = p_grant_id;
  
  IF v_grant IS NULL THEN
    RAISE EXCEPTION 'Access grant not found';
  END IF;
  
  SELECT email INTO v_user_email FROM auth.users WHERE id = v_grant.user_id;
  
  UPDATE public.access_grants
  SET revoked_at = NOW(), revoked_by = p_revoked_by, revoke_reason = p_reason
  WHERE id = p_grant_id;
  
  INSERT INTO public.audit_logs (
    actor_id, actor_email, action, target_type, target_id, target_identifier,
    old_values, new_values, metadata
  ) VALUES (
    p_revoked_by,
    (SELECT email FROM auth.users WHERE id = p_revoked_by),
    'access_revoked',
    'access_grant',
    p_grant_id,
    v_user_email,
    jsonb_build_object('revoked_at', v_grant.revoked_at),
    jsonb_build_object('revoked_at', NOW(), 'reason', p_reason),
    jsonb_build_object('grant_type', v_grant.grant_type)
  );
END;
$$;

-- Log audit event
CREATE OR REPLACE FUNCTION public.log_audit(
  p_action audit_action,
  p_target_type TEXT,
  p_target_id UUID,
  p_target_identifier TEXT,
  p_old_values JSONB,
  p_new_values JSONB,
  p_metadata JSONB
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_actor_id UUID;
  v_actor_email TEXT;
BEGIN
  v_actor_id := auth.uid();
  SELECT email INTO v_actor_email FROM auth.users WHERE id = v_actor_id;
  
  INSERT INTO public.audit_logs (
    actor_id, actor_email, action, target_type, target_id, target_identifier,
    old_values, new_values, metadata
  ) VALUES (
    v_actor_id, v_actor_email, p_action, p_target_type, p_target_id, p_target_identifier,
    p_old_values, p_new_values, p_metadata
  );
END;
$$;