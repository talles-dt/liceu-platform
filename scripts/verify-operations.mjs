/** Synthetic, LOCAL ONLY: durable event retries, Cal ordering, legacy claims and erasure. */
import {readFileSync,writeFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createClient} from '@supabase/supabase-js';
import {createServerClient} from '@supabase/ssr';
const config=JSON.parse(readFileSync('.local-u00u05/status.json','utf8'));
assert.equal(new URL(config.API_URL).hostname,'127.0.0.1');
const db=createClient(config.API_URL,config.SERVICE_ROLE_KEY,{auth:{persistSession:false}}),base='http://localhost:3110';
function ok(r){if(r.error)throw Error(r.error.message);return r.data;}
const actors={};
for(const role of ['student','other','teacher','admin']){
 const email='operations-'+randomUUID()+'@example.invalid',password=randomUUID()+'Ab!2';
 const {user}=ok(await db.auth.admin.createUser({email,password,email_confirm:true}));
 if(['admin','teacher'].includes(role))ok(await db.from('users').update({role}).eq('id',user.id));
 const jar=new Map(),client=createServerClient(config.API_URL,config.ANON_KEY,{cookies:{getAll:()=>[...jar].map(([name,value])=>({name,value})),setAll:a=>a.forEach(v=>jar.set(v.name,v.value))}});
 ok(await client.auth.signInWithPassword({email,password}));
 actors[role]={id:user.id,email,client,cookie:()=>[...jar].map(([k,v])=>k+'='+v).join('; ')};
}
async function request(actor,path,body,method=body?'POST':'GET'){
 const r=await fetch(base+path,{method,headers:{cookie:actors[actor].cookie(),origin:base,'content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(30000)});
 let data;try{data=await r.json();}catch{data={};}return {status:r.status,data};
}
assert.equal((await request('student','/api/me/profile',{name:'Corrected synthetic name'},'PATCH')).status,200);
const audit=ok(await db.from('liceu_audit_events').select('actor_id,source,old_values,new_values').eq('target_id',actors.student.id).eq('actor_id',actors.student.id));
assert.ok(audit.length);assert.ok(!JSON.stringify(audit).includes(actors.student.email));
assert.ok((await actors.student.client.from('liceu_audit_events').select('*')).error);
// Inbox durable failure and replay, lease ownership and successful dedupe.
const eventId='test-'+randomUUID(),token=randomUUID();
assert.equal(ok(await db.rpc('liceu_receive_event',{p_provider:'stripe',p_id:eventId,p_payload:{id:eventId},p_token:token})).state,'claimed');
assert.equal(ok(await db.rpc('liceu_receive_event',{p_provider:'stripe',p_id:eventId,p_payload:{},p_token:randomUUID()})).state,'busy');
assert.equal(ok(await db.rpc('liceu_finish_event',{p_provider:'stripe',p_id:eventId,p_token:randomUUID()})),false);
ok(await db.rpc('liceu_finish_event',{p_provider:'stripe',p_id:eventId,p_token:token,p_error:'synthetic_failure'}));
const retry=randomUUID();
assert.equal(ok(await db.rpc('liceu_receive_event',{p_provider:'stripe',p_id:eventId,p_payload:{replaced:true},p_token:retry})).payload.id,eventId);
ok(await db.rpc('liceu_finish_event',{p_provider:'stripe',p_id:eventId,p_token:retry}));
assert.equal(ok(await db.rpc('liceu_receive_event',{p_provider:'stripe',p_id:eventId,p_payload:{},p_token:randomUUID()})).state,'done');
// Cal owner, teacher and exact purchased duration; stale cancellation cannot regress reschedule.
const order=ok(await db.from('liceu_service_orders').insert({user_id:actors.other.id,teacher_id:actors.teacher.id,kind:'mentoring',scope:'Synthetic paid session',duration_minutes:30,status:'paid'}).select('id').single());
const now=Date.now()-100000;
const payload={uid:randomUUID(),metadata:{liceu_order_id:order.id},startTime:'2030-01-01T10:00:00Z',endTime:'2030-01-01T10:30:00Z',organizer:{email:actors.teacher.email},attendees:[{email:actors.other.email}]};
const cal=(triggerEvent,offset,p=payload)=>({triggerEvent,createdAt:new Date(now+offset).toISOString(),payload:p});
assert.equal(ok(await db.rpc('liceu_apply_cal',{p_event:cal('BOOKING_CREATED',0)})),'applied');
assert.ok((await db.rpc('liceu_apply_cal',{p_event:cal('BOOKING_CREATED',1,{...payload,uid:randomUUID()})})).error);
assert.ok((await db.rpc('liceu_apply_cal',{p_event:cal('BOOKING_RESCHEDULED',2,{...payload,endTime:'2030-01-01T11:00:00Z'})})).error);
assert.ok((await db.rpc('liceu_apply_cal',{p_event:cal('BOOKING_RESCHEDULED',2,{...payload,organizer:{email:actors.student.email}})})).error);
const replacement={...payload,uid:randomUUID(),rescheduleUid:payload.uid,startTime:'2030-01-02T10:00:00Z',endTime:'2030-01-02T10:30:00Z'};
assert.equal(ok(await db.rpc('liceu_apply_cal',{p_event:cal('BOOKING_RESCHEDULED',2000,replacement)})),'applied');
assert.equal(ok(await db.rpc('liceu_apply_cal',{p_event:cal('BOOKING_CANCELLED',1000)})),'stale');
assert.equal(ok(await db.from('liceu_mentoring_bookings').select('booking_uid').eq('order_id',order.id).eq('status','scheduled')).length,1);
assert.equal(ok(await db.rpc('liceu_apply_cal',{p_event:cal('BOOKING_CANCELLED',3000,replacement)})),'applied');
// Explicit paid source reconciliation; unconfirmed/wrong identities never claim.
const legacyId='legacy-'+randomUUID();
ok(await db.from('liceu_legacy_billing_events').insert({event_id:legacyId,event_type:'checkout.session.completed',payload:{payment_status:'paid',customer_details:{email:actors.student.email}}}));
const resolution={action:'resolve_legacy',eventId:legacyId,email:actors.student.email,until:'2030-01-01T00:00:00Z',reason:'Synthetic receipt checked and exact entitlement explicitly approved.'};
assert.equal((await request('student','/api/admin/operations',resolution)).status,403);
assert.equal((await request('admin','/api/admin/operations',{...resolution,email:actors.other.email})).status,409);
assert.equal((await request('admin','/api/admin/operations',resolution)).status,200);
assert.equal((await request('other','/api/me/legacy-access',{})).data.claimed,0);
assert.equal((await request('student','/api/me/legacy-access',{})).data.claimed,1);
assert.equal((await request('student','/api/me/legacy-access',{})).data.claimed,0);
// Erasure rejects unauthorised execution; storage is removed, soft Auth deletion retains structural links.
ok(await db.from('profiles').insert({id:actors.student.id,email:actors.student.email}));
const path=actors.student.id+'/'+randomUUID()+'.txt';
if(!ok(await db.storage.listBuckets()).some(b=>b.id==='assignment-files'))ok(await db.storage.createBucket('assignment-files',{public:false}));
ok(await db.storage.from('assignment-files').upload(path,'Private synthetic evidence'));
ok(await db.from('assignment_submissions').insert({user_id:actors.student.id,content:'Private text',file_url:config.API_URL+'/storage/v1/object/public/assignment-files/'+path}));
assert.equal((await request('student','/api/me/delete-account',{confirmation:'wrong'})).status,400);
assert.equal((await request('student','/api/me/delete-account',{confirmation:'EXCLUIR'})).status,202);
assert.equal((await request('student','/api/me/delete-account',{confirmation:'EXCLUIR'})).status,202);
const job=ok(await db.from('liceu_privacy_requests').select('*').eq('user_id',actors.student.id).single());
assert.equal((await request('student','/api/admin/privacy',{action:'run',requestId:job.id})).status,403);
assert.equal((await request('admin','/api/admin/privacy',{action:'run',requestId:job.id})).status,409);
assert.equal((await request('admin','/api/admin/privacy',{action:'approve',requestId:job.id,reason:'Explicit synthetic retention for financial reconciliation; shared records reviewed.',until:'2030-01-01T00:00:00Z',sharedReviewed:true})).status,200);
// Force failure after Storage removal but before its durable checkpoint, then resume the same job.
function localSQL(sql){execFileSync('docker',['exec','-i','supabase_db_local-u00u05','psql','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1'],{input:sql,stdio:['pipe','ignore','pipe']});}
localSQL("alter table public.liceu_privacy_files add constraint synthetic_checkpoint_failure check(removed_at is null) not valid;");
try{
 assert.equal((await request('admin','/api/admin/privacy',{action:'run',requestId:job.id})).status,409);
 assert.equal(ok(await db.from('liceu_privacy_requests').select('step').eq('id',job.id).single()).step,'files');
 assert.equal(ok(await db.from('users').select('email').eq('id',actors.student.id).single()).email,actors.student.email);
}finally{localSQL("alter table public.liceu_privacy_files drop constraint synthetic_checkpoint_failure;");}
const result=await request('admin','/api/admin/privacy',{action:'run',requestId:job.id});
if(result.status!==200)console.log('Erasure checkpoint:',ok(await db.from('liceu_privacy_requests').select('step,last_error').eq('id',job.id).single()));
assert.equal(result.status,200,JSON.stringify(result.data));
assert.equal((await request('admin','/api/admin/privacy',{action:'run',requestId:job.id})).status,200);
assert.equal(ok(await db.from('users').select('email').eq('id',actors.student.id).single()).email,null);
assert.equal(ok(await db.from('assignment_submissions').select('id').eq('user_id',actors.student.id)).length,0);
assert.ok((await db.storage.from('assignment-files').download(path)).error);
assert.equal((await request('student','/api/me/export-data')).status,401);
assert.equal(ok(await actors.student.client.from('liceu_service_orders').select('id')).length,0);
const report={at:new Date().toISOString(),environment:'isolated local Supabase and Next HTTP',checks:['verified actor transactional audit','audit data minimisation and isolation','durable failed inbox replay','lease ownership','duplicate success','Cal identity and duration','one active booking','reschedule and stale cancellation','explicit legacy receipt reconciliation','same confirmed email claim once','reviewed erasure request','file checkpoint failure stops before data scrub and resumes same job','private file removal','data scrub','soft Auth closure','idempotent erasure resume','old session denied'],limits:['No external Stripe or Cal sandbox credentials','No production change','Retention review remains human and explicit']};
writeFileSync('docs/implementation/OPERATIONS_VERIFICATION.json',JSON.stringify(report,null,2)+'\n');
console.log('PASS: '+report.checks.join(', '));
