"""Rollback-only synthetic test against the named local Supabase container."""
import json, subprocess, uuid
from pathlib import Path
ids=[str(uuid.uuid4()) for _ in range(5)]
admin,teacher,student,overflow,outsider=ids
manifest=json.loads(Path('content/formations/trivium/releases/0.2.0.json').read_text())
manifest.update(slug='qa-manual-'+uuid.uuid4().hex[:8],editorial_status='approved',approval_note='Synthetic transaction only; not editorial approval')
sql=['begin;']
for ident in ids:
 sql.append(f"insert into auth.users(id,email,raw_app_meta_data,raw_user_meta_data) values('{ident}','{ident}@example.invalid','{{}}','{{}}');")
for ident,role in [(admin,'admin'),(teacher,'student'),(outsider,'student')]:
 sql.append(f"insert into public.users(id,email,role) values('{ident}','{ident}@example.invalid','{role}') on conflict(id) do update set role=excluded.role;")
sql.append(f"select public.formation_publish('{admin}',$m${json.dumps(manifest)}$m$::jsonb,repeat('a',64),repeat('a',40)) as rel \\gset")
sql.append(f"select public.formation_create_cohort('{admin}',:'rel','QA rollback only','{teacher}') as co \\gset")
sql.append("update public.formation_cohorts set capacity=1 where id=:'co';")
for ident in [student,overflow]:
 sql.append(f"update auth.users set raw_app_meta_data=jsonb_build_object('manual_provisioning_by','{admin}','manual_access',jsonb_build_object('access','both','cohortId',:'co','scope','Escopo administrativo de teste','expiresAt','2099-01-01T00:00:00.000Z')) where id='{ident}';")
call=lambda who: f"public.liceu_provision_student('{admin}','{who}','both',:'co','Escopo administrativo de teste','2099-01-01T00:00:00Z')"
sql.append(f'select {call(student)};')
sql.append(f'select {call(student)};')
sql.append(f"select count(*)=1 as grant_once from access_grants where user_id='{student}';")
sql.append(f"select not liceu_private.has_access('{student}') as no_subscription_granted;")
sql.append(f"select count(*)=0 as no_fake_payment from liceu_service_orders where user_id='{student}';")
# psql variable substitution is not performed inside dollar quoted DO bodies.
sql.append(f"select set_config('qa.cohort',:'co',true);")
sql.append(f"""do $$ begin
 begin
 perform public.liceu_provision_student('{admin}','{overflow}','both',current_setting('qa.cohort')::uuid,'Escopo administrativo de teste','2099-01-01');
 raise exception 'Capacity check failed';
 exception when sqlstate 'PT409' then null;end;
 if exists(select 1 from public.access_grants where user_id='{overflow}') or exists(select 1 from public.formation_memberships where user_id='{overflow}') then raise exception 'Partial access persisted';end if;
 begin
 perform public.liceu_provision_student('{outsider}','{student}','both',current_setting('qa.cohort')::uuid,'Escopo administrativo de teste','2099-01-01');
 raise exception 'Admin check failed';
 exception when insufficient_privilege then null;end;
 if (select count(*) from public.access_grants where user_id='{student}')<>1 then raise exception 'Retry duplicated grant';end if;
 if liceu_private.has_access('{student}') then raise exception 'Subscription leaked';end if;
 end $$;""")
sql.append(f"set local role authenticated;set local request.jwt.claim.sub='{outsider}';select count(*)=0 as no_cross_account_grants from public.access_grants where user_id='{student}';reset role;")
sql.append("select not has_function_privilege('authenticated','public.liceu_provision_student(uuid,uuid,text,uuid,text,timestamptz)','EXECUTE') as service_only;")
sql.append('rollback;')
r=subprocess.run(['docker','exec','-i','supabase_db_local-u00u05','psql','-U','postgres','-d','postgres','-At','-v','ON_ERROR_STOP=1'],input='\n'.join(sql),text=True,capture_output=True)
if r.returncode:raise RuntimeError(r.stderr)
if '\nf\n' in r.stdout:raise RuntimeError('A SQL assertion returned false')
print('PASS local PostgreSQL: atomic both-access provisioning, retry idempotency, capacity, admin/ownership boundary, RLS, no subscription/payment grant. Transaction rolled back.')
