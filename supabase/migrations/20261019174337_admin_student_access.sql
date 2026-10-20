begin;
-- Each operation changes one explicit source of access. Paid orders are never altered.
create or replace function public.liceu_admin_student_access(p_actor uuid,p_user uuid,p_body jsonb)
returns void language plpgsql security invoker set search_path='' as $$
declare
 c public.formation_cohorts; m public.formation_memberships; g public.access_grants;
 before_value jsonb; after_value jsonb; target uuid; wanted text; n int;
begin
 if not exists(select 1 from public.users where id=p_actor and role='admin' and suspended_at is null) then raise exception 'Admin required' using errcode='42501';end if;
 if length(trim(coalesce(p_body->>'reason',''))) not between 5 and 1000 then raise exception 'Reason required' using errcode='22023';end if;
 -- Same cohort lock as formation_enroll, including reactivation and paused reserved seats.
 if p_body->>'action'='formation' then
  select * into c from public.formation_cohorts where id=(p_body->>'cohortId')::uuid for update;
  if not found then raise exception 'Cohort not found' using errcode='P0002';end if;
 end if;
 perform 1 from public.users where id=p_user and role='student' and suspended_at is null for update;
 if not found then raise exception 'Enabled student required' using errcode='42501';end if;
 if p_body->>'action'='formation' then
  select * into m from public.formation_memberships where cohort_id=c.id and user_id=p_user for update;
  before_value:=case when found then to_jsonb(m) else 'null'::jsonb end;
  if before_value is distinct from p_body->'expected' then raise exception 'Stale membership' using errcode='PT409';end if;
  if m.role is not null and m.role<>'participant' then raise exception 'Not a participant membership' using errcode='42501';end if;
  wanted:=p_body->>'status';
  if wanted is null or wanted not in('active','paused','withdrawn','completed') then raise exception 'Invalid status' using errcode='22023';end if;
  if m.role is null and wanted<>'active' then raise exception 'Enroll first' using errcode='22023';end if;
  if wanted in('active','paused') then
   if c.status='closed' then raise exception 'Closed cohort' using errcode='PT409';end if;
   select count(*) into n from public.formation_memberships where cohort_id=c.id and role='participant' and status in('active','paused') and user_id<>p_user;
   if n>=c.capacity then raise exception 'Cohort full' using errcode='PT409';end if;
  end if;
  insert into public.formation_memberships(cohort_id,user_id,role,status) values(c.id,p_user,'participant',wanted)
  on conflict(cohort_id,user_id) do update set status=excluded.status;
  select to_jsonb(x) into after_value from public.formation_memberships x where cohort_id=c.id and user_id=p_user;
  insert into public.formation_events(cohort_id,actor_id,event_type,entity_id) values(c.id,p_actor,'membership_'||wanted,p_user);
  target:=c.id;
 elsif p_body->>'action'='mentoring' then
  target:=(p_body->>'grantId')::uuid;
  if target is null then raise exception 'Grant id required' using errcode='22023';end if;
  select * into g from public.access_grants where id=target for update;
  before_value:=case when found then to_jsonb(g) else 'null'::jsonb end;
  -- Compare timestamp and editable state; legacy triggers may reuse transaction timestamps.
  if (case when g.id is null then 'null'::jsonb else jsonb_build_object('updated_at',g.updated_at,'metadata',g.metadata,'expires_at',g.expires_at,'revoked_at',g.revoked_at) end) is distinct from p_body->'expected' then raise exception 'Stale grant' using errcode='PT409';end if;
  if g.id is not null and (g.user_id<>p_user or g.grant_type<>'mentorship' or coalesce(g.source_type,'') not in('manual_student_creation','admin_student_access') or g.metadata->>'area' is distinct from 'mentoring' or g.revoked_at is not null) then raise exception 'Not an editable manual grant' using errcode='42501';end if;
  if p_body->>'mode'='revoke' then
   if g.id is null then raise exception 'Grant not found' using errcode='P0002';end if;
   update public.access_grants set revoked_at=clock_timestamp(),revoked_by=p_actor,revoke_reason=p_body->>'reason',updated_at=clock_timestamp() where id=target;
  elsif p_body->>'mode'='save' then
   if length(trim(coalesce(p_body->>'scope',''))) not between 20 and 3000 then raise exception 'Scope required' using errcode='22023';end if;
   if (p_body->>'expiresAt')::timestamptz<=now() then raise exception 'Future expiry required' using errcode='22023';end if;
   if g.id is null then
    if exists(select 1 from public.access_grants where user_id=p_user and grant_type='mentorship' and source_type in('manual_student_creation','admin_student_access') and metadata->>'area'='mentoring' and revoked_at is null and (expires_at is null or expires_at>now())) then raise exception 'Edit existing grant' using errcode='PT409';end if;
    insert into public.access_grants(id,user_id,grant_type,source_id,source_type,modules,courses,expires_at,granted_by,metadata)
    values(target,p_user,'mentorship',p_user,'admin_student_access','{}','{}',(p_body->>'expiresAt')::timestamptz,p_actor,jsonb_build_object('area','mentoring','scope',trim(p_body->>'scope')));
   else
    update public.access_grants set expires_at=(p_body->>'expiresAt')::timestamptz,metadata=coalesce(metadata,'{}')||jsonb_build_object('scope',trim(p_body->>'scope')),updated_at=clock_timestamp() where id=target;
   end if;
  else raise exception 'Invalid mode' using errcode='22023';end if;
  select to_jsonb(x) into after_value from public.access_grants x where id=target;
 else raise exception 'Invalid action' using errcode='22023';end if;
 insert into public.audit_logs(actor_id,actor_email,action,target_type,target_id,target_identifier,old_values,new_values,metadata)
 values(p_actor,(select email from public.users where id=p_actor),'user_updated',case when p_body->>'action'='formation' then 'formation_membership' else 'access_grant' end,target,p_user::text,before_value,after_value,jsonb_build_object('reason',trim(p_body->>'reason'),'operation','admin_student_access'));
end $$;
revoke all on function public.liceu_admin_student_access(uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.liceu_admin_student_access(uuid,uuid,jsonb) to service_role;
commit;
