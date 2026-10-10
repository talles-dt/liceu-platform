"""Validate the additive migration against the live schema snapshot, using synthetic data only."""
from pathlib import Path
import subprocess,time
NAME='liceu-implementation-db'
subprocess.run(['docker','exec',NAME,'dropdb','-U','postgres','--if-exists','liceu_verify'],check=True,capture_output=True)
subprocess.run(['docker','exec',NAME,'createdb','-U','postgres','liceu_verify'],check=True,capture_output=True)
def sql(value,ok=True):
 p=subprocess.run(['docker','exec','-i',NAME,'psql','-U','postgres','-d','liceu_verify','-v','ON_ERROR_STOP=1'],input=value,text=True,capture_output=True)
 if (p.returncode==0)!=ok: raise RuntimeError(p.stderr[-2500:]+p.stdout[-1000:])
 return p.stdout
for _ in range(20):
 p=subprocess.run(['docker','exec',NAME,'pg_isready','-U','postgres'],capture_output=True)
 if p.returncode==0:break
 time.sleep(.5)
sql('''do $$begin if not exists(select 1 from pg_roles where rolname='anon') then create role anon;create role authenticated;create role service_role bypassrls;end if;end$$;
create schema extensions;create extension pgcrypto with schema extensions;
create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
create schema auth;create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb);
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
create function auth.role() returns text language sql stable as $$select current_user::text$$;
grant usage on schema auth to anon,authenticated,service_role;
''')
sql(Path('supabase/baseline/2026-10-08-public.sql').read_text())
sql(Path('supabase/migrations/20261008231646_subscription_learning_security.sql').read_text())
print('Baseline restored; additive migration applied successfully')
U='00000000-0000-4000-8000-000000000001';M='00000000-0000-4000-8000-000000000010';L='00000000-0000-4000-8000-000000000020'
sql(f"insert into auth.users values('{U}','synthetic@example.invalid','{{}}');insert into users(id,email,name,role) values('{U}','synthetic@example.invalid','Test','student');")
sql(f"set role authenticated;set request.jwt.claim.sub='{U}';update users set role='admin' where id='{U}';",False)
sql(f"set role authenticated;set request.jwt.claim.sub='{U}';select * from users;")
sql(f"set role anon;select public.grant_user_access('{U}','admin_override','{U}');",False)
sql("set role authenticated;select correct_answer from quiz_questions;",False)
sql(f"set role authenticated;select public.liceu_complete_lesson('{U}','{L}');",False)
print('PASS: own profile reads, self promotion denied, anonymous grants denied, answer leakage denied, privileged RPC denied')
sql(f"insert into liceu_modules(id,code,title,order_index) values('{M}','test','Synthetic',1);insert into liceu_lessons(id,module_id,code,title,learning_objective,order_index,is_published) values('{L}','{M}','test1','Synthetic','Synthetic objective',1,true);")
sql(f"select liceu_complete_lesson('{U}','{L}');",False)
sql(f"insert into liceu_billing_accounts(user_id,customer_id) values('{U}','cus_test');select liceu_apply_subscription('evt_2','test',2,'sub_test','{U}','cus_test','trialing',now()+interval '14 days',now()+interval '14 days',false);")
sql(f"select liceu_complete_lesson('{U}','{L}');select liceu_complete_lesson('{U}','{L}');")
sql(f"select liceu_complete_module('{U}','{M}');",False)
sql(f"insert into liceu_quiz_attempts(user_id,module_id,score,answers) values('{U}','{M}',70,'{{}}');select liceu_complete_module('{U}','{M}');")
sql(f"select liceu_apply_subscription('evt_1','test',1,'sub_test','{U}','cus_test','unpaid',null,null,false);")
assert 'trialing' in sql("select status from liceu_subscriptions where subscription_id='sub_test';")
sql("do $$begin if (select cardinality(completed_lessons) from liceu_learner_progression limit 1)<>1 then raise exception 'duplicate completion';end if;end$$;")
print('PASS: entitlement required, completion idempotent, 70% gate enforced, older event cannot regress subscription')
for migration in sorted(Path('supabase/migrations').glob('*formation_trivium.sql')): sql(migration.read_text())
print('Formation migration applied locally')
print('Database checks complete (local only)')
