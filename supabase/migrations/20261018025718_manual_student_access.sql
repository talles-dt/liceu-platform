-- Atomic, retryable completion of an Auth account created by the admin screen.
begin;
create function public.liceu_provision_student(p_actor uuid,p_user uuid,p_access text,p_cohort uuid default null,p_scope text default '',p_expires timestamptz default null)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare a auth.users; g uuid; existing public.users; begin
 if not exists(select 1 from public.users where id=p_actor and role='admin' and suspended_at is null) then raise exception 'Admin required' using errcode='42501';end if;
 if p_access is null or p_access not in('none','formation','mentoring','both') then raise exception 'Invalid access' using errcode='22023';end if;
 select * into a from auth.users where id=p_user for update;
 if not found or a.raw_app_meta_data->>'manual_provisioning_by' is distinct from p_actor::text then raise exception 'Provisioning ownership required' using errcode='42501';end if;
 -- A retry cannot silently change a completed provisioning operation.
 if a.raw_app_meta_data->'manual_access'->>'access' is distinct from p_access or (a.raw_app_meta_data->'manual_access'->>'cohortId')::uuid is distinct from p_cohort or a.raw_app_meta_data->'manual_access'->>'scope' is distinct from p_scope or (a.raw_app_meta_data->'manual_access'->>'expiresAt')::timestamptz is distinct from p_expires then raise exception 'Provisioning choices changed' using errcode='22023';end if;
 select * into existing from public.users where id=p_user;
 if found and (existing.role<>'student' or existing.suspended_at is not null) then raise exception 'Student account required' using errcode='42501';end if;
 insert into public.users(id,email,name,role) values(p_user,a.email,a.raw_user_meta_data->>'name','student') on conflict(id) do nothing;
 if p_access in('formation','both') then
  perform 1 from public.formation_cohorts where id=p_cohort and status in('draft','active') for update;
  if not found then raise exception 'Cohort unavailable' using errcode='P0002';end if;
  if not exists(select 1 from public.formation_memberships where cohort_id=p_cohort and user_id=p_user) then
   perform public.formation_enroll(p_actor,p_cohort,p_user,'participant');
  elsif not exists(select 1 from public.formation_memberships where cohort_id=p_cohort and user_id=p_user and role='participant' and status='active') then
   raise exception 'Membership requires review' using errcode='PT409';
  end if;
 end if;
 if p_access in('mentoring','both') then
  if length(trim(p_scope))<20 or length(p_scope)>3000 or (p_expires is not null and p_expires<=now()) then raise exception 'Invalid mentoring scope or expiry' using errcode='22023';end if;
  select id into g from public.access_grants where user_id=p_user and source_id=p_user and source_type='manual_student_creation' and grant_type='mentorship';
  if g is not null and exists(select 1 from public.access_grants where id=g and (revoked_at is not null or expires_at<=now())) then raise exception 'Grant requires review' using errcode='PT409';end if;
  if g is null then
   g:=public.grant_user_access(p_user,'mentorship',p_actor,'{}'::uuid[],'{}'::uuid[],p_expires,p_user,'manual_student_creation',jsonb_build_object('area','mentoring','scope',p_scope));
  end if;
 end if;
 return jsonb_build_object('userId',p_user,'access',p_access,'cohortId',p_cohort,'mentoringGrantId',g);
end$$;
revoke all on function public.liceu_provision_student(uuid,uuid,text,uuid,text,timestamptz) from public,anon,authenticated;
grant execute on function public.liceu_provision_student(uuid,uuid,text,uuid,text,timestamptz) to service_role;
commit;
