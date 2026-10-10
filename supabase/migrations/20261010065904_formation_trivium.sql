-- Formation is independent from module completion and commercial subscriptions.
-- All writes use service-only commands after verified identity; RLS protects reads too.
begin;
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
commit;
