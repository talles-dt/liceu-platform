-- Additive migration against the reconciled 2026-10-08 public baseline.
-- Do not replay historical repository migrations against the live database.
begin;
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

commit;
