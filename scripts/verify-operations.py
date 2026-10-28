"""After verify-u00-u05.py. Disposable PostgreSQL container only, no remote URLs."""
from pathlib import Path
import subprocess,uuid,json
CONTAINER='liceu-implementation-db'
def sql(q,success=True):
 p=subprocess.run(['docker','exec','-i',CONTAINER,'psql','-U','postgres','-d','liceu_verify','-qAt','-v','ON_ERROR_STOP=1'],input=q,text=True,capture_output=True)
 if (p.returncode==0)!=success:raise RuntimeError(p.stderr+p.stdout)
 return p.stdout.strip().splitlines()[-1] if p.stdout.strip() else ''
# Minimal Auth/Storage metadata for isolated SQL tests; full services tested separately.
sql("alter table auth.users add column email_confirmed_at timestamptz; create table storage.objects(bucket_id text,name text,owner_id text);")
sql("create or replace function auth.role() returns text language sql stable as $$select current_setting('request.jwt.claim.role',true)$$;")
sql(Path('supabase/migrations/20261011030827_operational_recovery_and_privacy.sql').read_text())
u,a,t=[str(uuid.uuid4()) for _ in range(3)]
for i in [u,a,t]:sql(f"insert into auth.users values('{i}','{i}@example.invalid','{{}}',now());")
sql(f"update users set role='admin' where id='{a}';update users set role='teacher' where id='{t}';")
header=json.dumps({'x-liceu-actor':a})
sql(f"""set role service_role;set request.jwt.claim.role='service_role';set request.headers='{header}';update users set name='Audited test' where id='{u}';""")
assert sql(f"select count(*) from liceu_audit_events where actor_id='{a}' and target_id='{u}';")=='1'
sql("set role authenticated;select * from liceu_audit_events;",False)
# Transactional audit: failure to insert the audit row must roll back its source mutation.
sql("alter table liceu_audit_events add constraint synthetic_reject check(action<>'UPDATE') not valid;")
sql(f"update users set name='Must roll back' where id='{u}';",False)
assert sql(f"select name from users where id='{u}';")=='Audited test'
sql("alter table liceu_audit_events drop constraint synthetic_reject;")
token=str(uuid.uuid4())
assert sql(f"""select liceu_receive_event('stripe','synthetic','{{"id":"synthetic"}}','{token}')->>'state';""")=='claimed'
assert sql(f"""select liceu_receive_event('stripe','synthetic','{{}}','{uuid.uuid4()}')->>'state';""")=='busy'
assert sql(f"select liceu_finish_event('stripe','synthetic','{uuid.uuid4()}');")=='f'
sql(f"select liceu_finish_event('stripe','synthetic','{token}','synthetic_failure');")
assert sql(f"""select liceu_receive_event('stripe','synthetic','{{}}','{token}')->>'state';""")=='claimed'
sql(f"select liceu_finish_event('stripe','synthetic','{token}');")
assert sql(f"""select liceu_receive_event('stripe','synthetic','{{}}','{token}')->>'state';""")=='done'
sql(f"set role anon;select liceu_claim_legacy('{u}');",False)
assert sql("select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in('liceu_apply_cal','liceu_claim_legacy') and p.prosecdef;")=='0'
print('PASS: operational migration restores; verified audit actor; audit rollback atomicity; inbox retries, ownership and dedupe; private definer helpers; anonymous RPC denied')
