// Local Supabase only. Synthetic approval tests software, never editorial readiness.
import {readFileSync} from 'node:fs';
import {spawn} from 'node:child_process';
import {createClient} from '@supabase/supabase-js';
import {createServerClient} from '@supabase/ssr';
import {createHash,randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
const config=JSON.parse(readFileSync('.local-u00u05/status.json','utf8'));
assert.equal(new URL(config.API_URL).hostname,'127.0.0.1');
const health=await fetch(config.API_URL+'/auth/v1/health',{signal:AbortSignal.timeout(5000)});assert.ok(health.ok,'Local Auth unavailable');
const admin=createClient(config.API_URL,config.SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const origin='http://127.0.0.1:3177';
const app=process.env.QA_REUSE_APP==='1'?null:spawn('node',['node_modules/next/dist/bin/next','dev','--webpack','--port','3177','--hostname','127.0.0.1'],{env:{...process.env,WATCHPACK_POLLING:'true',NEXT_PUBLIC_SUPABASE_URL:config.API_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY:config.ANON_KEY,SUPABASE_SERVICE_ROLE_KEY:config.SERVICE_ROLE_KEY,NEXT_PUBLIC_SITE_URL:origin,STRIPE_SALES_ENABLED:'false'},stdio:['ignore','ignore','pipe']});
let errors='';app?.stderr.on('data',d=>{errors+=d.toString()});
const tag=randomUUID().slice(0,8),people={};
async function rpc(name,args){const r=await admin.rpc(name,args);if(r.error)throw Error(r.error.message);return r.data;}
async function request(who,path,body){return fetch(origin+path,{method:body?'POST':'GET',headers:{cookie:people[who]?.cookie??'',origin,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,redirect:'manual'});}
async function assertDestination(who,expected){const r=await request(who,'/dashboard');const html=await r.text();assert.ok(r.headers.get('location')===expected||html.includes(`url=${expected}`)||html.includes(`NEXT_REDIRECT;replace;${expected};`),`${who}: expected ${expected}`);}
try{
 let ready=false;for(let i=0;i<60;i++){if(app&&app.exitCode!==null)throw Error('Local app exited: '+errors);try{if((await fetch(origin+'/login',{signal:AbortSignal.timeout(5000)})).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,500));}if(!ready)throw Error('Local app did not start');
 for(const name of ['admin','teacher','formation','mentoring','both','outsider']){
  const email=`areas-${tag}-${name}@example.invalid`,password=randomUUID()+'Ab1!';
  const r=await admin.auth.admin.createUser({email,password,email_confirm:true});if(r.error)throw r.error;
  const id=r.data.user.id;
  const profile=await admin.from('users').upsert({id,email,name:`QA ${name}`,role:name==='admin'?'admin':'student'});if(profile.error)throw profile.error;
  const jar=new Map();const client=createServerClient(config.API_URL,config.ANON_KEY,{cookies:{getAll:()=>[...jar].map(([name,value])=>({name,value})),setAll:values=>values.forEach(v=>jar.set(v.name,v.value))}});
  const login=await client.auth.signInWithPassword({email,password});if(login.error)throw login.error;
  people[name]={id,cookie:[...jar].map(([k,v])=>`${k}=${v}`).join('; ')};
 }
 const manifest=JSON.parse(readFileSync('content/formations/trivium/releases/0.2.0.json','utf8'));
 manifest.slug=`qa-areas-${tag}`;manifest.editorial_status='approved';manifest.approval_note='SYNTHETIC local software fixture; NOT editorial approval';
 const release=await rpc('formation_publish',{p_admin:people.admin.id,p_manifest:manifest,p_hash:createHash('sha256').update(JSON.stringify(manifest)).digest('hex'),p_commit:'a'.repeat(40)});
 const cohort=await rpc('formation_create_cohort',{p_admin:people.admin.id,p_release:release,p_title:`QA local ${tag}`,p_teacher:people.teacher.id});

 const student=people.formation.id,endpoint=`/api/admin/students/${student}/access`;
 async function edit(who,body,originHeader=origin){return fetch(origin+endpoint,{method:'PATCH',headers:{cookie:people[who]?.cookie??'',origin:originHeader,'Content-Type':'application/json'},body:JSON.stringify(body)});}
 const membership=async()=>{const r=await admin.from('formation_memberships').select('cohort_id,user_id,role,status').eq('cohort_id',cohort).eq('user_id',student).maybeSingle();if(r.error)throw r.error;return r.data;};
 const enroll={action:'formation',cohortId:cohort,status:'active',expected:null,reason:'Teste local de matrícula'};
 assert.equal((await edit('outsider',enroll)).status,403);
 assert.equal((await edit('admin',enroll,'https://elsewhere.invalid')).status,403);
 assert.equal((await edit('admin',enroll)).status,200);
 assert.equal((await edit('admin',enroll)).status,409,'stale page cannot overwrite');
 await assertDestination('formation','/formacoes');
 const first=await membership();
 assert.equal((await edit('admin',{...enroll,expected:first,status:'paused'})).status,200);
 assert.equal((await request('formation',`/api/formations/${cohort}/materials`)).status,403);
 assert.equal((await edit('admin',{...enroll,expected:await membership()})).status,200);
 const grantId=randomUUID();let grant={action:'mentoring',grantId,expected:null,mode:'save',scope:'Escopo manual para o teste local de acesso.',expiresAt:null,reason:'Teste local de mentoria'};
 assert.equal((await edit('admin',grant)).status,200);
 assert.equal((await request('formation','/dashboard')).status,200,'both areas chooser');
 assert.ok((await(await request('formation','/aluno/mentoria')).text()).includes(grant.scope));
 const revision=g=>({updated_at:g.updated_at,metadata:g.metadata,expires_at:g.expires_at,revoked_at:g.revoked_at});
 const readGrant=async()=>{const r=await admin.from('access_grants').select('*').eq('id',grantId).single();if(r.error)throw r.error;return r.data;};
 const g=await readGrant();
 assert.equal((await edit('admin',{...grant,expected:revision(g),scope:'Novo escopo revisto pelo administrador.'})).status,200);
 assert.equal((await edit('admin',{...grant,expected:revision(g)})).status,409);
 assert.equal((await edit('admin',{...grant,expected:revision(await readGrant()),mode:'revoke'})).status,200);
 await assertDestination('formation','/formacoes');
 assert.equal((await edit('admin',{...grant,expected:revision(await readGrant())})).status,403,'revoked history not resurrected');
 const paid=await admin.from('liceu_service_orders').insert({user_id:student,kind:'mentoring',scope:'Serviço pago sintético, sem transação financeira.',status:'paid'});if(paid.error)throw paid.error;
 assert.equal((await request('formation','/dashboard')).status,200,'paid order independently restores mentoring');
 const paidMutation=await edit('admin',{...grant,grantId:randomUUID(),expected:null,mode:'revoke'});assert.equal(paidMutation.status,404);
 // Capacity reactivation: pause reserves a seat; withdraw releases it; reactivation must check again.
 const cap=await admin.from('formation_cohorts').update({capacity:1}).eq('id',cohort);if(cap.error)throw cap.error;
 const status=async(value)=>edit('admin',{...enroll,expected:await membership(),status:value});
 assert.equal((await status('withdrawn')).status,200);
 await rpc('formation_enroll',{p_admin:people.admin.id,p_cohort:cohort,p_user:people.both.id,p_role:'participant'});
 assert.equal((await status('active')).status,409,'reactivation cannot overfill');
 const memberAfter=await membership();assert.equal(memberAfter.status,'withdrawn');
 const log=await admin.from('audit_logs').select('id,actor_id,metadata').eq('target_identifier',student).contains('metadata',{operation:'admin_student_access'});if(log.error)throw log.error;assert.ok(log.data.length>=7);assert.ok(log.data.every(x=>x.actor_id===people.admin.id&&x.metadata.reason));
 for(const path of ['/admin','/admin/students',`/admin/students/${student}`,'/admin/formations','/admin/progress','/admin/system']){const r=await request('admin',path);assert.equal(r.status,200,path);const html=await r.text();assert.ok(!html.includes('pending instrumentation'));assert.ok(!html.includes('derive from time-per-lesson'));}
 const denied=await request('outsider',`/admin/students/${student}`);assert.equal(denied.status,200);assert.ok((await denied.text()).includes('acesso'),'denied user sees explanatory page');
 console.log('PASS local authenticated HTTP: admin/CSRF boundaries; enrollment, pause, reactivation, withdraw; capacity; stale updates; mentoring grant/update/revoke; reload and area routing; paid access preservation; audit and all admin pages.');
 console.log('Synthetic local fixture:',tag,'— no remote accounts or charges.');

}catch(e){console.error(e);console.error(errors.slice(-3500));process.exitCode=1;}finally{app?.kill('SIGTERM');}
