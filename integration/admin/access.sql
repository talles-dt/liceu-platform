-- Local synthetic verification. Run through psql with ON_ERROR_STOP; all fixtures roll back.
begin;
do $$
declare
 a uuid:=gen_random_uuid(); u uuid:=gen_random_uuid(); other_user uuid:=gen_random_uuid();
 c uuid:=gen_random_uuid(); r public.formation_releases; g uuid:=gen_random_uuid();
 m jsonb; b jsonb; stamp jsonb; program uuid:=gen_random_uuid(); audits int;
begin
 assert not has_function_privilege('authenticated','public.liceu_admin_student_access(uuid,uuid,jsonb)','EXECUTE');
 assert not has_function_privilege('anon','public.liceu_admin_student_access(uuid,uuid,jsonb)','EXECUTE');
 insert into auth.users(id,email) values(a,a||'@example.invalid'),(u,u||'@example.invalid'),(other_user,other_user||'@example.invalid');
 insert into public.users(id,email,name,role) values(a,a||'@example.invalid','QA admin','admin'),(u,u||'@example.invalid','QA student','student'),(other_user,other_user||'@example.invalid','QA other','student') on conflict(id) do update set role=excluded.role;
 insert into public.formation_programs(id,slug,title) values(program,'qa-'||program,'Synthetic access fixture');
 insert into public.formation_releases(program_id,version,hash,manifest,source_commit,approved_by) values(program,'0.0.0',repeat('a',64),'{}',repeat('a',40),a) returning * into r;
 insert into public.formation_cohorts(id,program_id,release_id,title,capacity) values(c,r.program_id,r.id,'QA access transaction',1);
 b:=jsonb_build_object('action','formation','cohortId',c,'status','active','expected',null,'reason','Teste sintético local');
 begin perform public.liceu_admin_student_access(u,u,b);raise exception 'Expected authorization error';exception when insufficient_privilege then null;end;
 perform public.liceu_admin_student_access(a,u,b);
 begin perform public.liceu_admin_student_access(a,u,b);raise exception 'Expected stale conflict';exception when sqlstate 'PT409' then null;end;
 select to_jsonb(x) into m from public.formation_memberships x where cohort_id=c and user_id=u;
 perform public.liceu_admin_student_access(a,u,b||jsonb_build_object('expected',m,'status','paused'));
 begin perform public.liceu_admin_student_access(a,other_user,b);raise exception 'Expected reserved seat conflict';exception when sqlstate 'PT409' then null;end;
 select to_jsonb(x) into m from public.formation_memberships x where cohort_id=c and user_id=u;
 perform public.liceu_admin_student_access(a,u,b||jsonb_build_object('expected',m,'status','withdrawn'));
 perform public.liceu_admin_student_access(a,other_user,b);
 select to_jsonb(x) into m from public.formation_memberships x where cohort_id=c and user_id=u;
 begin perform public.liceu_admin_student_access(a,u,b||jsonb_build_object('expected',m));raise exception 'Expected capacity conflict';exception when sqlstate 'PT409' then null;end;
 assert (select status='withdrawn' from public.formation_memberships where cohort_id=c and user_id=u);
 b:=jsonb_build_object('action','mentoring','grantId',g,'mode','save','scope','Escopo sintético de acompanhamento individual.','expiresAt',null,'expected',null,'reason','Teste sintético local');
 perform public.liceu_admin_student_access(a,u,b);
 assert (select source_type='admin_student_access' and metadata->>'area'='mentoring' from public.access_grants where id=g);
 select jsonb_build_object('updated_at',updated_at,'metadata',metadata,'expires_at',expires_at,'revoked_at',revoked_at) into stamp from public.access_grants where id=g;
 begin perform public.liceu_admin_student_access(a,other_user,b||jsonb_build_object('expected',stamp));raise exception 'Expected cross-account rejection';exception when insufficient_privilege then null;end;
 perform public.liceu_admin_student_access(a,u,b||jsonb_build_object('expected',stamp,'scope','Escopo revisado para acompanhamento individual.'));
 begin perform public.liceu_admin_student_access(a,u,b||jsonb_build_object('expected',stamp));raise exception 'Expected stale grant rejection';exception when sqlstate 'PT409' then null;end;
 select jsonb_build_object('updated_at',updated_at,'metadata',metadata,'expires_at',expires_at,'revoked_at',revoked_at) into stamp from public.access_grants where id=g;
 perform public.liceu_admin_student_access(a,u,b||jsonb_build_object('expected',stamp,'mode','revoke'));
 assert (select revoked_by=a and revoked_at is not null from public.access_grants where id=g);
 select jsonb_build_object('updated_at',updated_at,'metadata',metadata,'expires_at',expires_at,'revoked_at',revoked_at) into stamp from public.access_grants where id=g;
 begin perform public.liceu_admin_student_access(a,u,b||jsonb_build_object('expected',stamp));raise exception 'Expected no resurrection';exception when insufficient_privilege then null;end;
 select count(*) into audits from public.audit_logs where actor_id=a and metadata->>'operation'='admin_student_access';
 assert audits=7,'All seven successful operations audited atomically';
 raise notice 'PASS: authorization, capacity, pause/withdraw/reactivation, stale edits, mentoring save/revoke, owner boundary, preserved history, audit.';
end$$;
rollback;
