"""Run after verify-database.py. Synthetic PostgreSQL test, never a remote connection."""
from pathlib import Path
import json,subprocess,hashlib,uuid
NAME='liceu-implementation-db'
def sql(query,ok=True):
 p=subprocess.run(['docker','exec','-i',NAME,'psql','-U','postgres','-d','liceu_verify','-At','-v','ON_ERROR_STOP=1'],input=query,text=True,capture_output=True)
 if (p.returncode==0)!=ok:raise RuntimeError(p.stderr+p.stdout)
 return p.stdout.strip().splitlines()[-1] if p.stdout.strip() else ''
def uid(n):return f'11111111-1111-4111-8111-{n:012d}'
admin=uid(1);teacher=uid(2);users=[uid(i) for i in range(3,10)];outsider=uid(10)
for u in [admin,teacher,*users,outsider]:sql(f"insert into auth.users values('{u}','{u}@example.invalid','{{}}');insert into users(id,email,name,role) values('{u}','{u}@example.invalid','Synthetic','{'admin' if u==admin else 'student'}');")
fixture=json.loads(Path('content/formations/trivium/releases/0.1.0.json').read_text())
draft=json.dumps(fixture)
sql(f"select formation_publish('{admin}',$m${draft}$m$::jsonb,'{'a'*64}','{'a'*40}');",False)
# Synthetic approval exercises persistence only; the real editorial file remains a draft.
fixture['editorial_status']='approved';fixture['approval_note']='Synthetic database fixture, not a real editorial approval'
manifest=json.dumps(fixture);h=hashlib.sha256(manifest.encode()).hexdigest()
release=sql(f"select formation_publish('{admin}',$m${manifest}$m$::jsonb,'{h}','{'a'*40}');")
assert sql(f"select formation_publish('{admin}',$m${manifest}$m$::jsonb,'{h}','{'a'*40}');")==release
sql(f"select formation_publish('{admin}',$m${manifest}$m$::jsonb,'{'b'*64}','{'a'*40}');",False)
sql(f"update formation_releases set version='9.0.0' where id='{release}';",False)
cohort=sql(f"select formation_create_cohort('{admin}','{release}','Synthetic coorte','{teacher}');")
other=sql(f"select formation_create_cohort('{admin}','{release}','Other coorte','{outsider}');")
for u in users[:6]:sql(f"select formation_enroll('{admin}','{cohort}','{u}','participant');")
sql(f"select formation_enroll('{admin}','{cohort}','{users[6]}','participant');",False)
activity=sql(f"select id from formation_activities where cohort_id='{cohort}' order by item_key limit 1;")
activity_other=sql(f"select id from formation_activities where cohort_id='{other}' limit 1;")
def cmd(actor,action,body,ok=True):
 v=sql(f"select formation_command('{actor}','{cohort}','{action}',$b${json.dumps(body)}$b$::jsonb);",ok)
 return json.loads(v) if ok else None
a,b=users[:2];request=str(uuid.uuid4())
cmd(a,'save_draft',{'activity_id':activity,'body':'Private draft','revision':0})
cmd(a,'save_draft',{'activity_id':activity,'body':'Stale tab','revision':0},False)
cmd(a,'submit',{'activity_id':activity_other,'body':'Cross tenant','revision':0,'request_id':str(uuid.uuid4())},False)
body={'activity_id':activity,'body':'Submitted evidence','revision':1,'request_id':request}
sub=cmd(a,'submit',body)['id'];assert cmd(a,'submit',body)['id']==sub
cmd(b,'submit',body,False)
cmd(a,'codex',{'title':'Private notebook','body':'Do not share','source':'Self'})
def read(user,q):return sql(f"set role authenticated;set request.jwt.claim.sub='{user}';{q}")
assert read(b,f"select count(*) from formation_submissions where id='{sub}';")=='0'
assert read(teacher,"select count(*) from formation_codex;")=='0'
assert read(teacher,"select count(*) from formation_drafts;")=='0'
assert read(outsider,f"select count(*) from formation_activities where cohort_id='{cohort}';")=='0'
sql(f"set role authenticated;set request.jwt.claim.sub='{a}';update formation_memberships set role='teacher' where user_id='{a}';",False)
sql(f"set role authenticated;select formation_command('{teacher}','{cohort}','codex','{{}}');",False)
review=cmd(teacher,'assign_review',{'submission_id':sub,'subject_id':a,'reviewer_id':b,'kind':'peer'})['id']
assert read(b,f"select count(*) from formation_submissions where id='{sub}';")=='1'
cmd(b,'assign_review',{'submission_id':sub,'subject_id':a,'reviewer_id':b,'kind':'teacher'},False)
cmd(b,'assess',{'review_id':review,'rubric_key':'trivium.integrated','observations':{'rhetoric.expression':'transfer'},'narrative':'Missing other pillars'},False)
cmd(b,'assess',{'review_id':review,'rubric_key':'trivium.integrated','observations':{'grammar.precision':'consistent','logic.inference':'support','rhetoric.expression':'transfer'},'narrative':'Persuasiveness does not compensate for an invalid inference.'})
assert read(a,"select count(*) from formation_assessments;")=='1'
sql("update formation_assessments set narrative='Changed';",False)
cmd(teacher,'performance',{'activity_id':activity,'participants':[a,outsider],'record':'Cross tenant','occurred_at':'2026-10-10T12:00:00Z'},False)
p=cmd(teacher,'performance',{'activity_id':activity,'participants':users[:6],'record':'Collective event with six individual contributions','occurred_at':'2026-10-10T12:00:00Z'})['id']
assert read(b,f"select count(*) from formation_performances where id='{p}';")=='1'
print('PASS: six-seat limit, release immutability/idempotency, cross-cohort denial, private drafts/Codex, stale-write conflict, submission retries, scoped peer review, three-pillar assessment, collective performance')

# Archived membership preserves own evidence without retaining peer access or write rights.
sql(f"update formation_memberships set status='withdrawn' where cohort_id='{cohort}' and user_id='{a}';")
assert read(a,f"select count(*) from formation_submissions where id='{sub}';")=='1'
assert read(a,"select count(*) from formation_codex;")=='1'
cmd(a,'save_draft',{'activity_id':activity,'body':'No new writes','revision':2},False)
sql(f"update formation_memberships set status='withdrawn' where cohort_id='{cohort}' and user_id='{b}';")
assert read(b,f"select count(*) from formation_submissions where id='{sub}';")=='0'
print('PASS: former participant retains own portfolio and Codex, loses peer evidence and new writes')
