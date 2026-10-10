"""Run after verify-database.py and verify-formation.py; synthetic local container only."""
from pathlib import Path
import subprocess,json,uuid
CONTAINER='liceu-implementation-db'
def sql(q,ok=True):
 p=subprocess.run(['docker','exec','-i',CONTAINER,'psql','-U','postgres','-d','liceu_verify','-qAt','-v','ON_ERROR_STOP=1'],input=q,text=True,capture_output=True)
 if (p.returncode==0)!=ok:raise RuntimeError(p.stderr+p.stdout)
 return p.stdout.strip().splitlines()[-1] if p.stdout.strip() else ''
sql(Path('supabase/migrations/20261010211812_close_u00_u05.sql').read_text())
u,t,m,l,e=[str(uuid.uuid4()) for _ in range(5)]
for id in [u,t]:sql(f"insert into auth.users values('{id}','{id}@example.invalid','{{\"role\":\"admin\"}}');")
assert sql(f"select role from users where id='{u}';")=='student'
sql(f"update users set role='teacher' where id='{t}';")
sql(f"insert into liceu_modules(id,code,title,order_index,is_active) values('{m}','u05','Synthetic',-1,true);insert into liceu_lessons(id,module_id,code,title,learning_objective,order_index,is_published) values('{l}','{m}','u05','Synthetic','Test',1,true);insert into liceu_exercises(id,lesson_id,exercise_type,title,prompt_markdown,is_published) values('{e}','{l}','production','Synthetic','Write',true);")
sql(f"select liceu_save_work('{u}','{e}','Denied',0,false,null);",False)
sql(f"insert into access_grants(user_id,granted_by,grant_type) values('{u}','{u}','admin_override');")
a=json.loads(sql(f"select liceu_save_work('{u}','{e}','Draft',0,false,null);"));assert a['revision']==1
sql(f"select liceu_save_work('{u}','{e}','Stale',0,false,null);",False)
request=str(uuid.uuid4());query=f"select liceu_save_work('{u}','{e}','Final',1,true,'{request}');"
b=json.loads(sql(query));assert json.loads(sql(query))['id']==b['id']
sql(f"update liceu_work_versions set content='Overwritten' where id='{b['id']}';",False)
order=sql(f"insert into liceu_service_orders(user_id,kind,work_version_id,teacher_id,scope,status,price_id) values('{u}','review','{b['id']}','{t}','Synthetic','offered','price_test') returning id;")
pay=f"select liceu_record_service_payment('{order}','{u}','cs_test','pi_test','evt_test');"
sql(pay);sql(pay);assert sql(f"select count(*) from liceu_service_events where order_id='{order}';")=='1'
sql(f"select liceu_record_service_payment('{order}','{t}','cs_other','pi_other','evt_other');",False)
a,b=str(uuid.uuid4()),str(uuid.uuid4())
assert sql(f"select liceu_lock_billing_entity('sub_test','{a}');")=='t'
assert sql(f"select liceu_lock_billing_entity('sub_test','{b}');")=='f'
sql(f"select liceu_unlock_billing_entity('sub_test','{b}');")
assert sql(f"select liceu_lock_billing_entity('sub_test','{b}');")=='f'
sql(f"select liceu_unlock_billing_entity('sub_test','{a}');")
assert sql(f"select liceu_lock_billing_entity('sub_test','{b}');")=='t'
sql(f"set role authenticated;select liceu_lock_billing_entity('another','{b}');",False)
print('PASS: real profile trigger shape, teacher role, atomic course drafts, immutable versions, payment ledger replay/ownership, billing lease ownership, privileged grants')
