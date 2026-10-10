/** Real local Auth/PostgREST/Next checks. Never accepts a remote database URL. */
import {readFileSync,writeFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
import {createServerClient} from '@supabase/ssr';
const config=JSON.parse(readFileSync('.local-u00u05/status.json','utf8'));
assert.equal(new URL(config.API_URL).hostname,'127.0.0.1');
const base='http://localhost:3110';
const db=createClient(config.API_URL,config.SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
function check(result){if(result.error)throw Error(result.error.message);return result.data;}
const suffix=randomUUID().slice(0,8),actors={};
for(const role of ['student','other','teacher','admin']){
 const email=`liceu-${suffix}-${role}@example.invalid`,password=randomUUID()+'aA!9';
 const {user}=check(await db.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{name:`Synthetic ${role}`,role:'admin'}}));
 const profile=check(await db.from('users').select('role').eq('id',user.id).single());assert.equal(profile.role,'student','metadata must not promote account');
 if(['admin','teacher'].includes(role))check(await db.from('users').update({role}).eq('id',user.id));
 const jar=new Map();const client=createServerClient(config.API_URL,config.ANON_KEY,{cookies:{getAll:()=>[...jar].map(([name,value])=>({name,value})),setAll:values=>values.forEach(x=>jar.set(x.name,x.value))}});
 check(await client.auth.signInWithPassword({email,password}));assert.equal(check(await client.auth.getUser()).user.id,user.id);
 actors[role]={id:user.id,client,cookie:()=>[...jar].map(([k,v])=>`${k}=${v}`).join('; ')};
}
async function request(actor,path,body,method=body?'POST':'GET'){
 const r=await fetch(base+path,{method,signal:AbortSignal.timeout(20000),redirect:'manual',headers:{cookie:actors[actor]?.cookie()??'liceu_admin=true',origin:base,'content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
 const text=await r.text();let data;try{data=JSON.parse(text);}catch{data=text;}return {status:r.status,data};
}
const moduleId=randomUUID(),lessonId=randomUUID(),exerciseId=randomUUID(),questionId=randomUUID();
check(await db.from('liceu_modules').insert({id:moduleId,code:suffix,title:'Synthetic module',order_index:-Math.floor(Date.now()/1000),is_active:true}));
check(await db.from('liceu_lessons').insert({id:lessonId,module_id:moduleId,code:suffix,title:'Synthetic lesson',learning_objective:'Test persistence',order_index:1,is_published:true}));
check(await db.from('liceu_exercises').insert({id:exerciseId,lesson_id:lessonId,exercise_type:'production',title:'Synthetic composition',prompt_markdown:'Write a reasoned paragraph.',is_published:true}));
check(await db.from('liceu_quiz_questions').insert({id:questionId,module_id:moduleId,question:'Synthetic question',options:[{id:'yes',label:'Yes'},{id:'no',label:'No'}],correct_answer:'yes',is_published:true}));
assert.equal((await actors.student.client.from('users').update({role:'admin'}).eq('id',actors.student.id)).error!==null,true);
assert.equal((await actors.student.client.from('liceu_quiz_questions').select('correct_answer')).error!==null,true);
assert.equal(check(await actors.student.client.from('liceu_lessons').select('id').eq('id',lessonId)).length,0);
const grant=check(await db.from('access_grants').insert({user_id:actors.student.id,granted_by:actors.admin.id,grant_type:'admin_override'}).select('id').single());
assert.equal(check(await actors.student.client.from('liceu_lessons').select('id').eq('id',lessonId)).length,1);
assert.equal((await request('forged',`/api/admin/content/quiz/${moduleId}`)).status,403);
const quiz=await request('student',`/api/modules/${moduleId}/quiz`);assert.equal(quiz.status,200);assert.ok(!JSON.stringify(quiz.data).includes('correct_answer'));
assert.equal((await request('student',`/api/modules/${moduleId}/quiz`,{answers:{[questionId]:'no'}})).data.score,0);
assert.equal((await request('student',`/api/modules/${moduleId}/quiz`,{answers:{[questionId]:'yes'}})).data.score,100);
const first=await request('student','/api/work',{exerciseId,content:'A reasoned draft',revision:0});assert.equal(first.status,200,JSON.stringify(first.data));
const writes=await Promise.all(['Tab A','Tab B'].map(content=>request('student','/api/work',{exerciseId,content,revision:1})));assert.deepEqual(writes.map(r=>r.status).sort(),[200,409]);
const payload={exerciseId,content:'Immutable final version',revision:2,publish:true,requestId:randomUUID()};
const final=await request('student','/api/work',payload);assert.equal(final.status,200);assert.equal((await request('student','/api/work',payload)).data.id,final.data.id);
assert.equal(check(await actors.other.client.from('liceu_work_versions').select('id').eq('id',final.data.id)).length,0);
const order=await request('student','/api/services',{kind:'review',workVersionId:final.data.id,scope:'Synthetic review of an exact version.'});assert.equal(order.status,200);
assert.equal((await request('teacher',`/api/services/${order.data.id}`,{action:'offer',scope:'Unassigned attempt at access',dueAt:'2030-01-01'},'PATCH')).status,403);
assert.equal((await request('admin',`/api/services/${order.data.id}`,{action:'assign',teacherId:actors.teacher.id},'PATCH')).status,200);
check(await db.from('liceu_service_orders').update({status:'paid'}).eq('id',order.data.id));
check(await db.from('access_grants').update({revoked_at:new Date().toISOString(),revoked_by:actors.admin.id}).eq('id',grant.id));
assert.equal((await request('student','/api/work',{exerciseId,content:'After expiry',revision:3})).status,403);
assert.equal(check(await actors.student.client.from('liceu_work_versions').select('id').eq('id',final.data.id)).length,1);
assert.equal((await request('teacher',`/api/services/${order.data.id}`,{action:'complete',feedback:'Synthetic narrative feedback delivered after subscription expired.',rubric:{clarity:'A clear statement in the text.',argument:'A reason connected to the conclusion.',audience:'Vocabulary appropriate for the audience.'}},'PATCH')).status,200);
const exported=await request('student','/api/me/export-data');assert.equal(exported.status,200,JSON.stringify(exported.data));assert.ok(exported.data.liceu_work_versions.some(w=>w.id===final.data.id));
// Real Storage: service writes a private fixture; only the owner gets a signed download.
const buckets=check(await db.storage.listBuckets());
if(!buckets.some(b=>b.id==='assignment-files'))check(await db.storage.createBucket('assignment-files',{public:false}));
const objectPath=actors.student.id+'/'+randomUUID()+'.txt';
check(await db.storage.from('assignment-files').upload(objectPath,'Synthetic private evidence',{contentType:'text/plain'}));
const publicUrl=config.API_URL+'/storage/v1/object/public/assignment-files/'+objectPath;
assert.notEqual((await fetch(publicUrl)).status,200);
assert.ok((await actors.other.client.storage.from('assignment-files').download(objectPath)).error);
check(await db.from('profiles').insert({id:actors.student.id}));
const assignment=check(await db.from('assignment_submissions').insert({user_id:actors.student.id,file_url:publicUrl,content:'Synthetic legacy attachment'}).select('id').single());
assert.equal((await request('other','/api/me/assignment-file?id='+assignment.id)).status,404);
const download=await fetch(base+'/api/me/assignment-file?id='+assignment.id,{redirect:'manual',headers:{cookie:actors.student.cookie()}});
assert.equal(download.status,303);
assert.equal(await (await fetch(download.headers.get('location'))).text(),'Synthetic private evidence');
const cancelOrder=await request('other','/api/services',{kind:'mentoring',scope:'Synthetic unpaid cancellation request'});
assert.equal(cancelOrder.status,200);
assert.equal((await request('other','/api/services/'+cancelOrder.data.id+'/cancel',{})).status,200);
assert.equal((await request('other','/api/services/'+cancelOrder.data.id+'/cancel',{})).status,200);
assert.equal((await request('student','/api/services/'+cancelOrder.data.id+'/cancel',{})).status,404);
check(await db.from('users').update({suspended_at:new Date().toISOString()}).eq('id',actors.student.id));
assert.equal((await request('student','/api/services',{kind:'mentoring',scope:'An attempt from a suspended account'})).status,401);
const report={at:new Date().toISOString(),environment:'local real Supabase Auth/PostgREST plus Next HTTP',remote:false,checks:['profile trigger ignores metadata role','verified sign-in','role promotion denied','answers protected','entitlement gates REST','forged admin cookie denied','server graded quiz','concurrent drafts conflict','submission retry idempotent','other user evidence denied','teacher assignment enforced','paid review delivered after subscription expiry','own history retained','suspended account denied','complete JSON export','private storage public and other user denied','owner signed download','unpaid cancellation idempotent and owner scoped'],limits:['No real Stripe or Cal delivery','No production data','No real money']};
writeFileSync('docs/implementation/LOCAL_AUTH_VERIFICATION.json',JSON.stringify(report,null,2)+'\n');
console.log('PASS: '+report.checks.join(', '));
