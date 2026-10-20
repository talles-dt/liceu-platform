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
const app=spawn('node',['node_modules/next/dist/bin/next','dev','--webpack','--port','3177','--hostname','127.0.0.1'],{env:{...process.env,WATCHPACK_POLLING:'true',NEXT_PUBLIC_SUPABASE_URL:config.API_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY:config.ANON_KEY,SUPABASE_SERVICE_ROLE_KEY:config.SERVICE_ROLE_KEY,NEXT_PUBLIC_SITE_URL:origin,STRIPE_SALES_ENABLED:'false'},stdio:['ignore','ignore','pipe']});
let errors='';app.stderr.on('data',d=>{errors+=d.toString()});
const tag=randomUUID().slice(0,8),people={};
async function rpc(name,args){const r=await admin.rpc(name,args);if(r.error)throw Error(r.error.message);return r.data;}
async function request(who,path,body){return fetch(origin+path,{method:body?'POST':'GET',headers:{cookie:people[who]?.cookie??'',origin,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,redirect:'manual'});}
try{
 let ready=false;for(let i=0;i<60;i++){if(app.exitCode!==null)throw Error('Local app exited: '+errors);try{if((await fetch(origin+'/login',{signal:AbortSignal.timeout(5000)})).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,500));}if(!ready)throw Error('Local app did not start');
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
 for(const name of ['formation','both'])await rpc('formation_enroll',{p_admin:people.admin.id,p_cohort:cohort,p_user:people[name].id,p_role:'participant'});
 for(const name of ['mentoring','both']){const r=await admin.from('liceu_service_orders').insert({user_id:people[name].id,kind:'mentoring',scope:`Objetivo privado ${name} ${tag}`,status:'paid'});if(r.error)throw r.error;}
 assert.equal((await request('formation','/dashboard')).headers.get('location'),'/formacoes');
 assert.equal((await request('mentoring','/dashboard')).headers.get('location'),'/aluno/mentoria');
 assert.equal((await request('both','/dashboard')).status,200);
 assert.equal((await request('outsider','/dashboard')).status,200);
 const mentorPage=await (await request('mentoring','/aluno/mentoria')).text();assert.ok(mentorPage.includes(`Objetivo privado mentoring ${tag}`));assert.ok(!mentorPage.includes(`Objetivo privado both ${tag}`));
 const noMentor=await(await request('formation','/aluno/mentoria')).text();assert.ok(noMentor.includes('ainda não tem uma mentoria contratada'));assert.ok(!noMentor.includes(`Objetivo privado mentoring ${tag}`));
 const route=`/api/formations/${cohort}/materials`;
 assert.equal((await request('outsider',route)).status,403);
 assert.equal((await request('mentoring',route)).status,403);
 assert.equal((await request('formation',route+'?kind=teacher')).status,403);
 const workbook=await request('formation',route);assert.equal(workbook.status,200);assert.ok(workbook.headers.get('cache-control').includes('no-store'));const content=await workbook.text();assert.ok(content.includes('Quintiliano'));assert.ok(content.includes('O lobo e o cordeiro'));assert.ok(!content.includes('O clube abriu duas oficinas aos sábados'));
 const guide=await request('teacher',route+'?kind=teacher');assert.equal(guide.status,200);assert.ok((await guide.text()).includes('O clube abriu duas oficinas aos sábados'));
 assert.equal((await request('outsider','/api/formations/preview/materials?kind=teacher')).status,403);
 assert.equal((await request('admin','/api/formations/preview/materials?kind=teacher')).status,200);
 const activities=await admin.from('formation_activities').select('id').eq('cohort_id',cohort).eq('item_key','c01.composition').single();if(activities.error)throw activities.error;
 const path=`/api/formations/${cohort}`,activity_id=activities.data.id;
 const save=await request('formation',path,{action:'save_draft',body:{activity_id,body:'Minha composição individual de teste.',revision:0}});assert.equal(save.status,200);
 const restored=await(await request('formation',path)).json();assert.ok(restored.tables.drafts.some(x=>x.body==='Minha composição individual de teste.'));
 const other=await(await request('both',path)).json();assert.ok(!other.tables.drafts.some(x=>x.body==='Minha composição individual de teste.'));
 assert.equal((await request('formation',path,{action:'submit',body:{activity_id,body:'Minha composição revista de teste.',revision:1,request_id:randomUUID()}})).status,200);
 const page=await(await request('formation',`/formacoes/${cohort}`)).text();assert.ok(page.includes('Abrir caderno'));assert.ok(page.includes('Módulo 1'));
 console.log('PASS local: single/both/no access routing; mentoring ownership; material roles; private teacher guide; full texts; pinned cohort; draft write/reload/account isolation; submission.');
 console.log('Synthetic fixture:',tag,'— no remote writes or charges.');
}catch(e){console.error(e);console.error(errors.slice(-3500));process.exitCode=1;}finally{app.kill('SIGTERM');}
