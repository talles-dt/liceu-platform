begin;
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
commit;
