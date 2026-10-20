


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."access_grant_type" AS ENUM (
    'payment',
    'early_access',
    'partnership',
    'admin_override',
    'mentorship',
    'course_bundle'
);


ALTER TYPE "public"."access_grant_type" OWNER TO "postgres";


CREATE TYPE "public"."audit_action" AS ENUM (
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


ALTER TYPE "public"."audit_action" OWNER TO "postgres";


CREATE TYPE "public"."partnership_status" AS ENUM (
    'pending',
    'active',
    'suspended',
    'terminated'
);


ALTER TYPE "public"."partnership_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_module_completion"("p_user" "uuid", "p_module" "uuid") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
declare
  lessons_done boolean;
  quiz_done boolean;
  assignment_done boolean;
begin
  -- lessons
  select bool_and(completed)
  into lessons_done
  from lesson_progress lp
  join lessons l on l.id = lp.lesson_id
  where lp.user_id = p_user and l.module_id = p_module;

  -- quiz
  select exists (
    select 1 from quiz_attempts
    where user_id = p_user
    and quiz_id in (select id from quizzes where module_id = p_module)
    and passed = true
  ) into quiz_done;

  -- assignment
  select exists (
    select 1 from assignment_submissions
    where user_id = p_user
    and assignment_id in (select id from assignments where module_id = p_module)
    and status = 'approved'
  ) into assignment_done;

  return lessons_done and quiz_done and assignment_done;
end;
$$;


ALTER FUNCTION "public"."check_module_completion"("p_user" "uuid", "p_module" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."complete_module"("p_user" "uuid", "p_module" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
begin
  if check_module_completion(p_user, p_module) then
    update module_progress
    set completed = true
    where user_id = p_user and module_id = p_module;
  end if;
end;
$$;


ALTER FUNCTION "public"."complete_module"("p_user" "uuid", "p_module" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."grant_user_access"("p_user_id" "uuid", "p_grant_type" "public"."access_grant_type", "p_granted_by" "uuid", "p_modules" "uuid"[] DEFAULT NULL::"uuid"[], "p_courses" "uuid"[] DEFAULT NULL::"uuid"[], "p_expires_at" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_source_id" "uuid" DEFAULT NULL::"uuid", "p_source_type" "text" DEFAULT 'manual'::"text", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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


ALTER FUNCTION "public"."grant_user_access"("p_user_id" "uuid", "p_grant_type" "public"."access_grant_type", "p_granted_by" "uuid", "p_modules" "uuid"[], "p_courses" "uuid"[], "p_expires_at" timestamp with time zone, "p_source_id" "uuid", "p_source_type" "text", "p_metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_user_update"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."handle_user_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_audit"("p_action" "public"."audit_action", "p_target_type" "text", "p_target_id" "uuid", "p_target_identifier" "text", "p_old_values" "jsonb", "p_new_values" "jsonb", "p_metadata" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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


ALTER FUNCTION "public"."log_audit"("p_action" "public"."audit_action", "p_target_type" "text", "p_target_id" "uuid", "p_target_identifier" "text", "p_old_values" "jsonb", "p_new_values" "jsonb", "p_metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."revoke_user_access"("p_grant_id" "uuid", "p_revoked_by" "uuid", "p_reason" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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


ALTER FUNCTION "public"."revoke_user_access"("p_grant_id" "uuid", "p_revoked_by" "uuid", "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;


ALTER FUNCTION "public"."updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_has_course_access"("p_user_id" "uuid", "p_course_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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


ALTER FUNCTION "public"."user_has_course_access"("p_user_id" "uuid", "p_course_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_has_module_access"("p_user_id" "uuid", "p_module_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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


ALTER FUNCTION "public"."user_has_module_access"("p_user_id" "uuid", "p_module_id" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."access_grants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "grant_type" "public"."access_grant_type" NOT NULL,
    "source_id" "uuid",
    "source_type" "text",
    "modules" "uuid"[],
    "courses" "uuid"[],
    "expires_at" timestamp with time zone,
    "granted_by" "uuid" NOT NULL,
    "granted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "revoked_at" timestamp with time zone,
    "revoked_by" "uuid",
    "revoke_reason" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "access_grants_check" CHECK (((("modules" IS NOT NULL) AND ("array_length"("modules", 1) > 0)) OR (("courses" IS NOT NULL) AND ("array_length"("courses", 1) > 0)) OR (("modules" IS NULL) AND ("courses" IS NULL))))
);


ALTER TABLE "public"."access_grants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_access_logs" (
    "id" bigint NOT NULL,
    "path" "text" NOT NULL,
    "timestamp" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid",
    "ip" "text",
    "user_agent" "text",
    "action" "text" NOT NULL,
    "metadata" "jsonb"
);


ALTER TABLE "public"."admin_access_logs" OWNER TO "postgres";


ALTER TABLE "public"."admin_access_logs" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."admin_access_logs_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."admin_login_attempts" (
    "id" bigint NOT NULL,
    "email" "text" NOT NULL,
    "timestamp" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ip" "text",
    "user_agent" "text",
    "success" boolean DEFAULT false,
    "metadata" "jsonb"
);


ALTER TABLE "public"."admin_login_attempts" OWNER TO "postgres";


ALTER TABLE "public"."admin_login_attempts" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."admin_login_attempts_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."assignment_submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "assignment_id" "uuid",
    "content" "text",
    "score" integer,
    "feedback" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "kind" "text" DEFAULT 'assignment'::"text" NOT NULL,
    "file_url" "text",
    "reviewer_notes" "text",
    CONSTRAINT "assignment_submissions_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'revision'::"text"])))
);


ALTER TABLE "public"."assignment_submissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "module_id" "uuid",
    "prompt" "text" NOT NULL
);


ALTER TABLE "public"."assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "actor_id" "uuid",
    "actor_email" "text",
    "action" "public"."audit_action" NOT NULL,
    "target_type" "text",
    "target_id" "uuid",
    "target_identifier" "text",
    "old_values" "jsonb",
    "new_values" "jsonb",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."courses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text"
);


ALTER TABLE "public"."courses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."diagnostic_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "user_id" "uuid",
    "answers" "jsonb" NOT NULL,
    "scores" "jsonb" NOT NULL,
    "archetype_key" "text" NOT NULL,
    "archetype_name" "text" NOT NULL,
    "ethos_level" "text",
    "share_token" "text" DEFAULT "encode"("extensions"."gen_random_bytes"(12), 'hex'::"text"),
    "shared_at" timestamp with time zone,
    "converted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."diagnostic_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."flashcard_progress" (
    "user_id" "uuid" NOT NULL,
    "card_id" "uuid" NOT NULL,
    "easiness" double precision DEFAULT 2.5,
    "interval_days" integer DEFAULT 1,
    "repetitions" integer DEFAULT 0,
    "next_review" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."flashcard_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."flashcard_sets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "module_id" "uuid",
    "title" "text" NOT NULL
);


ALTER TABLE "public"."flashcard_sets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."flashcards" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "set_id" "uuid",
    "front" "text" NOT NULL,
    "back" "text" NOT NULL,
    "order_index" integer DEFAULT 0
);


ALTER TABLE "public"."flashcards" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lesson_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "lesson_id" "uuid",
    "completed" boolean DEFAULT false
);


ALTER TABLE "public"."lesson_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lesson_quiz_questions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lesson_id" "uuid",
    "question" "text" NOT NULL,
    "options" "jsonb" NOT NULL,
    "correct_answer" "text" NOT NULL,
    "order_index" integer DEFAULT 0
);


ALTER TABLE "public"."lesson_quiz_questions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lessons" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "module_id" "uuid",
    "title" "text",
    "type" "text",
    "content" "text",
    "order_index" integer,
    "cloudflare_stream_id" "text",
    CONSTRAINT "lessons_type_check" CHECK (("type" = ANY (ARRAY['text'::"text", 'video'::"text"])))
);


ALTER TABLE "public"."lessons" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."liceu_exercises" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lesson_id" "uuid" NOT NULL,
    "exercise_type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "prompt_markdown" "text" NOT NULL,
    "prompt_html" "text",
    "expected_answer" "jsonb",
    "target_theory_section" "uuid",
    "rhetorical_dimension" "text",
    "archetype_keys" "text"[] DEFAULT '{}'::"text"[],
    "difficulty_tier" integer DEFAULT 1 NOT NULL,
    "estimated_minutes" integer,
    "is_published" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "liceu_exercises_difficulty_tier_check" CHECK ((("difficulty_tier" >= 1) AND ("difficulty_tier" <= 5))),
    CONSTRAINT "liceu_exercises_exercise_type_check" CHECK (("exercise_type" = ANY (ARRAY['identification'::"text", 'production'::"text", 'error_correction'::"text", 'case_analysis'::"text"])))
);


ALTER TABLE "public"."liceu_exercises" OWNER TO "postgres";


COMMENT ON TABLE "public"."liceu_exercises" IS 'Module C: Application exercises (identification, production, error correction, case analysis)';



COMMENT ON COLUMN "public"."liceu_exercises"."exercise_type" IS 'identification | production | error_correction | case_analysis';



CREATE TABLE IF NOT EXISTS "public"."liceu_flashcards" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lesson_id" "uuid" NOT NULL,
    "theoretical_content_id" "uuid",
    "front" "text" NOT NULL,
    "back" "text" NOT NULL,
    "concept" "text" NOT NULL,
    "rhetorical_dimension" "text",
    "archetype_keys" "text"[] DEFAULT '{}'::"text"[],
    "difficulty_tier" integer DEFAULT 1 NOT NULL,
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "source_location" "text",
    "is_published" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "liceu_flashcards_difficulty_tier_check" CHECK ((("difficulty_tier" >= 1) AND ("difficulty_tier" <= 5)))
);


ALTER TABLE "public"."liceu_flashcards" OWNER TO "postgres";


COMMENT ON TABLE "public"."liceu_flashcards" IS 'Module B: Flashcards strictly derived from theoretical_content, one concept per card';



COMMENT ON COLUMN "public"."liceu_flashcards"."tags" IS 'Taxonomy tags: inventio, dispositio, elocutio, memoria, ethos, pathos, kairos';



CREATE TABLE IF NOT EXISTS "public"."liceu_learner_progression" (
    "user_id" "uuid" NOT NULL,
    "current_module_id" "uuid",
    "current_lesson_id" "uuid",
    "completed_lessons" "uuid"[] DEFAULT '{}'::"uuid"[],
    "completed_exercises" "uuid"[] DEFAULT '{}'::"uuid"[],
    "completed_simulations" "uuid"[] DEFAULT '{}'::"uuid"[],
    "flashcard_review_streak" integer DEFAULT 0,
    "last_flashcard_review_at" timestamp with time zone,
    "diagnostic_archetype_keys" "text"[] DEFAULT '{}'::"text"[],
    "diagnostic_dimension_scores" "jsonb" DEFAULT '{}'::"jsonb",
    "maturity_stage" "text" DEFAULT 'novice'::"text" NOT NULL,
    "total_study_minutes" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "liceu_learner_progression_maturity_stage_check" CHECK (("maturity_stage" = ANY (ARRAY['novice'::"text", 'apprentice'::"text", 'journeyman'::"text", 'master'::"text", 'ciceronian'::"text"])))
);


ALTER TABLE "public"."liceu_learner_progression" OWNER TO "postgres";


COMMENT ON TABLE "public"."liceu_learner_progression" IS 'Per-user Liceu progression tracking (complements lexio learner_progression)';



CREATE TABLE IF NOT EXISTS "public"."liceu_lessons" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "module_id" "uuid" NOT NULL,
    "code" "text" NOT NULL,
    "title" "text" NOT NULL,
    "subtitle" "text",
    "learning_objective" "text" NOT NULL,
    "rhetorical_dimension" "text",
    "archetype_keys" "text"[] DEFAULT '{}'::"text"[],
    "difficulty_tier" integer DEFAULT 1 NOT NULL,
    "estimated_minutes" integer,
    "prerequisites" "uuid"[] DEFAULT '{}'::"uuid"[],
    "order_index" integer NOT NULL,
    "is_published" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "liceu_lessons_difficulty_tier_check" CHECK ((("difficulty_tier" >= 1) AND ("difficulty_tier" <= 5)))
);


ALTER TABLE "public"."liceu_lessons" OWNER TO "postgres";


COMMENT ON TABLE "public"."liceu_lessons" IS 'Individual lessons within modules (36 chapters from As Armas da Palavra)';



COMMENT ON COLUMN "public"."liceu_lessons"."rhetorical_dimension" IS 'One of 9 diagnostic dimensions from the 36-question quiz';



COMMENT ON COLUMN "public"."liceu_lessons"."archetype_keys" IS 'Related archetype(s) from the 10-archetype system';



CREATE TABLE IF NOT EXISTS "public"."liceu_modules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "title" "text" NOT NULL,
    "subtitle" "text",
    "description" "text",
    "order_index" integer NOT NULL,
    "estimated_hours" integer,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."liceu_modules" OWNER TO "postgres";


COMMENT ON TABLE "public"."liceu_modules" IS 'Liceu Underground rhetorical curriculum modules (5 parts: Fundamentos, Inventio, Dispositio, Elocutio, Memória/Hábito/Aplicação)';



CREATE TABLE IF NOT EXISTS "public"."liceu_rhetorical_excerpts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lesson_id" "uuid" NOT NULL,
    "author" "text" NOT NULL,
    "work" "text" NOT NULL,
    "book" "text",
    "section" "text",
    "quote" "text",
    "paraphrase" "text" NOT NULL,
    "concept_illustrated" "text" NOT NULL,
    "language" "text" DEFAULT 'la'::"text" NOT NULL,
    "translation_ref" "text",
    "is_published" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."liceu_rhetorical_excerpts" OWNER TO "postgres";


COMMENT ON TABLE "public"."liceu_rhetorical_excerpts" IS 'Module E: Classical excerpts (Cicero, Quintilian, Church Fathers) with ≤15 word quotes + precise citations';



COMMENT ON COLUMN "public"."liceu_rhetorical_excerpts"."quote" IS '≤15 words direct quote. Max 1 per source. Prefer paraphrase + location.';



COMMENT ON COLUMN "public"."liceu_rhetorical_excerpts"."translation_ref" IS 'Licensed translation reference (e.g. Loeb 1942) for full excerpt lookup';



CREATE TABLE IF NOT EXISTS "public"."liceu_simulations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "module_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "scenario_markdown" "text" NOT NULL,
    "simulation_constraint" "text" NOT NULL,
    "success_criteria" "jsonb" NOT NULL,
    "simulation_type" "text" NOT NULL,
    "related_lessons" "uuid"[] DEFAULT '{}'::"uuid"[],
    "rhetorical_dimensions" "text"[] DEFAULT '{}'::"text"[],
    "archetype_keys" "text"[] DEFAULT '{}'::"text"[],
    "difficulty_tier" integer DEFAULT 3 NOT NULL,
    "estimated_minutes" integer,
    "is_published" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "liceu_simulations_difficulty_tier_check" CHECK ((("difficulty_tier" >= 1) AND ("difficulty_tier" <= 5))),
    CONSTRAINT "liceu_simulations_simulation_type_check" CHECK (("simulation_type" = ANY (ARRAY['hostile_interruption'::"text", 'improvised_objection'::"text", 'unpopular_position'::"text", 'impromptu_occasion'::"text", 'crisis_communication'::"text"])))
);


ALTER TABLE "public"."liceu_simulations" OWNER TO "postgres";


COMMENT ON TABLE "public"."liceu_simulations" IS 'Module D: High-cognitive-load simulations (controversiae/suasoriae for modern high-stakes scenarios)';



COMMENT ON COLUMN "public"."liceu_simulations"."simulation_type" IS 'hostile_interruption | improvised_objection | unpopular_position | impromptu_occasion | crisis_communication';



CREATE TABLE IF NOT EXISTS "public"."liceu_theoretical_content" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lesson_id" "uuid" NOT NULL,
    "section_order" integer NOT NULL,
    "title" "text" NOT NULL,
    "content_markdown" "text" NOT NULL,
    "content_html" "text",
    "key_concepts" "text"[] DEFAULT '{}'::"text"[],
    "rhetorical_references" "jsonb" DEFAULT '[]'::"jsonb",
    "word_count" integer GENERATED ALWAYS AS ((("length"("content_markdown") - "length"("replace"("content_markdown", ' '::"text", ''::"text"))) + 1)) STORED,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."liceu_theoretical_content" OWNER TO "postgres";


COMMENT ON TABLE "public"."liceu_theoretical_content" IS 'Module A: Theoretical body in ciceronian voice, structured for flashcard extraction';



COMMENT ON COLUMN "public"."liceu_theoretical_content"."rhetorical_references" IS 'Array of {author, work, book, section, quote_key} for classical sources cited';



CREATE TABLE IF NOT EXISTS "public"."mentoring_applications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "user_id" "uuid",
    "status" "text" DEFAULT 'pending_interview'::"text" NOT NULL,
    "interview_stripe_session_id" "text",
    "program_stripe_session_id" "text",
    "stripe_coupon_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."mentoring_applications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mentorship_bookings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "session_id" "uuid",
    "scheduled_at" timestamp without time zone
);


ALTER TABLE "public"."mentorship_bookings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mentorship_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "module_required" "uuid",
    "session_number" integer
);


ALTER TABLE "public"."mentorship_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mentorship_waitlist" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "position" integer,
    "status" "text" DEFAULT 'waiting'::"text"
);


ALTER TABLE "public"."mentorship_waitlist" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."module_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "module_id" "uuid",
    "assignment_prompt" "text" NOT NULL,
    "speech_prompt" "text" NOT NULL
);


ALTER TABLE "public"."module_assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."module_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "module_id" "uuid",
    "lessons_completed" boolean DEFAULT false,
    "quiz_passed" boolean DEFAULT false,
    "assignment_approved" boolean DEFAULT false,
    "completed" boolean DEFAULT false,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone
);


ALTER TABLE "public"."module_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."module_texts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "module_id" "uuid",
    "title" "text" NOT NULL,
    "author" "text",
    "content" "text" NOT NULL
);


ALTER TABLE "public"."module_texts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."modules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "course_id" "uuid",
    "title" "text" NOT NULL,
    "order_index" integer NOT NULL
);


ALTER TABLE "public"."modules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "body" "text" NOT NULL,
    "link" "text",
    "read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."partnership_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "partnership_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "access_grant_id" "uuid",
    "invited_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "accepted_at" timestamp with time zone,
    "revoked_at" timestamp with time zone,
    "revoked_by" "uuid",
    "revoke_reason" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."partnership_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."partnerships" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "contact_email" "text" NOT NULL,
    "contact_name" "text",
    "status" "public"."partnership_status" DEFAULT 'pending'::"public"."partnership_status" NOT NULL,
    "partner_type" "text" NOT NULL,
    "modules" "uuid"[],
    "courses" "uuid"[],
    "max_seats" integer,
    "used_seats" integer DEFAULT 0,
    "access_grant_type" "public"."access_grant_type" DEFAULT 'partnership'::"public"."access_grant_type" NOT NULL,
    "settings" "jsonb" DEFAULT '{}'::"jsonb",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "activated_at" timestamp with time zone,
    "terminated_at" timestamp with time zone,
    "terminated_by" "uuid",
    "termination_reason" "text"
);


ALTER TABLE "public"."partnerships" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pending_purchases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "kind" "text" NOT NULL,
    "course_id" "text" NOT NULL,
    "stripe_session_id" "text" NOT NULL,
    "claimed" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."pending_purchases" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "type" "text",
    "price" integer NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"(),
    CONSTRAINT "products_type_check" CHECK (("type" = ANY (ARRAY['apostila'::"text", 'video'::"text", 'mentoria'::"text"])))
);


ALTER TABLE "public"."products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "role" "text" DEFAULT 'student'::"text"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."purchases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "product_id" "uuid",
    "status" "text" DEFAULT 'completed'::"text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "stripe_session_id" "text",
    "customer_id" "text",
    CONSTRAINT "check_status" CHECK (("status" = ANY (ARRAY['pending'::"text", 'claimed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."purchases" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quiz_attempts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "quiz_id" "uuid",
    "score" integer,
    "passed" boolean,
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."quiz_attempts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quiz_questions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "quiz_id" "uuid",
    "question" "text" NOT NULL,
    "options" "jsonb" NOT NULL,
    "correct_answer" "text" NOT NULL
);


ALTER TABLE "public"."quiz_questions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quizzes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "module_id" "uuid"
);


ALTER TABLE "public"."quizzes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "name" "text",
    "email" "text",
    "role" "text" DEFAULT 'student'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "email_verified" boolean DEFAULT false,
    "last_login_at" timestamp with time zone,
    "login_count" integer DEFAULT 0,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "suspended_at" timestamp with time zone,
    "suspended_by" "uuid",
    "suspension_reason" "text",
    CONSTRAINT "users_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'student'::"text"])))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "public"."access_grants"
    ADD CONSTRAINT "access_grants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_access_logs"
    ADD CONSTRAINT "admin_access_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_login_attempts"
    ADD CONSTRAINT "admin_login_attempts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assignment_submissions"
    ADD CONSTRAINT "assignment_submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assignments"
    ADD CONSTRAINT "assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."diagnostic_sessions"
    ADD CONSTRAINT "diagnostic_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."diagnostic_sessions"
    ADD CONSTRAINT "diagnostic_sessions_share_token_key" UNIQUE ("share_token");



ALTER TABLE ONLY "public"."flashcard_progress"
    ADD CONSTRAINT "flashcard_progress_pkey" PRIMARY KEY ("user_id", "card_id");



ALTER TABLE ONLY "public"."flashcard_sets"
    ADD CONSTRAINT "flashcard_sets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."flashcards"
    ADD CONSTRAINT "flashcards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lesson_progress"
    ADD CONSTRAINT "lesson_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lesson_progress"
    ADD CONSTRAINT "lesson_progress_user_id_lesson_id_key" UNIQUE ("user_id", "lesson_id");



ALTER TABLE ONLY "public"."lesson_quiz_questions"
    ADD CONSTRAINT "lesson_quiz_questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lessons"
    ADD CONSTRAINT "lessons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."liceu_exercises"
    ADD CONSTRAINT "liceu_exercises_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."liceu_flashcards"
    ADD CONSTRAINT "liceu_flashcards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."liceu_learner_progression"
    ADD CONSTRAINT "liceu_learner_progression_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."liceu_lessons"
    ADD CONSTRAINT "liceu_lessons_module_id_code_key" UNIQUE ("module_id", "code");



ALTER TABLE ONLY "public"."liceu_lessons"
    ADD CONSTRAINT "liceu_lessons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."liceu_modules"
    ADD CONSTRAINT "liceu_modules_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."liceu_modules"
    ADD CONSTRAINT "liceu_modules_order_index_key" UNIQUE ("order_index");



ALTER TABLE ONLY "public"."liceu_modules"
    ADD CONSTRAINT "liceu_modules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."liceu_rhetorical_excerpts"
    ADD CONSTRAINT "liceu_rhetorical_excerpts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."liceu_simulations"
    ADD CONSTRAINT "liceu_simulations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."liceu_theoretical_content"
    ADD CONSTRAINT "liceu_theoretical_content_lesson_id_section_order_key" UNIQUE ("lesson_id", "section_order");



ALTER TABLE ONLY "public"."liceu_theoretical_content"
    ADD CONSTRAINT "liceu_theoretical_content_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mentoring_applications"
    ADD CONSTRAINT "mentoring_applications_interview_stripe_session_id_key" UNIQUE ("interview_stripe_session_id");



ALTER TABLE ONLY "public"."mentoring_applications"
    ADD CONSTRAINT "mentoring_applications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mentoring_applications"
    ADD CONSTRAINT "mentoring_applications_program_stripe_session_id_key" UNIQUE ("program_stripe_session_id");



ALTER TABLE ONLY "public"."mentorship_bookings"
    ADD CONSTRAINT "mentorship_bookings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mentorship_sessions"
    ADD CONSTRAINT "mentorship_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mentorship_waitlist"
    ADD CONSTRAINT "mentorship_waitlist_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."module_assignments"
    ADD CONSTRAINT "module_assignments_module_id_key" UNIQUE ("module_id");



ALTER TABLE ONLY "public"."module_assignments"
    ADD CONSTRAINT "module_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."module_progress"
    ADD CONSTRAINT "module_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."module_progress"
    ADD CONSTRAINT "module_progress_user_id_module_id_key" UNIQUE ("user_id", "module_id");



ALTER TABLE ONLY "public"."module_texts"
    ADD CONSTRAINT "module_texts_module_id_key" UNIQUE ("module_id");



ALTER TABLE ONLY "public"."module_texts"
    ADD CONSTRAINT "module_texts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."modules"
    ADD CONSTRAINT "modules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."partnership_members"
    ADD CONSTRAINT "partnership_members_partnership_id_user_id_key" UNIQUE ("partnership_id", "user_id");



ALTER TABLE ONLY "public"."partnership_members"
    ADD CONSTRAINT "partnership_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."partnerships"
    ADD CONSTRAINT "partnerships_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."partnerships"
    ADD CONSTRAINT "partnerships_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."pending_purchases"
    ADD CONSTRAINT "pending_purchases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pending_purchases"
    ADD CONSTRAINT "pending_purchases_stripe_session_id_key" UNIQUE ("stripe_session_id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchases"
    ADD CONSTRAINT "purchases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchases"
    ADD CONSTRAINT "purchases_stripe_session_id_key" UNIQUE ("stripe_session_id");



ALTER TABLE ONLY "public"."quiz_attempts"
    ADD CONSTRAINT "quiz_attempts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quiz_questions"
    ADD CONSTRAINT "quiz_questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quizzes"
    ADD CONSTRAINT "quizzes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchases"
    ADD CONSTRAINT "unique_purchase" UNIQUE ("stripe_session_id", "customer_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_access_grants_active" ON "public"."access_grants" USING "btree" ("user_id", "granted_at");



CREATE INDEX "idx_access_grants_source" ON "public"."access_grants" USING "btree" ("source_id", "source_type");



CREATE INDEX "idx_access_grants_user_id" ON "public"."access_grants" USING "btree" ("user_id");



CREATE INDEX "idx_admin_access_logs_path" ON "public"."admin_access_logs" USING "btree" ("path");



CREATE INDEX "idx_admin_access_logs_timestamp" ON "public"."admin_access_logs" USING "btree" ("timestamp");



CREATE INDEX "idx_admin_access_logs_user_id" ON "public"."admin_access_logs" USING "btree" ("user_id");



CREATE INDEX "idx_admin_login_attempts_email" ON "public"."admin_login_attempts" USING "btree" ("email");



CREATE INDEX "idx_admin_login_attempts_timestamp" ON "public"."admin_login_attempts" USING "btree" ("timestamp");



CREATE INDEX "idx_audit_logs_action" ON "public"."audit_logs" USING "btree" ("action", "created_at" DESC);



CREATE INDEX "idx_audit_logs_actor" ON "public"."audit_logs" USING "btree" ("actor_id", "created_at" DESC);



CREATE INDEX "idx_audit_logs_created" ON "public"."audit_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_audit_logs_target" ON "public"."audit_logs" USING "btree" ("target_type", "target_id", "created_at" DESC);



CREATE INDEX "idx_diag_archetype" ON "public"."diagnostic_sessions" USING "btree" ("archetype_key");



CREATE INDEX "idx_diag_email" ON "public"."diagnostic_sessions" USING "btree" ("email");



CREATE INDEX "idx_diag_token" ON "public"."diagnostic_sessions" USING "btree" ("share_token");



CREATE INDEX "idx_lesson_progress_user" ON "public"."lesson_progress" USING "btree" ("user_id");



CREATE INDEX "idx_liceu_excerpts_author" ON "public"."liceu_rhetorical_excerpts" USING "btree" ("author");



CREATE INDEX "idx_liceu_excerpts_concept" ON "public"."liceu_rhetorical_excerpts" USING "btree" ("concept_illustrated");



CREATE INDEX "idx_liceu_excerpts_lesson" ON "public"."liceu_rhetorical_excerpts" USING "btree" ("lesson_id");



CREATE INDEX "idx_liceu_excerpts_published" ON "public"."liceu_rhetorical_excerpts" USING "btree" ("is_published") WHERE ("is_published" = true);



CREATE INDEX "idx_liceu_exercises_lesson" ON "public"."liceu_exercises" USING "btree" ("lesson_id");



CREATE INDEX "idx_liceu_exercises_published" ON "public"."liceu_exercises" USING "btree" ("is_published") WHERE ("is_published" = true);



CREATE INDEX "idx_liceu_exercises_type" ON "public"."liceu_exercises" USING "btree" ("exercise_type");



CREATE INDEX "idx_liceu_flashcards_archetype" ON "public"."liceu_flashcards" USING "gin" ("archetype_keys");



CREATE INDEX "idx_liceu_flashcards_dimension" ON "public"."liceu_flashcards" USING "btree" ("rhetorical_dimension");



CREATE INDEX "idx_liceu_flashcards_lesson" ON "public"."liceu_flashcards" USING "btree" ("lesson_id");



CREATE INDEX "idx_liceu_flashcards_published" ON "public"."liceu_flashcards" USING "btree" ("is_published") WHERE ("is_published" = true);



CREATE INDEX "idx_liceu_flashcards_tags" ON "public"."liceu_flashcards" USING "gin" ("tags");



CREATE INDEX "idx_liceu_lessons_module" ON "public"."liceu_lessons" USING "btree" ("module_id");



CREATE INDEX "idx_liceu_lessons_order" ON "public"."liceu_lessons" USING "btree" ("module_id", "order_index");



CREATE INDEX "idx_liceu_lessons_published" ON "public"."liceu_lessons" USING "btree" ("is_published") WHERE ("is_published" = true);



CREATE INDEX "idx_liceu_modules_active" ON "public"."liceu_modules" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_liceu_modules_order" ON "public"."liceu_modules" USING "btree" ("order_index");



CREATE INDEX "idx_liceu_progression_stage" ON "public"."liceu_learner_progression" USING "btree" ("maturity_stage");



CREATE INDEX "idx_liceu_simulations_module" ON "public"."liceu_simulations" USING "btree" ("module_id");



CREATE INDEX "idx_liceu_simulations_published" ON "public"."liceu_simulations" USING "btree" ("is_published") WHERE ("is_published" = true);



CREATE INDEX "idx_liceu_simulations_type" ON "public"."liceu_simulations" USING "btree" ("simulation_type");



CREATE INDEX "idx_liceu_theory_concepts" ON "public"."liceu_theoretical_content" USING "gin" ("key_concepts");



CREATE INDEX "idx_liceu_theory_lesson" ON "public"."liceu_theoretical_content" USING "btree" ("lesson_id");



CREATE INDEX "idx_module_progress_user" ON "public"."module_progress" USING "btree" ("user_id");



CREATE INDEX "idx_notifications_user_read" ON "public"."notifications" USING "btree" ("user_id", "read" DESC, "created_at" DESC);



CREATE INDEX "idx_partnership_members_partnership" ON "public"."partnership_members" USING "btree" ("partnership_id");



CREATE INDEX "idx_partnership_members_user" ON "public"."partnership_members" USING "btree" ("user_id");



CREATE INDEX "idx_partnerships_slug" ON "public"."partnerships" USING "btree" ("slug");



CREATE INDEX "idx_partnerships_status" ON "public"."partnerships" USING "btree" ("status");



CREATE INDEX "idx_quiz_attempts_user" ON "public"."quiz_attempts" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "set_liceu_exercises_updated_at" BEFORE UPDATE ON "public"."liceu_exercises" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_liceu_flashcards_updated_at" BEFORE UPDATE ON "public"."liceu_flashcards" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_liceu_learner_progression_updated_at" BEFORE UPDATE ON "public"."liceu_learner_progression" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_liceu_lessons_updated_at" BEFORE UPDATE ON "public"."liceu_lessons" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_liceu_modules_updated_at" BEFORE UPDATE ON "public"."liceu_modules" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_liceu_rhetorical_excerpts_updated_at" BEFORE UPDATE ON "public"."liceu_rhetorical_excerpts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_liceu_simulations_updated_at" BEFORE UPDATE ON "public"."liceu_simulations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_liceu_theoretical_content_updated_at" BEFORE UPDATE ON "public"."liceu_theoretical_content" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_access_grants_updated_at" BEFORE UPDATE ON "public"."access_grants" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_partnership_members_updated_at" BEFORE UPDATE ON "public"."partnership_members" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_partnerships_updated_at" BEFORE UPDATE ON "public"."partnerships" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."access_grants"
    ADD CONSTRAINT "access_grants_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."access_grants"
    ADD CONSTRAINT "access_grants_revoked_by_fkey" FOREIGN KEY ("revoked_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."access_grants"
    ADD CONSTRAINT "access_grants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."admin_access_logs"
    ADD CONSTRAINT "admin_access_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."assignment_submissions"
    ADD CONSTRAINT "assignment_submissions_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "public"."assignments"("id");



ALTER TABLE ONLY "public"."assignment_submissions"
    ADD CONSTRAINT "assignment_submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."assignments"
    ADD CONSTRAINT "assignments_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."diagnostic_sessions"
    ADD CONSTRAINT "diagnostic_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."flashcard_progress"
    ADD CONSTRAINT "flashcard_progress_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "public"."flashcards"("id");



ALTER TABLE ONLY "public"."flashcard_progress"
    ADD CONSTRAINT "flashcard_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."flashcard_sets"
    ADD CONSTRAINT "flashcard_sets_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id");



ALTER TABLE ONLY "public"."flashcards"
    ADD CONSTRAINT "flashcards_set_id_fkey" FOREIGN KEY ("set_id") REFERENCES "public"."flashcard_sets"("id");



ALTER TABLE ONLY "public"."lesson_progress"
    ADD CONSTRAINT "lesson_progress_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id");



ALTER TABLE ONLY "public"."lesson_progress"
    ADD CONSTRAINT "lesson_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."lesson_quiz_questions"
    ADD CONSTRAINT "lesson_quiz_questions_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lessons"
    ADD CONSTRAINT "lessons_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."liceu_exercises"
    ADD CONSTRAINT "liceu_exercises_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."liceu_lessons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."liceu_exercises"
    ADD CONSTRAINT "liceu_exercises_target_theory_section_fkey" FOREIGN KEY ("target_theory_section") REFERENCES "public"."liceu_theoretical_content"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."liceu_flashcards"
    ADD CONSTRAINT "liceu_flashcards_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."liceu_lessons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."liceu_flashcards"
    ADD CONSTRAINT "liceu_flashcards_theoretical_content_id_fkey" FOREIGN KEY ("theoretical_content_id") REFERENCES "public"."liceu_theoretical_content"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."liceu_learner_progression"
    ADD CONSTRAINT "liceu_learner_progression_current_lesson_id_fkey" FOREIGN KEY ("current_lesson_id") REFERENCES "public"."liceu_lessons"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."liceu_learner_progression"
    ADD CONSTRAINT "liceu_learner_progression_current_module_id_fkey" FOREIGN KEY ("current_module_id") REFERENCES "public"."liceu_modules"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."liceu_learner_progression"
    ADD CONSTRAINT "liceu_learner_progression_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."liceu_lessons"
    ADD CONSTRAINT "liceu_lessons_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."liceu_modules"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."liceu_rhetorical_excerpts"
    ADD CONSTRAINT "liceu_rhetorical_excerpts_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."liceu_lessons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."liceu_simulations"
    ADD CONSTRAINT "liceu_simulations_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."liceu_modules"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."liceu_theoretical_content"
    ADD CONSTRAINT "liceu_theoretical_content_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."liceu_lessons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mentoring_applications"
    ADD CONSTRAINT "mentoring_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."mentorship_bookings"
    ADD CONSTRAINT "mentorship_bookings_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."mentorship_sessions"("id");



ALTER TABLE ONLY "public"."mentorship_bookings"
    ADD CONSTRAINT "mentorship_bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."mentorship_sessions"
    ADD CONSTRAINT "mentorship_sessions_module_required_fkey" FOREIGN KEY ("module_required") REFERENCES "public"."modules"("id");



ALTER TABLE ONLY "public"."mentorship_waitlist"
    ADD CONSTRAINT "mentorship_waitlist_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."module_assignments"
    ADD CONSTRAINT "module_assignments_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id");



ALTER TABLE ONLY "public"."module_progress"
    ADD CONSTRAINT "module_progress_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id");



ALTER TABLE ONLY "public"."module_progress"
    ADD CONSTRAINT "module_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."module_texts"
    ADD CONSTRAINT "module_texts_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id");



ALTER TABLE ONLY "public"."modules"
    ADD CONSTRAINT "modules_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."partnership_members"
    ADD CONSTRAINT "partnership_members_access_grant_id_fkey" FOREIGN KEY ("access_grant_id") REFERENCES "public"."access_grants"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."partnership_members"
    ADD CONSTRAINT "partnership_members_partnership_id_fkey" FOREIGN KEY ("partnership_id") REFERENCES "public"."partnerships"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."partnership_members"
    ADD CONSTRAINT "partnership_members_revoked_by_fkey" FOREIGN KEY ("revoked_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."partnership_members"
    ADD CONSTRAINT "partnership_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."partnerships"
    ADD CONSTRAINT "partnerships_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."partnerships"
    ADD CONSTRAINT "partnerships_terminated_by_fkey" FOREIGN KEY ("terminated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchases"
    ADD CONSTRAINT "purchases_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id");



ALTER TABLE ONLY "public"."purchases"
    ADD CONSTRAINT "purchases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."quiz_attempts"
    ADD CONSTRAINT "quiz_attempts_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id");



ALTER TABLE ONLY "public"."quiz_attempts"
    ADD CONSTRAINT "quiz_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."quiz_questions"
    ADD CONSTRAINT "quiz_questions_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quizzes"
    ADD CONSTRAINT "quizzes_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_suspended_by_fkey" FOREIGN KEY ("suspended_by") REFERENCES "auth"."users"("id");



CREATE POLICY "Admin service role can insert notifications" ON "public"."notifications" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "Authenticated users can insert own profile" ON "public"."users" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Public read published excerpts" ON "public"."liceu_rhetorical_excerpts" FOR SELECT TO "authenticated", "anon" USING (("is_published" = true));



CREATE POLICY "Public read published exercises" ON "public"."liceu_exercises" FOR SELECT TO "authenticated", "anon" USING (("is_published" = true));



CREATE POLICY "Public read published flashcards" ON "public"."liceu_flashcards" FOR SELECT TO "authenticated", "anon" USING (("is_published" = true));



CREATE POLICY "Public read published lessons" ON "public"."liceu_lessons" FOR SELECT TO "authenticated", "anon" USING (("is_published" = true));



CREATE POLICY "Public read published modules" ON "public"."liceu_modules" FOR SELECT TO "authenticated", "anon" USING (("is_active" = true));



CREATE POLICY "Public read published simulations" ON "public"."liceu_simulations" FOR SELECT TO "authenticated", "anon" USING (("is_published" = true));



CREATE POLICY "Public read published theory" ON "public"."liceu_theoretical_content" FOR SELECT TO "authenticated", "anon" USING ((EXISTS ( SELECT 1
   FROM "public"."liceu_lessons" "l"
  WHERE (("l"."id" = "liceu_theoretical_content"."lesson_id") AND ("l"."is_published" = true)))));



CREATE POLICY "Service role full access liceu_exercises" ON "public"."liceu_exercises" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access liceu_flashcards" ON "public"."liceu_flashcards" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access liceu_learner_progression" ON "public"."liceu_learner_progression" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access liceu_lessons" ON "public"."liceu_lessons" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access liceu_modules" ON "public"."liceu_modules" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access liceu_rhetorical_excerpts" ON "public"."liceu_rhetorical_excerpts" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access liceu_simulations" ON "public"."liceu_simulations" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access liceu_theoretical_content" ON "public"."liceu_theoretical_content" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Users can read own profile" ON "public"."users" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can read their own notifications" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own notifications" ON "public"."notifications" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users read own liceu progression" ON "public"."liceu_learner_progression" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users update own liceu progression" ON "public"."liceu_learner_progression" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users upsert own liceu progression" ON "public"."liceu_learner_progression" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."access_grants" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "access_grants_admin_all" ON "public"."access_grants" USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."id" = "auth"."uid"()) AND ("u"."role" = 'admin'::"text")))));



CREATE POLICY "access_grants_read_own" ON "public"."access_grants" FOR SELECT USING ((("auth"."uid"() = "user_id") AND ("revoked_at" IS NULL) AND (("expires_at" IS NULL) OR ("expires_at" > "now"()))));



ALTER TABLE "public"."admin_access_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_login_attempts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."assignment_submissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."assignments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "audit_logs_admin_read" ON "public"."audit_logs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."id" = "auth"."uid"()) AND ("u"."role" = 'admin'::"text")))));



ALTER TABLE "public"."courses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."diagnostic_sessions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "insert_diagnostic" ON "public"."diagnostic_sessions" FOR INSERT WITH CHECK (true);



ALTER TABLE "public"."liceu_exercises" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."liceu_flashcards" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."liceu_learner_progression" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."liceu_lessons" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."liceu_modules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."liceu_rhetorical_excerpts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."liceu_simulations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."liceu_theoretical_content" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."partnership_members" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "partnership_members_admin_all" ON "public"."partnership_members" USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."id" = "auth"."uid"()) AND ("u"."role" = 'admin'::"text")))));



CREATE POLICY "partnership_members_read_own" ON "public"."partnership_members" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."partnerships" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "partnerships_admin_all" ON "public"."partnerships" USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."id" = "auth"."uid"()) AND ("u"."role" = 'admin'::"text")))));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quiz_questions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "quiz_questions_public_read" ON "public"."quiz_questions" USING (("auth"."uid"() IS NOT NULL));



ALTER TABLE "public"."quizzes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "quizzes_public_read" ON "public"."quizzes" USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "read_by_share_token" ON "public"."diagnostic_sessions" FOR SELECT USING (("share_token" IS NOT NULL));



CREATE POLICY "read_own_diagnostic" ON "public"."diagnostic_sessions" FOR SELECT USING ((("auth"."uid"() = "user_id") OR ("email" = ( SELECT "profiles"."email"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())))));



ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_admin_read" ON "public"."users" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."id" = "auth"."uid"()) AND ("u"."role" = 'admin'::"text")))));



CREATE POLICY "users_admin_update" ON "public"."users" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."id" = "auth"."uid"()) AND ("u"."role" = 'admin'::"text")))));



CREATE POLICY "users_read_own" ON "public"."users" FOR SELECT USING (("auth"."uid"() = "id"));



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."check_module_completion"("p_user" "uuid", "p_module" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_module_completion"("p_user" "uuid", "p_module" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_module_completion"("p_user" "uuid", "p_module" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."complete_module"("p_user" "uuid", "p_module" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."complete_module"("p_user" "uuid", "p_module" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."complete_module"("p_user" "uuid", "p_module" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."grant_user_access"("p_user_id" "uuid", "p_grant_type" "public"."access_grant_type", "p_granted_by" "uuid", "p_modules" "uuid"[], "p_courses" "uuid"[], "p_expires_at" timestamp with time zone, "p_source_id" "uuid", "p_source_type" "text", "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."grant_user_access"("p_user_id" "uuid", "p_grant_type" "public"."access_grant_type", "p_granted_by" "uuid", "p_modules" "uuid"[], "p_courses" "uuid"[], "p_expires_at" timestamp with time zone, "p_source_id" "uuid", "p_source_type" "text", "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."grant_user_access"("p_user_id" "uuid", "p_grant_type" "public"."access_grant_type", "p_granted_by" "uuid", "p_modules" "uuid"[], "p_courses" "uuid"[], "p_expires_at" timestamp with time zone, "p_source_id" "uuid", "p_source_type" "text", "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_user_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_user_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_user_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_audit"("p_action" "public"."audit_action", "p_target_type" "text", "p_target_id" "uuid", "p_target_identifier" "text", "p_old_values" "jsonb", "p_new_values" "jsonb", "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."log_audit"("p_action" "public"."audit_action", "p_target_type" "text", "p_target_id" "uuid", "p_target_identifier" "text", "p_old_values" "jsonb", "p_new_values" "jsonb", "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_audit"("p_action" "public"."audit_action", "p_target_type" "text", "p_target_id" "uuid", "p_target_identifier" "text", "p_old_values" "jsonb", "p_new_values" "jsonb", "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."revoke_user_access"("p_grant_id" "uuid", "p_revoked_by" "uuid", "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."revoke_user_access"("p_grant_id" "uuid", "p_revoked_by" "uuid", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."revoke_user_access"("p_grant_id" "uuid", "p_revoked_by" "uuid", "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."user_has_course_access"("p_user_id" "uuid", "p_course_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."user_has_course_access"("p_user_id" "uuid", "p_course_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_has_course_access"("p_user_id" "uuid", "p_course_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."user_has_module_access"("p_user_id" "uuid", "p_module_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."user_has_module_access"("p_user_id" "uuid", "p_module_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_has_module_access"("p_user_id" "uuid", "p_module_id" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."access_grants" TO "anon";
GRANT ALL ON TABLE "public"."access_grants" TO "authenticated";
GRANT ALL ON TABLE "public"."access_grants" TO "service_role";



GRANT ALL ON TABLE "public"."admin_access_logs" TO "anon";
GRANT ALL ON TABLE "public"."admin_access_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_access_logs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."admin_access_logs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."admin_access_logs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."admin_access_logs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."admin_login_attempts" TO "anon";
GRANT ALL ON TABLE "public"."admin_login_attempts" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_login_attempts" TO "service_role";



GRANT ALL ON SEQUENCE "public"."admin_login_attempts_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."admin_login_attempts_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."admin_login_attempts_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."assignment_submissions" TO "anon";
GRANT ALL ON TABLE "public"."assignment_submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."assignment_submissions" TO "service_role";



GRANT ALL ON TABLE "public"."assignments" TO "anon";
GRANT ALL ON TABLE "public"."assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."assignments" TO "service_role";



GRANT ALL ON TABLE "public"."audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."courses" TO "anon";
GRANT ALL ON TABLE "public"."courses" TO "authenticated";
GRANT ALL ON TABLE "public"."courses" TO "service_role";



GRANT ALL ON TABLE "public"."diagnostic_sessions" TO "anon";
GRANT ALL ON TABLE "public"."diagnostic_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."diagnostic_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."flashcard_progress" TO "anon";
GRANT ALL ON TABLE "public"."flashcard_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."flashcard_progress" TO "service_role";



GRANT ALL ON TABLE "public"."flashcard_sets" TO "anon";
GRANT ALL ON TABLE "public"."flashcard_sets" TO "authenticated";
GRANT ALL ON TABLE "public"."flashcard_sets" TO "service_role";



GRANT ALL ON TABLE "public"."flashcards" TO "anon";
GRANT ALL ON TABLE "public"."flashcards" TO "authenticated";
GRANT ALL ON TABLE "public"."flashcards" TO "service_role";



GRANT ALL ON TABLE "public"."lesson_progress" TO "anon";
GRANT ALL ON TABLE "public"."lesson_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."lesson_progress" TO "service_role";



GRANT ALL ON TABLE "public"."lesson_quiz_questions" TO "anon";
GRANT ALL ON TABLE "public"."lesson_quiz_questions" TO "authenticated";
GRANT ALL ON TABLE "public"."lesson_quiz_questions" TO "service_role";



GRANT ALL ON TABLE "public"."lessons" TO "anon";
GRANT ALL ON TABLE "public"."lessons" TO "authenticated";
GRANT ALL ON TABLE "public"."lessons" TO "service_role";



GRANT ALL ON TABLE "public"."liceu_exercises" TO "anon";
GRANT ALL ON TABLE "public"."liceu_exercises" TO "authenticated";
GRANT ALL ON TABLE "public"."liceu_exercises" TO "service_role";



GRANT ALL ON TABLE "public"."liceu_flashcards" TO "anon";
GRANT ALL ON TABLE "public"."liceu_flashcards" TO "authenticated";
GRANT ALL ON TABLE "public"."liceu_flashcards" TO "service_role";



GRANT ALL ON TABLE "public"."liceu_learner_progression" TO "anon";
GRANT ALL ON TABLE "public"."liceu_learner_progression" TO "authenticated";
GRANT ALL ON TABLE "public"."liceu_learner_progression" TO "service_role";



GRANT ALL ON TABLE "public"."liceu_lessons" TO "anon";
GRANT ALL ON TABLE "public"."liceu_lessons" TO "authenticated";
GRANT ALL ON TABLE "public"."liceu_lessons" TO "service_role";



GRANT ALL ON TABLE "public"."liceu_modules" TO "anon";
GRANT ALL ON TABLE "public"."liceu_modules" TO "authenticated";
GRANT ALL ON TABLE "public"."liceu_modules" TO "service_role";



GRANT ALL ON TABLE "public"."liceu_rhetorical_excerpts" TO "anon";
GRANT ALL ON TABLE "public"."liceu_rhetorical_excerpts" TO "authenticated";
GRANT ALL ON TABLE "public"."liceu_rhetorical_excerpts" TO "service_role";



GRANT ALL ON TABLE "public"."liceu_simulations" TO "anon";
GRANT ALL ON TABLE "public"."liceu_simulations" TO "authenticated";
GRANT ALL ON TABLE "public"."liceu_simulations" TO "service_role";



GRANT ALL ON TABLE "public"."liceu_theoretical_content" TO "anon";
GRANT ALL ON TABLE "public"."liceu_theoretical_content" TO "authenticated";
GRANT ALL ON TABLE "public"."liceu_theoretical_content" TO "service_role";



GRANT ALL ON TABLE "public"."mentoring_applications" TO "anon";
GRANT ALL ON TABLE "public"."mentoring_applications" TO "authenticated";
GRANT ALL ON TABLE "public"."mentoring_applications" TO "service_role";



GRANT ALL ON TABLE "public"."mentorship_bookings" TO "anon";
GRANT ALL ON TABLE "public"."mentorship_bookings" TO "authenticated";
GRANT ALL ON TABLE "public"."mentorship_bookings" TO "service_role";



GRANT ALL ON TABLE "public"."mentorship_sessions" TO "anon";
GRANT ALL ON TABLE "public"."mentorship_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."mentorship_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."mentorship_waitlist" TO "anon";
GRANT ALL ON TABLE "public"."mentorship_waitlist" TO "authenticated";
GRANT ALL ON TABLE "public"."mentorship_waitlist" TO "service_role";



GRANT ALL ON TABLE "public"."module_assignments" TO "anon";
GRANT ALL ON TABLE "public"."module_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."module_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."module_progress" TO "anon";
GRANT ALL ON TABLE "public"."module_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."module_progress" TO "service_role";



GRANT ALL ON TABLE "public"."module_texts" TO "anon";
GRANT ALL ON TABLE "public"."module_texts" TO "authenticated";
GRANT ALL ON TABLE "public"."module_texts" TO "service_role";



GRANT ALL ON TABLE "public"."modules" TO "anon";
GRANT ALL ON TABLE "public"."modules" TO "authenticated";
GRANT ALL ON TABLE "public"."modules" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."partnership_members" TO "anon";
GRANT ALL ON TABLE "public"."partnership_members" TO "authenticated";
GRANT ALL ON TABLE "public"."partnership_members" TO "service_role";



GRANT ALL ON TABLE "public"."partnerships" TO "anon";
GRANT ALL ON TABLE "public"."partnerships" TO "authenticated";
GRANT ALL ON TABLE "public"."partnerships" TO "service_role";



GRANT ALL ON TABLE "public"."pending_purchases" TO "anon";
GRANT ALL ON TABLE "public"."pending_purchases" TO "authenticated";
GRANT ALL ON TABLE "public"."pending_purchases" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."purchases" TO "anon";
GRANT ALL ON TABLE "public"."purchases" TO "authenticated";
GRANT ALL ON TABLE "public"."purchases" TO "service_role";



GRANT ALL ON TABLE "public"."quiz_attempts" TO "anon";
GRANT ALL ON TABLE "public"."quiz_attempts" TO "authenticated";
GRANT ALL ON TABLE "public"."quiz_attempts" TO "service_role";



GRANT ALL ON TABLE "public"."quiz_questions" TO "anon";
GRANT ALL ON TABLE "public"."quiz_questions" TO "authenticated";
GRANT ALL ON TABLE "public"."quiz_questions" TO "service_role";



GRANT ALL ON TABLE "public"."quizzes" TO "anon";
GRANT ALL ON TABLE "public"."quizzes" TO "authenticated";
GRANT ALL ON TABLE "public"."quizzes" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







