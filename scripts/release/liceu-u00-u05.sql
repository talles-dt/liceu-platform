-- Reviewed release bundle; NOT executed remotely. Target: rymzyaxhrcusqqzllzay.
begin;
set local lock_timeout='5s';
set local statement_timeout='120s';
select pg_advisory_xact_lock(hashtext('liceu-u00-u05-release'));
do $$begin
 if to_regclass('public.liceu_webhook_inbox') is not null or to_regclass('public.liceu_subscriptions') is not null then
  raise exception 'Release already applied or partially installed: reconcile before proceeding';
 end if;
end$$;
-- SOURCE 20261008231646_subscription_learning_security.sql
-- Additive migration against the reconciled 2026-10-08 public baseline.
-- Do not replay historical repository migrations against the live database.
create schema if not exists liceu_private;
revoke all on schema liceu_private from public, anon;
grant usage on schema liceu_private to authenticated, service_role;

-- Close legacy privilege escalation and leaked answers. Profiles are server-written.
do $$ declare r record; begin
  for r in select policyname from pg_policies where schemaname='public' and tablename='users' loop
    execute format('drop policy %I on public.users',r.policyname);
  end loop;
  for r in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.prosecdef loop
    execute format('revoke execute on function %s from public,anon,authenticated',r.signature);
    execute format('grant execute on function %s to service_role',r.signature);
    execute format('alter function %s set search_path = public, pg_temp',r.signature);
  end loop;
end $$;
revoke all on public.users from anon, authenticated;
grant select on public.users to authenticated;
create policy users_own_read on public.users for select to authenticated using(id=auth.uid());
revoke all on public.quiz_questions,public.lesson_quiz_questions,public.quizzes from anon,authenticated;
revoke insert,update,delete on public.liceu_learner_progression from anon,authenticated;
alter table public.partnership_members add column if not exists updated_at timestamptz not null default now();
alter table public.liceu_lessons add column if not exists cloudflare_stream_id text;

create table public.liceu_billing_accounts (
 user_id uuid primary key references auth.users(id) on delete cascade,
 customer_id text unique,
 trial_used_at timestamptz,
 created_at timestamptz not null default now()
);
create table public.liceu_subscriptions (
 subscription_id text primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 customer_id text not null,
 status text not null,
 access_until timestamptz,
 trial_end timestamptz,
 cancel_at_period_end boolean not null default false,
 event_created bigint not null default 0,
 updated_at timestamptz not null default now()
);
create index on public.liceu_subscriptions(user_id);
create table public.liceu_billing_events (
 event_id text primary key, event_type text not null, event_created bigint not null,
 processed_at timestamptz not null default now()
);
create table public.liceu_trial_cards (
 fingerprint_hash text primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default now()
);
create table public.liceu_trial_reviews (
 user_id uuid primary key references auth.users(id) on delete cascade,
 reason text not null, status text not null default 'pending' check(status in('pending','approved','rejected')),
 created_at timestamptz not null default now()
);
create table public.liceu_rate_limits (
 key text primary key, count integer not null, window_end timestamptz not null
);
create table public.liceu_quiz_questions (
 id uuid primary key default gen_random_uuid(), module_id uuid not null references public.liceu_modules(id),
 question text not null, options jsonb not null check(jsonb_typeof(options)='array'),
 correct_answer text not null, order_index integer not null default 0, is_published boolean not null default false
);
create table public.liceu_quiz_attempts (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 module_id uuid not null references public.liceu_modules(id), score integer not null check(score between 0 and 100),
 answers jsonb not null, created_at timestamptz not null default now()
);
create index on public.liceu_quiz_attempts(user_id,module_id,score);
create table public.liceu_module_completions (
 user_id uuid not null references auth.users(id) on delete cascade,
 module_id uuid not null references public.liceu_modules(id), completed_at timestamptz not null default now(),
 primary key(user_id,module_id)
);
create table public.liceu_flashcard_progress (
 user_id uuid not null references auth.users(id) on delete cascade,
 card_id uuid not null references public.liceu_flashcards(id), easiness float not null default 2.5,
 interval_days integer not null default 1, repetitions integer not null default 0,
 next_review timestamptz not null default now(), primary key(user_id,card_id)
);
create table public.liceu_work_versions (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 exercise_id uuid not null references public.liceu_exercises(id), content text not null check(length(content)<=50000),
 created_at timestamptz not null default now()
);
create table public.liceu_work_drafts (
 user_id uuid not null references auth.users(id) on delete cascade,
 exercise_id uuid not null references public.liceu_exercises(id), content text not null check(length(content)<=50000),
 updated_at timestamptz not null default now(), primary key(user_id,exercise_id)
);
create table public.liceu_service_orders (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 kind text not null check(kind in('review','mentoring')), work_version_id uuid references public.liceu_work_versions(id),
 teacher_id uuid references auth.users(id), scope text not null,
 due_at timestamptz, duration_minutes integer check(duration_minutes>0),
 price_id text, stripe_session_id text unique,
 status text not null default 'requested' check(status in('requested','offered','paid','completed','cancelled')),
 feedback text, rubric jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(kind<>'review' or work_version_id is not null)
);
create table public.liceu_mentoring_bookings (
 booking_uid text primary key, order_id uuid not null references public.liceu_service_orders(id),
 start_time timestamptz not null, end_time timestamptz not null,
 status text not null check(status in('scheduled','cancelled')), updated_at timestamptz not null default now()
);
-- Default deny; the service client is used only after verified route authorization.
do $$ declare t text; begin
 foreach t in array array['liceu_billing_accounts','liceu_subscriptions','liceu_billing_events','liceu_trial_cards','liceu_trial_reviews',
 'liceu_rate_limits','liceu_quiz_questions','liceu_quiz_attempts','liceu_module_completions','liceu_flashcard_progress',
 'liceu_work_versions','liceu_work_drafts','liceu_service_orders','liceu_mentoring_bookings'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from anon,authenticated',t);
  execute format('grant all on public.%I to service_role',t);
 end loop;
 foreach t in array array['liceu_subscriptions','liceu_quiz_attempts','liceu_module_completions','liceu_flashcard_progress','liceu_work_versions','liceu_work_drafts','liceu_service_orders'] loop
  execute format('grant select on public.%I to authenticated',t);
  execute format('create policy own_history on public.%I for select to authenticated using(user_id=auth.uid())',t);
 end loop;
end $$;

create function liceu_private.has_access(p_user uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.users u where u.id=p_user and u.suspended_at is null and (
   u.role='admin' or exists(select 1 from public.liceu_subscriptions s where s.user_id=p_user
    and s.status in('trialing','active','past_due','canceled') and s.access_until>now())
   or exists(select 1 from public.access_grants g where g.user_id=p_user and g.revoked_at is null
    and (g.expires_at is null or g.expires_at>now()) and g.grant_type='admin_override'
    and g.modules is null and g.courses is null)))
$$;
create function liceu_private.can_study(p_user uuid,p_module uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select liceu_private.has_access(p_user) and exists(select 1 from public.liceu_modules m where m.id=p_module and m.is_active
  and not exists(select 1 from public.liceu_modules prev where prev.is_active and prev.order_index<m.order_index
   and not exists(select 1 from public.liceu_module_completions c where c.user_id=p_user and c.module_id=prev.id)))
$$;
revoke all on function liceu_private.has_access(uuid),liceu_private.can_study(uuid,uuid) from public,anon,authenticated;
grant execute on function liceu_private.has_access(uuid),liceu_private.can_study(uuid,uuid) to service_role;
-- RLS gets only self-bound wrappers; callers cannot query another user's access.
create function liceu_private.can_study_self(p_module uuid) returns boolean
language sql stable security definer set search_path='' as $$select liceu_private.can_study(auth.uid(),p_module)$$;
revoke all on function liceu_private.can_study_self(uuid) from public,anon;
grant execute on function liceu_private.can_study_self(uuid) to authenticated;
create function public.liceu_can_access_module(p_module_id uuid) returns boolean language sql stable security invoker
set search_path='' as $$select liceu_private.can_study_self(p_module_id)$$;
revoke all on function public.liceu_can_access_module(uuid) from public,anon;
grant execute on function public.liceu_can_access_module(uuid) to authenticated;

-- Replace public content policies so direct REST cannot bypass the subscription gate.
do $$ declare r record; begin
 for r in select tablename,policyname from pg_policies where schemaname='public' and tablename in
 ('liceu_lessons','liceu_theoretical_content','liceu_exercises','liceu_flashcards','liceu_rhetorical_excerpts','liceu_simulations') loop
 execute format('drop policy %I on public.%I',r.policyname,r.tablename); end loop;
end $$;
create policy lesson_access on public.liceu_lessons for select to authenticated
 using(is_published and liceu_private.can_study_self(module_id));
create policy theory_access on public.liceu_theoretical_content for select to authenticated
 using(exists(select 1 from public.liceu_lessons l where l.id=lesson_id));
create policy exercise_access on public.liceu_exercises for select to authenticated
 using(is_published and exists(select 1 from public.liceu_lessons l where l.id=lesson_id));
create policy flashcard_access on public.liceu_flashcards for select to authenticated
 using(is_published and exists(select 1 from public.liceu_lessons l where l.id=lesson_id));
create policy excerpt_access on public.liceu_rhetorical_excerpts for select to authenticated
 using(is_published and exists(select 1 from public.liceu_lessons l where l.id=lesson_id));
create policy simulation_access on public.liceu_simulations for select to authenticated
 using(is_published and liceu_private.can_study_self(module_id));

create function public.liceu_complete_lesson(p_user uuid,p_lesson uuid) returns void
language plpgsql security invoker set search_path='' as $$declare m uuid;begin
 select module_id into m from public.liceu_lessons where id=p_lesson and is_published;
 if m is null or not liceu_private.can_study(p_user,m) then raise exception 'Access denied';end if;
 insert into public.liceu_learner_progression(user_id,completed_lessons,current_module_id,current_lesson_id)
 values(p_user,array[p_lesson],m,p_lesson) on conflict(user_id) do update set
 completed_lessons=(select array_agg(distinct v) from unnest(coalesce(public.liceu_learner_progression.completed_lessons,'{}')||array[p_lesson]) v),
 current_module_id=m,current_lesson_id=p_lesson,updated_at=now();
end$$;
create function public.liceu_complete_module(p_user uuid,p_module uuid) returns void
language plpgsql security invoker set search_path='' as $$begin
 if not liceu_private.can_study(p_user,p_module) then raise exception 'Access denied';end if;
 if not exists(select 1 from public.liceu_lessons where module_id=p_module and is_published)
 or exists(select 1 from public.liceu_lessons l where l.module_id=p_module and l.is_published and not exists(
 select 1 from public.liceu_learner_progression p where p.user_id=p_user and l.id=any(p.completed_lessons)))
 or not exists(select 1 from public.liceu_quiz_attempts where user_id=p_user and module_id=p_module and score>=70)
 then raise exception 'Complete all lessons and pass the quiz (70%%)';end if;
 insert into public.liceu_module_completions(user_id,module_id) values(p_user,p_module) on conflict do nothing;
end$$;
create function public.liceu_rate_limit(p_key text,p_limit integer,p_seconds integer) returns boolean
language plpgsql security invoker set search_path='' as $$declare n integer;begin
 insert into public.liceu_rate_limits as r(key,count,window_end) values(p_key,1,now()+make_interval(secs=>p_seconds))
 on conflict(key) do update set count=case when r.window_end<=now() then 1 else r.count+1 end,
 window_end=case when r.window_end<=now() then excluded.window_end else r.window_end end returning count into n;
 return n<=p_limit;
end$$;
create function public.liceu_claim_trial_card(p_user uuid,p_hash text) returns boolean
language plpgsql security invoker set search_path='' as $$declare owner_id uuid;begin
 insert into public.liceu_trial_cards(fingerprint_hash,user_id) values(p_hash,p_user) on conflict do nothing;
 select user_id into owner_id from public.liceu_trial_cards where fingerprint_hash=p_hash;
 if owner_id<>p_user then
 insert into public.liceu_trial_reviews(user_id,reason) values(p_user,'shared_card') on conflict(user_id) do nothing;
 return exists(select 1 from public.liceu_trial_reviews where user_id=p_user and status='approved');end if;
 return true;
end$$;
create function public.liceu_apply_subscription(p_event text,p_type text,p_created bigint,p_subscription text,p_user uuid,
 p_customer text,p_status text,p_until timestamptz,p_trial_end timestamptz,p_cancel boolean) returns void
language plpgsql security invoker set search_path='' as $$begin
 insert into public.liceu_billing_events(event_id,event_type,event_created) values(p_event,p_type,p_created) on conflict do nothing;
 if not found then return;end if;
 insert into public.liceu_subscriptions(subscription_id,user_id,customer_id,status,access_until,trial_end,cancel_at_period_end,event_created)
 values(p_subscription,p_user,p_customer,p_status,p_until,p_trial_end,p_cancel,p_created) on conflict(subscription_id) do update set
 status=excluded.status,access_until=excluded.access_until,trial_end=excluded.trial_end,
 cancel_at_period_end=excluded.cancel_at_period_end,event_created=excluded.event_created,updated_at=now()
 where public.liceu_subscriptions.event_created<=excluded.event_created;
 if p_trial_end is not null then update public.liceu_billing_accounts set trial_used_at=coalesce(trial_used_at,now()) where user_id=p_user;end if;
end$$;
-- All mutation RPCs are service-only, including when caller supplies another user id.
do $$declare r record;begin
 for r in select p.oid::regprocedure as f from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and p.proname like 'liceu_%' and p.proname<>'liceu_can_access_module' loop
 execute format('revoke all on function %s from public,anon,authenticated',r.f);
 execute format('grant execute on function %s to service_role',r.f);end loop;
end$$;
-- Each customer/account has one checkout creation in flight across all instances.
alter table public.liceu_billing_accounts add column checkout_lock_until timestamptz;
alter table public.liceu_billing_accounts add column checkout_session_id text;
create function public.liceu_lock_checkout(p_user uuid) returns boolean language plpgsql security invoker set search_path='' as $$begin
 insert into public.liceu_billing_accounts(user_id) values(p_user) on conflict do nothing;
 update public.liceu_billing_accounts set checkout_lock_until=now()+interval '2 minutes' where user_id=p_user and (checkout_lock_until is null or checkout_lock_until<now());
 return found;
end$$;
revoke all on function public.liceu_lock_checkout(uuid) from public,anon,authenticated;
grant execute on function public.liceu_lock_checkout(uuid) to service_role;

-- Preserve unidentified historical payments for explicit, auditable reconciliation.
create table public.liceu_legacy_billing_events(event_id text primary key,event_type text not null,payload jsonb not null,created_at timestamptz not null default now(),resolved_at timestamptz);
alter table public.liceu_legacy_billing_events enable row level security;
revoke all on public.liceu_legacy_billing_events from anon,authenticated;
grant all on public.liceu_legacy_billing_events to service_role;

-- Shared diagnostic output is served through a token lookup selecting only safe fields.
drop policy if exists read_by_share_token on public.diagnostic_sessions;
drop policy if exists insert_diagnostic on public.diagnostic_sessions;
create policy diagnostic_insert_own on public.diagnostic_sessions for insert to authenticated with check(user_id=auth.uid());
create policy diagnostic_insert_anonymous on public.diagnostic_sessions for insert to anon with check(user_id is null);
create policy diagnostic_read_own on public.diagnostic_sessions for select to authenticated using(user_id=auth.uid());

-- SOURCE 20261010065904_formation_trivium.sql
-- Formation is independent from module completion and commercial subscriptions.
-- All writes use service-only commands after verified identity; RLS protects reads too.
create table public.formation_programs(id uuid primary key default gen_random_uuid(),slug text not null unique,title text not null);
create table public.formation_releases(
 id uuid primary key default gen_random_uuid(),program_id uuid not null references public.formation_programs,
 version text not null,hash text not null check(hash ~ '^[a-f0-9]{64}$'),manifest jsonb not null,
 source_commit text not null,approved_by uuid not null references public.users,created_at timestamptz not null default now(),
 unique(program_id,version),unique(id,program_id));
create table public.formation_cohorts(
 id uuid primary key default gen_random_uuid(),program_id uuid not null references public.formation_programs,
 release_id uuid not null,title text not null,capacity int not null default 6 check(capacity between 1 and 6),
 monthly_fee_cents int not null default 50000 check(monthly_fee_cents=50000),currency text not null default 'BRL' check(currency='BRL'),
 timezone text not null default 'America/Sao_Paulo',starts_on date,ends_on date,status text not null default 'draft' check(status in('draft','active','closed')),
 foreign key(release_id,program_id) references public.formation_releases(id,program_id),check(ends_on is null or ends_on>starts_on));
create table public.formation_memberships(
 cohort_id uuid not null references public.formation_cohorts,user_id uuid not null references public.users,
 role text not null check(role in('participant','teacher','evaluator')),status text not null default 'active' check(status in('active','paused','withdrawn','completed')),
 primary key(cohort_id,user_id));
create table public.formation_activities(
 id uuid primary key default gen_random_uuid(),cohort_id uuid not null references public.formation_cohorts,
 release_id uuid not null references public.formation_releases,cycle_key text not null,item_key text not null,
 starts_at timestamptz,ends_at timestamptz,due_at timestamptz,meeting_url text,
 status text not null default 'open' check(status in('open','held','closed','cancelled')),revision int not null default 1,
 unique(cohort_id,item_key),unique(id,cohort_id),check(ends_at is null or ends_at>starts_at));
create table public.formation_participations(
 activity_id uuid not null,cohort_id uuid not null,user_id uuid not null,role text not null,
 attendance text not null default 'unknown' check(attendance in('unknown','present','absent','excused')),
 primary key(activity_id,user_id),foreign key(activity_id,cohort_id) references public.formation_activities(id,cohort_id),
 foreign key(cohort_id,user_id) references public.formation_memberships(cohort_id,user_id));
create table public.formation_drafts(
 activity_id uuid not null,cohort_id uuid not null,user_id uuid not null,body text not null check(length(body)<=50000),
 revision int not null default 1,updated_at timestamptz not null default now(),primary key(activity_id,user_id),
 foreign key(activity_id,cohort_id) references public.formation_activities(id,cohort_id),foreign key(cohort_id,user_id) references public.formation_memberships);
create table public.formation_submissions(
 id uuid primary key default gen_random_uuid(),activity_id uuid not null,cohort_id uuid not null,user_id uuid not null,
 revision int not null,body text not null check(length(body) between 1 and 50000),release_id uuid not null references public.formation_releases,
 request_id uuid not null unique,created_at timestamptz not null default now(),unique(activity_id,user_id,revision),unique(id,cohort_id),
 foreign key(activity_id,cohort_id) references public.formation_activities(id,cohort_id),foreign key(cohort_id,user_id) references public.formation_memberships);
create table public.formation_performances(
 id uuid primary key default gen_random_uuid(),activity_id uuid not null,cohort_id uuid not null,record text not null check(length(record) between 1 and 20000),
 participants uuid[] not null check(cardinality(participants)>0),occurred_at timestamptz not null,created_by uuid not null references public.users,
 unique(id,cohort_id),foreign key(activity_id,cohort_id) references public.formation_activities(id,cohort_id));
create table public.formation_reviews(
 id uuid primary key default gen_random_uuid(),cohort_id uuid not null references public.formation_cohorts,
 reviewer_id uuid not null,subject_id uuid not null,submission_id uuid,performance_id uuid,kind text not null check(kind in('teacher','peer','self','panel')),
 foreign key(cohort_id,reviewer_id) references public.formation_memberships,foreign key(cohort_id,subject_id) references public.formation_memberships,
 foreign key(submission_id,cohort_id) references public.formation_submissions(id,cohort_id),
 foreign key(performance_id,cohort_id) references public.formation_performances(id,cohort_id),check(num_nonnulls(submission_id,performance_id)=1),unique(id,cohort_id));
create table public.formation_assessments(
 id uuid primary key default gen_random_uuid(),review_id uuid not null unique,cohort_id uuid not null,
 author_id uuid not null references public.users,rubric_key text not null,observations jsonb not null,narrative text not null check(length(narrative) between 1 and 20000),
 created_at timestamptz not null default now(),foreign key(review_id,cohort_id) references public.formation_reviews(id,cohort_id));
create table public.formation_codex(
 id uuid primary key default gen_random_uuid(),cohort_id uuid not null,user_id uuid not null,title text not null check(length(title) between 1 and 160),
 body text not null check(length(body)<=50000),source text not null default '',revision int not null default 1,updated_at timestamptz not null default now(),
 foreign key(cohort_id,user_id) references public.formation_memberships);
create table public.formation_artifacts(
 id uuid primary key,cohort_id uuid not null,user_id uuid not null,submission_id uuid not null,
 path text not null unique,mime text not null,bytes bigint not null check(bytes>0 and bytes<=10485760),state text not null default 'pending' check(state in('pending','ready')),
 created_at timestamptz not null default now(),foreign key(submission_id,cohort_id) references public.formation_submissions(id,cohort_id),foreign key(cohort_id,user_id) references public.formation_memberships);
create table public.formation_events(id bigint generated always as identity primary key,cohort_id uuid references public.formation_cohorts,actor_id uuid references public.users,event_type text not null,entity_id uuid,created_at timestamptz not null default now());

create function liceu_private.formation_member(c uuid,roles text[] default array['participant','teacher','evaluator']) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.formation_memberships m join public.users u on u.id=m.user_id where m.cohort_id=c and m.user_id=auth.uid() and m.role=any(roles) and m.status in('active','completed') and u.suspended_at is null)
$$;
revoke all on function liceu_private.formation_member(uuid,text[]) from public,anon;
grant execute on function liceu_private.formation_member(uuid,text[]) to authenticated;
create function liceu_private.formation_own_archive(c uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.formation_memberships m join public.users u on u.id=m.user_id where m.cohort_id=c and m.user_id=auth.uid() and u.suspended_at is null)
$$;
revoke all on function liceu_private.formation_own_archive(uuid) from public,anon;
grant execute on function liceu_private.formation_own_archive(uuid) to authenticated;
create function liceu_private.formation_can_review(s uuid,p uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.formation_reviews r where r.reviewer_id=auth.uid() and ((s is not null and r.submission_id=s) or (p is not null and r.performance_id=p)) and liceu_private.formation_member(r.cohort_id))
$$;
revoke all on function liceu_private.formation_can_review(uuid,uuid) from public,anon;
grant execute on function liceu_private.formation_can_review(uuid,uuid) to authenticated;

do $$declare t text;begin
 foreach t in array array['programs','releases','cohorts','memberships','activities','participations','drafts','submissions','performances','reviews','assessments','codex','artifacts','events'] loop
 execute format('alter table public.formation_%I enable row level security',t);
 execute format('revoke all on public.formation_%I from public,anon,authenticated',t);
 execute format('grant select on public.formation_%I to authenticated',t);
 execute format('grant all on public.formation_%I to service_role',t);
 end loop;
end$$;
grant usage,select on sequence public.formation_events_id_seq to service_role;
create policy read_cohort on public.formation_cohorts for select to authenticated using(liceu_private.formation_own_archive(id));
create policy read_program on public.formation_programs for select to authenticated using(exists(select 1 from public.formation_cohorts c where c.program_id=formation_programs.id));
create policy read_release on public.formation_releases for select to authenticated using(exists(select 1 from public.formation_cohorts c where c.release_id=formation_releases.id));
create policy read_membership on public.formation_memberships for select to authenticated using((user_id=auth.uid() and liceu_private.formation_own_archive(cohort_id)) or liceu_private.formation_member(cohort_id,array['teacher']));
create policy read_activity on public.formation_activities for select to authenticated using(liceu_private.formation_own_archive(cohort_id));
create policy read_participation on public.formation_participations for select to authenticated using(liceu_private.formation_member(cohort_id));
create policy read_draft on public.formation_drafts for select to authenticated using(user_id=auth.uid() and liceu_private.formation_own_archive(cohort_id));
create policy read_submission on public.formation_submissions for select to authenticated using((user_id=auth.uid() and liceu_private.formation_own_archive(cohort_id)) or (liceu_private.formation_member(cohort_id) and (liceu_private.formation_member(cohort_id,array['teacher']) or liceu_private.formation_can_review(id,null))));
create policy read_performance on public.formation_performances for select to authenticated using((auth.uid()=any(participants) and liceu_private.formation_own_archive(cohort_id)) or (liceu_private.formation_member(cohort_id) and (liceu_private.formation_member(cohort_id,array['teacher']) or liceu_private.formation_can_review(null,id))));
create policy read_review on public.formation_reviews for select to authenticated using((subject_id=auth.uid() and liceu_private.formation_own_archive(cohort_id)) or (liceu_private.formation_member(cohort_id) and (reviewer_id=auth.uid() or liceu_private.formation_member(cohort_id,array['teacher']))));
create policy read_assessment on public.formation_assessments for select to authenticated using(exists(select 1 from public.formation_reviews r where r.id=review_id));
create policy read_codex on public.formation_codex for select to authenticated using(user_id=auth.uid() and liceu_private.formation_own_archive(cohort_id));
create policy read_artifact on public.formation_artifacts for select to authenticated using(exists(select 1 from public.formation_submissions s where s.id=submission_id));
create policy read_event on public.formation_events for select to authenticated using(liceu_private.formation_member(cohort_id,array['teacher']));

create function liceu_private.formation_immutable() returns trigger language plpgsql set search_path='' as $$begin raise exception 'Published evidence is immutable';end$$;
create trigger immutable_release before update or delete on public.formation_releases for each row execute function liceu_private.formation_immutable();
create trigger immutable_submission before update or delete on public.formation_submissions for each row execute function liceu_private.formation_immutable();
create trigger immutable_performance before update or delete on public.formation_performances for each row execute function liceu_private.formation_immutable();
create trigger immutable_assessment before update or delete on public.formation_assessments for each row execute function liceu_private.formation_immutable();

-- One service-only, transactional boundary. Actor identity is supplied by a verified server session.
create function public.formation_command(p_actor uuid,p_cohort uuid,p_action text,p_body jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare m public.formation_memberships; a public.formation_activities; d public.formation_drafts; c public.formation_cohorts;
 s public.formation_submissions; r public.formation_reviews; perf public.formation_performances; rel public.formation_releases;
 result_id uuid; n int; v int; x record; manifest jsonb; item jsonb; rubric jsonb;
begin
 select * into c from public.formation_cohorts where id=p_cohort for update;
 if not found then raise exception 'Not found' using errcode='P0002';end if;
 if not exists(select 1 from public.users where id=p_actor and suspended_at is null) then raise exception 'Forbidden' using errcode='42501';end if;
 select * into m from public.formation_memberships where cohort_id=p_cohort and user_id=p_actor and status='active';
 if not found then raise exception 'Forbidden' using errcode='42501';end if;
 if c.status='closed' then raise exception 'Cohort closed' using errcode='PT409';end if;
 select * into rel from public.formation_releases where id=c.release_id; manifest=rel.manifest;
 if p_action in('save_draft','submit') then
  select * into a from public.formation_activities where id=(p_body->>'activity_id')::uuid and cohort_id=p_cohort;
  if not found or a.status<>'open' or m.role<>'participant' then raise exception 'Activity unavailable' using errcode='42501';end if;
  if p_action='submit' then
   select * into s from public.formation_submissions where request_id=(p_body->>'request_id')::uuid;
   if found then
    if s.user_id<>p_actor or s.activity_id<>a.id then raise exception 'Request conflict' using errcode='PT409';end if;
    return jsonb_build_object('id',s.id,'revision',s.revision);
   end if;
  end if;
  select * into d from public.formation_drafts where activity_id=a.id and user_id=p_actor;
  if (p_body->>'revision') is null or coalesce(d.revision,0)<>(p_body->>'revision')::int then raise exception 'Draft changed; reload' using errcode='PT409';end if;
  if length(p_body->>'body')>50000 or p_body->>'body' is null then raise exception 'Invalid body' using errcode='22023';end if;
  v=coalesce(d.revision,0)+1;
  insert into public.formation_drafts(activity_id,cohort_id,user_id,body,revision) values(a.id,p_cohort,p_actor,p_body->>'body',v)
  on conflict(activity_id,user_id) do update set body=excluded.body,revision=excluded.revision,updated_at=now();
  if p_action='submit' then
   if length(trim(p_body->>'body'))=0 then raise exception 'Empty submission' using errcode='22023';end if;
   insert into public.formation_submissions(activity_id,cohort_id,user_id,revision,body,release_id,request_id)
   values(a.id,p_cohort,p_actor,v,p_body->>'body',a.release_id,(p_body->>'request_id')::uuid) returning id into result_id;
  else result_id=a.id;end if;
 elsif p_action='codex' then
  if length(p_body->>'title') not between 1 and 160 or length(p_body->>'body')>50000 then raise exception 'Invalid note' using errcode='22023';end if;
  if p_body->>'id' is null then
   insert into public.formation_codex(cohort_id,user_id,title,body,source) values(p_cohort,p_actor,p_body->>'title',p_body->>'body',coalesce(p_body->>'source','')) returning id,revision into result_id,v;
  else
   update public.formation_codex set title=p_body->>'title',body=p_body->>'body',source=coalesce(p_body->>'source',''),revision=revision+1,updated_at=now()
   where id=(p_body->>'id')::uuid and cohort_id=p_cohort and user_id=p_actor and revision=(p_body->>'revision')::int returning id,revision into result_id,v;
   if not found then raise exception 'Note changed or unavailable' using errcode='PT409';end if;
  end if;
 elsif p_action='assess' then
  select * into r from public.formation_reviews where id=(p_body->>'review_id')::uuid and cohort_id=p_cohort and reviewer_id=p_actor;
  if not found then raise exception 'Forbidden' using errcode='42501';end if;
  select * into a from public.formation_activities where id=coalesce((select activity_id from public.formation_submissions where id=r.submission_id),(select activity_id from public.formation_performances where id=r.performance_id)) and cohort_id=p_cohort;
  select act into item from jsonb_array_elements(manifest->'cycles') cy cross join lateral jsonb_array_elements(cy->'activities') act where act->>'key'=a.item_key;
  if item->>'rubric_key' is distinct from p_body->>'rubric_key' then raise exception 'Rubric does not match evidence' using errcode='22023';end if;
  rubric=null;
  select value into rubric from jsonb_array_elements(manifest->'rubrics') where value->>'key'=p_body->>'rubric_key';
  if rubric is null then raise exception 'Unknown rubric' using errcode='22023';end if;
  if jsonb_typeof(p_body->'observations')<>'object' then raise exception 'Missing observations' using errcode='22023';end if;
  for x in select value from jsonb_array_elements(rubric->'criteria') loop
   if not coalesce((p_body->'observations'->> (x.value->>'key'))=any(array['not_observed','support','developing','consistent','transfer']),false) then raise exception 'Invalid criterion' using errcode='22023';end if;
  end loop;
  insert into public.formation_assessments(review_id,cohort_id,author_id,rubric_key,observations,narrative)
  values(r.id,p_cohort,p_actor,p_body->>'rubric_key',p_body->'observations',p_body->>'narrative') returning id into result_id;
 elsif p_action='self_review' then
  select * into s from public.formation_submissions where id=(p_body->>'submission_id')::uuid and cohort_id=p_cohort and user_id=p_actor;
  if not found then raise exception 'Forbidden' using errcode='42501';end if;
  insert into public.formation_reviews(cohort_id,reviewer_id,subject_id,submission_id,kind) values(p_cohort,p_actor,p_actor,s.id,'self') returning id into result_id;
 else
  if m.role<>'teacher' then raise exception 'Teacher required' using errcode='42501';end if;
  if p_action='schedule' then
   if p_body->>'meeting_url' is not null and p_body->>'meeting_url'<>'' and p_body->>'meeting_url' !~ '^https://' then raise exception 'HTTPS required' using errcode='22023';end if;
   update public.formation_activities set starts_at=nullif(p_body->>'starts_at','')::timestamptz,ends_at=nullif(p_body->>'ends_at','')::timestamptz,
   meeting_url=nullif(p_body->>'meeting_url',''),status=coalesce(p_body->>'status','open'),revision=revision+1
   where id=(p_body->>'activity_id')::uuid and cohort_id=p_cohort returning id into result_id;
   if not found then raise exception 'Not found' using errcode='P0002';end if;
  elsif p_action='participation' then
   insert into public.formation_participations(activity_id,cohort_id,user_id,role,attendance) values((p_body->>'activity_id')::uuid,p_cohort,(p_body->>'user_id')::uuid,p_body->>'role',p_body->>'attendance')
   on conflict(activity_id,user_id) do update set role=excluded.role,attendance=excluded.attendance returning activity_id into result_id;
  elsif p_action='performance' then
   if jsonb_array_length(p_body->'participants')<1 then raise exception 'Participants required' using errcode='22023';end if;
   for x in select value from jsonb_array_elements_text(p_body->'participants') loop
    if not exists(select 1 from public.formation_memberships where cohort_id=p_cohort and user_id=x.value::uuid and role='participant' and status='active') then raise exception 'Invalid participant' using errcode='42501';end if;
   end loop;
   insert into public.formation_performances(activity_id,cohort_id,record,participants,occurred_at,created_by)
   values((p_body->>'activity_id')::uuid,p_cohort,p_body->>'record',array(select value::uuid from jsonb_array_elements_text(p_body->'participants')), (p_body->>'occurred_at')::timestamptz,p_actor) returning id into result_id;
  elsif p_action='assign_review' then
   if p_body->>'submission_id' is not null then
    select * into s from public.formation_submissions where id=(p_body->>'submission_id')::uuid and cohort_id=p_cohort;
    if not found or s.user_id<>(p_body->>'subject_id')::uuid then raise exception 'Invalid subject' using errcode='42501';end if;
   else
    select * into perf from public.formation_performances where id=(p_body->>'performance_id')::uuid and cohort_id=p_cohort;
    if not found or not (p_body->>'subject_id')::uuid=any(perf.participants) then raise exception 'Invalid subject' using errcode='42501';end if;
   end if;
   if not exists(select 1 from public.formation_memberships where cohort_id=p_cohort and user_id=(p_body->>'reviewer_id')::uuid and status='active' and
    ((p_body->>'kind'='teacher' and role='teacher') or (p_body->>'kind'='panel' and role in('teacher','evaluator')) or (p_body->>'kind'='peer' and role='participant' and user_id<>(p_body->>'subject_id')::uuid))) then raise exception 'Invalid reviewer role' using errcode='42501';end if;
   insert into public.formation_reviews(cohort_id,reviewer_id,subject_id,submission_id,performance_id,kind)
   values(p_cohort,(p_body->>'reviewer_id')::uuid,(p_body->>'subject_id')::uuid,(p_body->>'submission_id')::uuid,(p_body->>'performance_id')::uuid,p_body->>'kind') returning id into result_id;
  else raise exception 'Unknown command' using errcode='22023';end if;
 end if;
 -- Never log private notebook contents or activity.
 if p_action<>'codex' then insert into public.formation_events(cohort_id,actor_id,event_type,entity_id) values(p_cohort,p_actor,p_action,result_id);end if;
 return jsonb_build_object('id',result_id,'revision',v);
end$$;
revoke all on function public.formation_command(uuid,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.formation_command(uuid,uuid,text,jsonb) to service_role;

create function public.formation_enroll(p_admin uuid,p_cohort uuid,p_user uuid,p_role text) returns void language plpgsql security invoker set search_path='' as $$
declare cap int;n int;begin
 if not exists(select 1 from public.users where id=p_admin and role='admin' and suspended_at is null) then raise exception 'Admin required' using errcode='42501';end if;
 select capacity into cap from public.formation_cohorts where id=p_cohort for update;
 if not found then raise exception 'Not found' using errcode='P0002';end if;
 if exists(select 1 from public.formation_memberships where cohort_id=p_cohort and user_id=p_user) then raise exception 'Already enrolled' using errcode='PT409';end if;
 select count(*) into n from public.formation_memberships where cohort_id=p_cohort and role='participant' and status in('active','paused');
 if p_role='participant' and n>=cap then raise exception 'Cohort full' using errcode='PT409';end if;
 insert into public.formation_memberships(cohort_id,user_id,role) values(p_cohort,p_user,p_role);
 insert into public.formation_events(cohort_id,actor_id,event_type,entity_id) values(p_cohort,p_admin,'enrolled',p_user);
end$$;
revoke all on function public.formation_enroll(uuid,uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.formation_enroll(uuid,uuid,uuid,text) to service_role;

create function public.formation_publish(p_admin uuid,p_manifest jsonb,p_hash text,p_commit text) returns uuid language plpgsql security invoker set search_path='' as $$
declare prog uuid;rel public.formation_releases;begin
 if not exists(select 1 from public.users where id=p_admin and role='admin' and suspended_at is null) then raise exception 'Admin required' using errcode='42501';end if;
 if p_manifest->>'editorial_status' is distinct from 'approved' or coalesce(length(trim(p_manifest->>'approval_note')),0)=0 then raise exception 'Editorial approval required' using errcode='22023';end if;
 if p_commit !~ '^[a-f0-9]{40}$' then raise exception 'Source commit required' using errcode='22023';end if;
 insert into public.formation_programs(slug,title) values(p_manifest->>'slug',p_manifest->>'title') on conflict(slug) do nothing;
 select id into prog from public.formation_programs where slug=p_manifest->>'slug' for update;
 select * into rel from public.formation_releases where program_id=prog and version=p_manifest->>'version';
 if found then
 if rel.hash<>p_hash then raise exception 'Version content changed' using errcode='PT409';end if;return rel.id;end if;
 insert into public.formation_releases(program_id,version,hash,manifest,source_commit,approved_by) values(prog,p_manifest->>'version',p_hash,p_manifest,p_commit,p_admin) returning * into rel;
 return rel.id;
end$$;
create function public.formation_create_cohort(p_admin uuid,p_release uuid,p_title text,p_teacher uuid) returns uuid language plpgsql security invoker set search_path='' as $$
declare c uuid;rel public.formation_releases;cy jsonb;act jsonb;begin
 if not exists(select 1 from public.users where id=p_admin and role='admin' and suspended_at is null) then raise exception 'Admin required' using errcode='42501';end if;
 select * into rel from public.formation_releases where id=p_release;
 if not found then raise exception 'Release not found';end if;
 insert into public.formation_cohorts(program_id,release_id,title) values(rel.program_id,rel.id,p_title) returning id into c;
 insert into public.formation_memberships(cohort_id,user_id,role) values(c,p_teacher,'teacher');
 for cy in select value from jsonb_array_elements(rel.manifest->'cycles') loop
  for act in select value from jsonb_array_elements(cy->'activities') loop
   insert into public.formation_activities(cohort_id,release_id,cycle_key,item_key) values(c,rel.id,cy->>'key',act->>'key');
  end loop;
 end loop;return c;
end$$;
revoke all on function public.formation_publish(uuid,jsonb,text,text),public.formation_create_cohort(uuid,uuid,text,uuid) from public,anon,authenticated;
grant execute on function public.formation_publish(uuid,jsonb,text,text),public.formation_create_cohort(uuid,uuid,text,uuid) to service_role;

create index formation_membership_user on public.formation_memberships(user_id,cohort_id);
create index formation_submission_owner on public.formation_submissions(cohort_id,user_id);
create index formation_review_reviewer on public.formation_reviews(reviewer_id,cohort_id);
create index formation_codex_owner on public.formation_codex(cohort_id,user_id);
create unique index formation_review_submission_once on public.formation_reviews(submission_id,reviewer_id,subject_id,kind) where submission_id is not null;
create unique index formation_review_performance_once on public.formation_reviews(performance_id,reviewer_id,subject_id,kind) where performance_id is not null;
-- Storage is private; upload/download authorization happens in verified route handlers.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('formation-artifacts','formation-artifacts',false,10485760,array['application/pdf','text/plain']) on conflict(id) do nothing;
-- SOURCE 20261010211812_close_u00_u05.sql
alter table public.users drop constraint users_role_check;
alter table public.users add constraint users_role_check check(role in ('admin','teacher','student'));
-- Public-only baselines omit triggers on auth.users. Reconcile without duplicate provisioning.
do $$begin
 if not exists(select 1 from pg_trigger where tgrelid='auth.users'::regclass and tgfoid='public.handle_new_user()'::regprocedure and not tgisinternal) then
 create trigger liceu_auth_profile after insert on auth.users for each row execute function public.handle_new_user();
 end if;
end$$;
update storage.buckets set public=false where id='assignment-files';

create table public.newsletter_subscribers(email text primary key,subscribed_at timestamptz not null default now(),active boolean not null default false,consent_at timestamptz not null default now());
alter table public.newsletter_subscribers enable row level security;
revoke all on public.newsletter_subscribers from public,anon,authenticated;
grant all on public.newsletter_subscribers to service_role;
alter table public.liceu_work_drafts add column revision integer not null default 1;
alter table public.liceu_work_versions add column request_id uuid unique;
create function public.liceu_save_work(p_user uuid,p_exercise uuid,p_content text,p_revision integer,p_publish boolean,p_request uuid) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare m uuid;v integer;result uuid;old public.liceu_work_versions;begin
 perform pg_advisory_xact_lock(hashtextextended(p_user::text||p_exercise::text,0));
 select l.module_id into m from public.liceu_exercises e join public.liceu_lessons l on l.id=e.lesson_id where e.id=p_exercise and e.is_published and l.is_published;
 if m is null or not liceu_private.can_study(p_user,m) then raise exception 'Forbidden' using errcode='42501';end if;
 if p_publish then
  if p_request is null then raise exception 'Request id required' using errcode='22023';end if;
  select * into old from public.liceu_work_versions where request_id=p_request;
  if found then
   if old.user_id<>p_user or old.exercise_id<>p_exercise or old.content<>p_content then raise exception 'Request conflict' using errcode='PT409';end if;
   return jsonb_build_object('id',old.id,'revision',(select revision from public.liceu_work_drafts where user_id=p_user and exercise_id=p_exercise));
  end if;
 end if;
 select revision into v from public.liceu_work_drafts where user_id=p_user and exercise_id=p_exercise;
 if p_revision is null or coalesce(v,0)<>p_revision then raise exception 'Draft changed' using errcode='PT409';end if;
 if p_content is null or length(p_content)>50000 or (p_publish and length(trim(p_content))=0) then raise exception 'Invalid content' using errcode='22023';end if;
 v=coalesce(v,0)+1;
 insert into public.liceu_work_drafts(user_id,exercise_id,content,revision) values(p_user,p_exercise,p_content,v)
 on conflict(user_id,exercise_id) do update set content=excluded.content,revision=excluded.revision,updated_at=now();
 if p_publish then insert into public.liceu_work_versions(user_id,exercise_id,content,request_id) values(p_user,p_exercise,p_content,p_request) returning id into result;end if;
 return jsonb_build_object('id',result,'revision',v);
end$$;
revoke all on function public.liceu_save_work(uuid,uuid,text,integer,boolean,uuid) from public,anon,authenticated;
grant execute on function public.liceu_save_work(uuid,uuid,text,integer,boolean,uuid) to service_role;
create trigger immutable_course_work before update on public.liceu_work_versions for each row execute function liceu_private.formation_immutable();

alter table public.liceu_service_orders add column payment_intent_id text unique;
alter table public.liceu_service_orders add column refund_id text;
alter table public.liceu_service_orders drop constraint liceu_service_orders_status_check;
alter table public.liceu_service_orders add constraint liceu_service_orders_status_check check(status in('requested','offered','paid','completed','cancelled','refund_requested','refund_pending','refunded'));
create table public.liceu_service_events(id bigint generated always as identity primary key,order_id uuid not null references public.liceu_service_orders,event_key text not null unique,kind text not null,actor_id uuid,created_at timestamptz not null default now());
alter table public.liceu_service_events enable row level security;
revoke all on public.liceu_service_events from public,anon,authenticated;
grant all on public.liceu_service_events to service_role;
grant usage,select on sequence public.liceu_service_events_id_seq to service_role;
create function public.liceu_record_service_payment(p_order uuid,p_user uuid,p_session text,p_intent text,p_event text) returns void language plpgsql security invoker set search_path='' as $$
declare o public.liceu_service_orders;begin
 select * into o from public.liceu_service_orders where id=p_order for update;
 if not found or o.user_id<>p_user then raise exception 'Owner mismatch' using errcode='42501';end if;
 if exists(select 1 from public.liceu_service_events where event_key=p_event) then return;end if;
 if o.stripe_session_id=p_session and o.status in('paid','completed','refund_requested','refund_pending','refunded') then return;end if;
 if o.status<>'offered' or (o.stripe_session_id is not null and o.stripe_session_id<>p_session) or p_intent is null then raise exception 'Payment needs reconciliation' using errcode='PT409';end if;
 update public.liceu_service_orders set status='paid',stripe_session_id=p_session,payment_intent_id=p_intent,updated_at=now() where id=p_order;
 insert into public.liceu_service_events(order_id,event_key,kind) values(p_order,p_event,'payment');
end$$;
revoke all on function public.liceu_record_service_payment(uuid,uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.liceu_record_service_payment(uuid,uuid,text,text,text) to service_role;
create table public.liceu_billing_locks(entity text primary key,token uuid not null,expires_at timestamptz not null);
alter table public.liceu_billing_locks enable row level security;
revoke all on public.liceu_billing_locks from public,anon,authenticated;
grant all on public.liceu_billing_locks to service_role;
create function public.liceu_lock_billing_entity(p_entity text,p_token uuid) returns boolean language plpgsql security invoker set search_path='' as $$begin
 insert into public.liceu_billing_locks(entity,token,expires_at) values(p_entity,p_token,now()+interval '1 minute')
 on conflict(entity) do update set token=excluded.token,expires_at=excluded.expires_at where public.liceu_billing_locks.expires_at<now();
 return found;
end$$;
create function public.liceu_unlock_billing_entity(p_entity text,p_token uuid) returns void language sql security invoker set search_path='' as $$delete from public.liceu_billing_locks where entity=p_entity and token=p_token$$;
revoke all on function public.liceu_lock_billing_entity(text,uuid),public.liceu_unlock_billing_entity(text,uuid) from public,anon,authenticated;
grant execute on function public.liceu_lock_billing_entity(text,uuid),public.liceu_unlock_billing_entity(text,uuid) to service_role;
-- SOURCE 20261011030827_operational_recovery_and_privacy.sql
-- Request actor comes only from a verified server route, never a browser supplied id.
create table public.liceu_audit_events(
 id bigint generated always as identity primary key,
 actor_id uuid, source text not null, action text not null, target_type text not null,
 target_id text, old_values jsonb, new_values jsonb, created_at timestamptz not null default now());
alter table public.liceu_audit_events enable row level security;
revoke all on public.liceu_audit_events from public,anon,authenticated;
grant select,insert on public.liceu_audit_events to service_role;
grant usage,select on sequence public.liceu_audit_events_id_seq to service_role;
create function liceu_private.audit_change() returns trigger language plpgsql security definer set search_path='' as $$
declare actor uuid; h jsonb; before_row jsonb; after_row jsonb;
begin
 h:=coalesce(nullif(current_setting('request.headers',true),''),'{}')::jsonb;
 actor:=nullif(h->>'x-liceu-actor','')::uuid;
 if actor is not null and (auth.role()<>'service_role' or not exists(select 1 from public.users where id=actor and suspended_at is null)) then
  raise exception 'Unverified audit actor' using errcode='42501';
 end if;
 -- Never copy drafts, feedback, email, tokens or financial payloads into an immutable log.
 if TG_OP<>'INSERT' then before_row:=jsonb_build_object('status',to_jsonb(old)->'status','role',to_jsonb(old)->'role','teacher_id',to_jsonb(old)->'teacher_id','suspended_at',to_jsonb(old)->'suspended_at');end if;
 if TG_OP<>'DELETE' then after_row:=jsonb_build_object('status',to_jsonb(new)->'status','role',to_jsonb(new)->'role','teacher_id',to_jsonb(new)->'teacher_id','suspended_at',to_jsonb(new)->'suspended_at');end if;
 insert into public.liceu_audit_events(actor_id,source,action,target_type,target_id,old_values,new_values)
 values(actor,case when actor is null then 'system' else 'verified_user' end,TG_OP,TG_TABLE_NAME,
 coalesce(to_jsonb(new)->>'id',to_jsonb(old)->>'id',to_jsonb(new)->>'booking_uid',to_jsonb(old)->>'booking_uid'),before_row,after_row);
 return coalesce(new,old);
end $$;
do $$declare t text;begin
 foreach t in array array['users','profiles','access_grants','partnerships','partnership_members','assignment_submissions',
 'liceu_modules','liceu_lessons','liceu_theoretical_content','liceu_exercises','liceu_quiz_questions','liceu_flashcards','liceu_service_orders','liceu_mentoring_bookings',
 'module_texts','module_assignments','lessons','flashcards','flashcard_sets'] loop
 execute format('create trigger audit_mutation after insert or update or delete on public.%I for each row execute function liceu_private.audit_change()',t);
 end loop;
end$$;

create table public.liceu_webhook_inbox(
 provider text not null check(provider in('stripe','cal')), event_id text not null,
 payload jsonb not null, status text not null default 'pending' check(status in('pending','processing','failed','done')),
 attempts int not null default 0, lease_token uuid, lease_until timestamptz,
 error_code text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 primary key(provider,event_id));
alter table public.liceu_webhook_inbox enable row level security;
revoke all on public.liceu_webhook_inbox from public,anon,authenticated;
grant all on public.liceu_webhook_inbox to service_role;
create function public.liceu_receive_event(p_provider text,p_id text,p_payload jsonb,p_token uuid) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare r public.liceu_webhook_inbox;
begin
 if length(p_id)>200 or p_token is null or octet_length(p_payload::text)>1048576 then raise exception 'Invalid event';end if;
 insert into public.liceu_webhook_inbox(provider,event_id,payload) values(p_provider,p_id,p_payload) on conflict do nothing;
 select * into r from public.liceu_webhook_inbox where provider=p_provider and event_id=p_id for update;
 if r.status='done' then return jsonb_build_object('state','done');end if;
 if r.status='processing' and r.lease_until>now() then return jsonb_build_object('state','busy');end if;
 update public.liceu_webhook_inbox set status='processing',lease_token=p_token,lease_until=now()+interval '5 minutes',attempts=attempts+1,updated_at=now() where provider=p_provider and event_id=p_id;
 return jsonb_build_object('state','claimed','payload',r.payload);
end $$;
create function public.liceu_finish_event(p_provider text,p_id text,p_token uuid,p_error text default null) returns boolean
language plpgsql security invoker set search_path='' as $$
begin
 update public.liceu_webhook_inbox set status=case when p_error is null then 'done' else 'failed' end,
 error_code=left(p_error,100),lease_token=null,lease_until=null,updated_at=now()
 where provider=p_provider and event_id=p_id and lease_token=p_token and status='processing';
 return found;
end $$;

alter table public.liceu_mentoring_bookings add column event_at timestamptz not null default '-infinity';
alter table public.liceu_service_orders add column cal_event_at timestamptz not null default '-infinity';
-- Existing duplicate active bookings require explicit review, never silently drop them.
create unique index liceu_one_active_booking on public.liceu_mentoring_bookings(order_id) where status='scheduled';
create or replace function liceu_private.liceu_apply_cal(p_event jsonb) returns text
language plpgsql security definer set search_path='' as $$
declare p jsonb:=p_event->'payload'; typ text:=p_event->>'triggerEvent'; o public.liceu_service_orders;
 at_time timestamptz; starts timestamptz; ends timestamptz; uid text; prev text; existing public.liceu_mentoring_bookings;
 email text; teacher_email text; cancelled boolean;
begin
 if typ not in('BOOKING_CREATED','BOOKING_RESCHEDULED','BOOKING_CANCELLED','BOOKING_REJECTED') then return 'ignored';end if;
 at_time:=(p_event->>'createdAt')::timestamptz;starts:=(p->>'startTime')::timestamptz;ends:=(p->>'endTime')::timestamptz;
 uid:=p->>'uid';prev:=p->>'rescheduleUid';cancelled:=typ in('BOOKING_CANCELLED','BOOKING_REJECTED');
 if at_time is null or at_time>now()+interval '5 minutes' or starts is null or ends<=starts or length(uid) not between 1 and 200 then raise exception 'Invalid booking';end if;
 select * into strict o from public.liceu_service_orders where id=(p->'metadata'->>'liceu_order_id')::uuid for update;
 if o.kind<>'mentoring' then raise exception 'Not mentoring';end if;
 if at_time<=o.cal_event_at then return 'stale';end if;
 select u.email into email from auth.users u where u.id=o.user_id;
 select u.email into teacher_email from public.users u where u.id=o.teacher_id and u.suspended_at is null;
 if email is null or teacher_email is null or lower(p->'organizer'->>'email') is distinct from lower(teacher_email)
 or not exists(select 1 from jsonb_array_elements(p->'attendees') a where lower(a->>'email')=lower(email)) then raise exception 'Booking identity mismatch';end if;
 if not cancelled and (o.status not in('paid','completed') or o.duration_minutes is null or extract(epoch from ends-starts)<>o.duration_minutes*60) then raise exception 'Booking offer mismatch';end if;
 if exists(select 1 from public.liceu_mentoring_bookings where booking_uid=uid and order_id<>o.id) then raise exception 'UID belongs to another order';end if;
 select * into existing from public.liceu_mentoring_bookings where order_id=o.id and status='scheduled' for update;
 if not cancelled and existing.booking_uid is not null and existing.booking_uid<>uid then
  if typ<>'BOOKING_RESCHEDULED' or prev is distinct from existing.booking_uid then raise exception 'Duplicate active booking' using errcode='PT409';end if;
  update public.liceu_mentoring_bookings set status='cancelled',event_at=at_time,updated_at=now() where booking_uid=prev;
 end if;
 -- A cancellation of a superseded UID must not cancel the replacement.
 insert into public.liceu_mentoring_bookings(booking_uid,order_id,start_time,end_time,status,event_at)
 values(uid,o.id,starts,ends,case when cancelled then 'cancelled' else 'scheduled' end,at_time)
 on conflict(booking_uid) do update set start_time=excluded.start_time,end_time=excluded.end_time,status=excluded.status,event_at=excluded.event_at,updated_at=now()
 where public.liceu_mentoring_bookings.event_at<excluded.event_at;
 update public.liceu_service_orders set cal_event_at=at_time where id=o.id;
 return 'applied';
end $$;
create or replace function public.liceu_apply_cal(p_event jsonb) returns text language sql security invoker set search_path='' as $$select liceu_private.liceu_apply_cal(p_event)$$;
revoke all on function liceu_private.liceu_apply_cal(jsonb) from public,anon,authenticated;
grant execute on function liceu_private.liceu_apply_cal(jsonb) to service_role;

create table public.liceu_legacy_resolutions(
 id uuid primary key default gen_random_uuid(),event_id text not null unique references public.liceu_legacy_billing_events,
 verified_email text not null, expires_at timestamptz not null, rationale text not null check(length(rationale) between 20 and 3000),
 approved_by uuid not null references public.users, approved_at timestamptz not null default now(),
 claimed_by uuid references public.users, claimed_at timestamptz, grant_id uuid references public.access_grants);
alter table public.liceu_legacy_resolutions enable row level security;
revoke all on public.liceu_legacy_resolutions from public,anon,authenticated;
grant all on public.liceu_legacy_resolutions to service_role;
create trigger audit_mutation after insert or update on public.liceu_legacy_resolutions for each row execute function liceu_private.audit_change();
create function public.liceu_resolve_legacy(p_actor uuid,p_event text,p_email text,p_until timestamptz,p_reason text) returns uuid
language plpgsql security invoker set search_path='' as $$
declare e public.liceu_legacy_billing_events;r uuid;
begin
 if not exists(select 1 from public.users where id=p_actor and role='admin' and suspended_at is null) then raise exception 'Forbidden' using errcode='42501';end if;
 select * into strict e from public.liceu_legacy_billing_events where event_id=p_event for update;
 if e.payload->>'payment_status' is distinct from 'paid' or p_until<=now() or p_until is null or p_email !~ '^[^ @]+@[^ @]+\.[^ @]+$' then raise exception 'Unverified paid source';end if;
 if lower(coalesce(e.payload->'customer_details'->>'email',e.payload->>'customer_email',''))<>lower(trim(p_email)) then raise exception 'Payer email mismatch';end if;
 insert into public.liceu_legacy_resolutions(event_id,verified_email,expires_at,rationale,approved_by)
 values(p_event,lower(trim(p_email)),p_until,p_reason,p_actor) returning id into r;
 update public.liceu_legacy_billing_events set resolved_at=now() where event_id=p_event;
 return r;
end $$;
create or replace function liceu_private.liceu_claim_legacy(p_user uuid) returns integer
language plpgsql security definer set search_path='' as $$
declare email text;r public.liceu_legacy_resolutions;g uuid;n int:=0;
begin
 select lower(u.email) into email from auth.users u join public.users p on p.id=u.id
 where u.id=p_user and u.email_confirmed_at is not null and p.suspended_at is null;
 if email is null then return 0;end if;
 for r in select * from public.liceu_legacy_resolutions where verified_email=email and claimed_by is null and expires_at>now() for update loop
 insert into public.access_grants(user_id,grant_type,granted_by,expires_at,source_type,metadata)
 values(p_user,'admin_override',r.approved_by,r.expires_at,'legacy_reconciliation',jsonb_build_object('resolution_id',r.id))
 returning id into g;
 update public.liceu_legacy_resolutions set claimed_by=p_user,claimed_at=now(),grant_id=g where id=r.id;
 n:=n+1;
 end loop;
 return n;
end $$;
create or replace function public.liceu_claim_legacy(p_user uuid) returns integer language sql security invoker set search_path='' as $$select liceu_private.liceu_claim_legacy(p_user)$$;
revoke all on function liceu_private.liceu_claim_legacy(uuid) from public,anon,authenticated;
grant execute on function liceu_private.liceu_claim_legacy(uuid) to service_role;
-- Service-only RPC surface. Authorization is rechecked for administrative commands.
revoke all on function public.liceu_receive_event(text,text,jsonb,uuid),public.liceu_finish_event(text,text,uuid,text),public.liceu_apply_cal(jsonb),public.liceu_resolve_legacy(uuid,text,text,timestamptz,text),public.liceu_claim_legacy(uuid) from public,anon,authenticated;
grant execute on function public.liceu_receive_event(text,text,jsonb,uuid),public.liceu_finish_event(text,text,uuid,text),public.liceu_apply_cal(jsonb),public.liceu_resolve_legacy(uuid,text,text,timestamptz,text),public.liceu_claim_legacy(uuid) to service_role;

-- A reviewed erasure request has explicit retention reasons and a finite review date.
create table public.liceu_privacy_requests(
 id uuid primary key default gen_random_uuid(),user_id uuid not null unique references public.users,
 status text not null default 'requested' check(status in('requested','approved','processing','completed')),
 requested_at timestamptz not null default now(),approved_by uuid references public.users,
 retention_reason text,retention_until timestamptz,shared_reviewed boolean not null default false,
 step text not null default 'review',last_error text,completed_at timestamptz);
create table public.liceu_privacy_files(
 request_id uuid not null references public.liceu_privacy_requests,bucket text not null,path text not null,
 removed_at timestamptz,primary key(request_id,bucket,path));
alter table public.liceu_privacy_requests enable row level security;
alter table public.liceu_privacy_files enable row level security;
revoke all on public.liceu_privacy_requests,public.liceu_privacy_files from public,anon,authenticated;
grant all on public.liceu_privacy_requests,public.liceu_privacy_files to service_role;
create trigger audit_mutation after insert or update on public.liceu_privacy_requests for each row execute function liceu_private.audit_change();
create function public.liceu_approve_erasure(p_actor uuid,p_request uuid,p_reason text,p_until timestamptz,p_reviewed boolean) returns void
language plpgsql security invoker set search_path='' as $$
declare r public.liceu_privacy_requests;
begin
 if not exists(select 1 from public.users where id=p_actor and role='admin' and suspended_at is null) then raise exception 'Forbidden' using errcode='42501';end if;
 select * into strict r from public.liceu_privacy_requests where id=p_request for update;
 if r.status<>'requested' then return;end if;
 if p_actor=r.user_id then raise exception 'Independent reviewer required';end if;
 if p_reviewed is distinct from true or length(trim(p_reason))<20 or p_until is null or p_until<=now() then raise exception 'Retention and shared evidence review required';end if;
 if exists(select 1 from public.liceu_service_orders where user_id=r.user_id and status in('offered','paid','refund_requested','refund_pending'))
 or exists(select 1 from public.liceu_subscriptions where user_id=r.user_id and status not in('canceled','incomplete_expired'))
 or exists(select 1 from public.liceu_service_orders where teacher_id=r.user_id and status in('offered','paid','refund_requested','refund_pending'))
 then raise exception 'Resolve outstanding billing or teaching obligations first' using errcode='PT409';end if;
 update public.liceu_privacy_requests set status='approved',approved_by=p_actor,retention_reason=p_reason,retention_until=p_until,shared_reviewed=true,step='revoke' where id=p_request;
end $$;
-- Published content can only be redacted from this reviewed, service-only erasure transaction.
create or replace function liceu_private.formation_immutable() returns trigger language plpgsql set search_path='' as $$
begin
 if current_setting('liceu.erasure_request',true)<>'' and auth.role()='service_role'
 and exists(select 1 from public.liceu_privacy_requests where id=current_setting('liceu.erasure_request')::uuid and status='processing' and shared_reviewed) then return coalesce(new,old);end if;
 raise exception 'Published evidence is immutable';
end $$;
create function public.liceu_scrub_personal_data(p_request uuid) returns void
language plpgsql security invoker set search_path='' as $$
declare r public.liceu_privacy_requests; v_email text;t text;
begin
 select * into strict r from public.liceu_privacy_requests where id=p_request for update;
 if r.step in('auth','done') then return;end if;
 if r.status<>'processing' or r.step<>'data' then raise exception 'Erasure out of order';end if;
 if exists(select 1 from public.liceu_privacy_files where request_id=r.id and removed_at is null) then raise exception 'Files remain';end if;
 perform set_config('liceu.erasure_request',r.id::text,true);
 select u.email into v_email from public.users u where u.id=r.user_id;
 delete from public.formation_drafts where user_id=r.user_id;
 delete from public.formation_codex where user_id=r.user_id;
 delete from public.formation_artifacts where user_id=r.user_id;
 update public.formation_submissions set body='[Conteúdo retirado por solicitação do titular]' where user_id=r.user_id;
 update public.formation_assessments set narrative='[Conteúdo retirado por solicitação do titular]',observations='{}'
 where author_id=r.user_id or review_id in(select id from public.formation_reviews where subject_id=r.user_id);
 -- Collective records remain structurally intact; their personal narrative is redacted after reviewer approval.
 update public.formation_performances set record='[Registro textual retirado após revisão de privacidade]'
 where r.user_id=any(participants) or created_by=r.user_id;
 update public.formation_memberships set status='withdrawn' where user_id=r.user_id;
 delete from public.liceu_work_drafts where user_id=r.user_id;
 update public.liceu_work_versions set content='[Conteúdo retirado por solicitação do titular]' where user_id=r.user_id;
 update public.liceu_service_orders set scope='[Retido apenas para conciliação financeira]',feedback=null,rubric=null where user_id=r.user_id;
 foreach t in array array['diagnostic_sessions','mentoring_applications','assignment_submissions','quiz_attempts','flashcard_progress','module_progress','lesson_progress','notifications','mentorship_waitlist','mentorship_bookings','liceu_quiz_attempts','liceu_flashcard_progress','liceu_module_completions','liceu_learner_progression'] loop
 execute format('delete from public.%I where user_id=$1',t) using r.user_id;
 end loop;
 delete from public.newsletter_subscribers where lower(public.newsletter_subscribers.email)=lower(v_email);
 -- Only anonymous pre-account records matching the verified old email, never another account.
 delete from public.diagnostic_sessions where user_id is null and lower(public.diagnostic_sessions.email)=lower(v_email);
 delete from public.mentoring_applications where user_id is null and lower(public.mentoring_applications.email)=lower(v_email);
 update public.users set email=null,name='Conta encerrada',metadata='{}',role='student',last_login_at=null,suspension_reason='privacy_erasure',updated_at=now() where id=r.user_id;
 update public.profiles set email=null,role='student' where id=r.user_id;
 update public.liceu_privacy_requests set step='auth',last_error=null where id=r.id;
end $$;
revoke all on function public.liceu_approve_erasure(uuid,uuid,text,timestamptz,boolean),public.liceu_scrub_personal_data(uuid) from public,anon,authenticated;
grant execute on function public.liceu_approve_erasure(uuid,uuid,text,timestamptz,boolean),public.liceu_scrub_personal_data(uuid) to service_role;

create function public.liceu_plan_privacy_files(p_request uuid) returns void
language plpgsql security invoker set search_path='' as $$
declare r public.liceu_privacy_requests;
begin
 select * into strict r from public.liceu_privacy_requests where id=p_request for update;
 if r.status not in('approved','processing') or r.step<>'revoke' then raise exception 'Invalid erasure step';end if;
 insert into public.liceu_privacy_files(request_id,bucket,path)
 select r.id,o.bucket_id,o.name from storage.objects o where o.owner_id=r.user_id::text
 or (o.bucket_id='assignment-files' and split_part(o.name,'/',1)=r.user_id::text)
 or (o.bucket_id='formation-artifacts' and exists(select 1 from public.formation_artifacts a where a.user_id=r.user_id and a.path=o.name))
 on conflict do nothing;
end $$;
revoke all on function public.liceu_plan_privacy_files(uuid) from public,anon,authenticated;
grant execute on function public.liceu_plan_privacy_files(uuid) to service_role;
create function liceu_private.active_identity() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.users where id=auth.uid() and suspended_at is null)
$$;
revoke all on function liceu_private.active_identity() from public,anon;
grant execute on function liceu_private.active_identity() to authenticated,service_role;
do $$declare t text;begin
 foreach t in array array['liceu_subscriptions','liceu_work_versions','liceu_work_drafts','liceu_quiz_attempts','liceu_module_completions','liceu_flashcard_progress','liceu_service_orders',
 'formation_memberships','formation_activities','formation_participations','formation_submissions','formation_drafts','formation_codex','formation_reviews','formation_assessments','formation_artifacts','formation_performances'] loop
 execute format('create policy active_identity_required on public.%I as restrictive for all to authenticated using(liceu_private.active_identity()) with check(liceu_private.active_identity())',t);
 end loop;
end$$;
notify pgrst, 'reload schema';
commit;
