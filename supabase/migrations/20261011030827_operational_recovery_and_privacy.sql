begin;
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
commit;
