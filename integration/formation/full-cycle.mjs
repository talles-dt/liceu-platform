// Local Supabase only. Synthetic approval tests software, never editorial readiness.
import {readFileSync,writeFileSync} from 'node:fs';
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
  people[name]={id,email,password,cookie:[...jar].map(([k,v])=>`${k}=${v}`).join('; ')};
 }
 const manifest=JSON.parse(readFileSync('content/formations/trivium/releases/0.4.0.json','utf8'));
 manifest.slug=`qa-areas-${tag}`;manifest.editorial_status='approved';manifest.approval_note='SYNTHETIC local software fixture; NOT editorial approval';
 const release=await rpc('formation_publish',{p_admin:people.admin.id,p_manifest:manifest,p_hash:createHash('sha256').update(JSON.stringify(manifest)).digest('hex'),p_commit:'a'.repeat(40)});
 const cohort=await rpc('formation_create_cohort',{p_admin:people.admin.id,p_release:release,p_title:`QA local ${tag}`,p_teacher:people.teacher.id});
 for(const name of ['formation','both'])await rpc('formation_enroll',{p_admin:people.admin.id,p_cohort:cohort,p_user:people[name].id,p_role:'participant'});
 for(const name of ['mentoring','both']){const r=await admin.from('liceu_service_orders').insert({user_id:people[name].id,kind:'mentoring',scope:`Objetivo privado ${name} ${tag}`,status:'paid'});if(r.error)throw r.error;}
 async function destination(who,expected){const r=await request(who,'/dashboard');const html=await r.text();assert.ok(r.headers.get('location')===expected||html.includes(`url=${expected}`)||html.includes(`NEXT_REDIRECT;replace;${expected};`),`${who} routes to ${expected}`);}
 await destination('formation','/formacoes');await destination('mentoring','/aluno/mentoria');
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
 // Full cycle: baseline gate, private Codex, feedback, versioned revision, calendar and file ownership.
 const pathFor=`/api/formations/${cohort}`;
 const snapshot=async who=>{const r=await request(who,pathFor);assert.equal(r.status,200);return r.json();};
 const command=async(who,action,body,expected=200)=>{const r=await request(who,pathFor,{action,body});const value=await r.json();assert.equal(r.status,expected,`${action}: ${JSON.stringify(value)}`);return value;};
 let state=await snapshot('formation');
 const baseline=state.tables.activities.find(a=>a.item_key==='c01.baseline');assert.ok(baseline);
 assert.equal((await request('formation',route+'?entry=glossary')).status,403);
 await command('formation','submit',{activity_id:baseline.id,body:'Diagnóstico sintético de QA.',revision:0,request_id:randomUUID()});
 assert.equal((await request('formation',route+'?entry=glossary')).status,200);
 for(const moduleKey of ['c01','c02','c03','c04','c05','c06']){
  assert.equal((await request('formation',route+`?module=${moduleKey}`)).status,200);
  assert.equal((await request('teacher',route+`?module=${moduleKey}&kind=teacher`)).status,200);
  assert.equal((await request('formation',route+`?module=${moduleKey}&kind=teacher`)).status,403);
 }
 await command('formation','codex',{title:'Nota privada QA',body:'Somente o titular pode ler esta nota.',source:'Corpus sintético'});
 assert.equal((await snapshot('teacher')).tables.codex.length,0);
 assert.equal((await snapshot('both')).tables.codex.length,0);
 state=await snapshot('formation');const submission=state.tables.submissions.find(s=>s.activity_id===activity_id);assert.ok(submission);
 assert.equal((await snapshot('both')).tables.submissions.length,0);
 const peer=await command('teacher','assign_review',{submission_id:submission.id,subject_id:people.formation.id,reviewer_id:people.both.id,kind:'peer'});
 const teacherReview=await command('teacher','assign_review',{submission_id:submission.id,subject_id:people.formation.id,reviewer_id:people.teacher.id,kind:'teacher'});
 const definition=manifest.cycles[0].activities.find(a=>a.key==='c01.composition');
 const rubric=manifest.rubrics.find(r=>r.key===definition.rubric_key);const observations=Object.fromEntries(rubric.criteria.map(c=>[c.key,'developing']));
 await command('both','assess',{review_id:peer.id,rubric_key:rubric.key,observations,narrative:'QA par: referência textual clara; qual a premissa? Explicite-a na revisão.'});
 await command('teacher','assess',{review_id:teacherReview.id,rubric_key:rubric.key,observations,narrative:'QA docente: distinguir conclusão e evidência. Próximo passo: rever a inferência.'});
 const self=await command('formation','self_review',{submission_id:submission.id});
 await command('formation','assess',{review_id:self.id,rubric_key:rubric.key,observations,narrative:'QA autoavaliação: preciso justificar a passagem das premissas à conclusão.'});
 await command('formation','save_draft',{activity_id,body:'Tentativa de aba antiga',revision:0},409);
 const revised=await command('formation','submit',{activity_id,body:'Versão revista após devolutivas QA.',revision:submission.revision,request_id:randomUUID()});
 assert.notEqual(revised.id,submission.id);
 state=await snapshot('formation');assert.equal(state.tables.assessments.length,3);assert.ok(state.tables.submissions.some(s=>s.id===submission.id));
 assert.ok((await snapshot('both')).tables.submissions.every(s=>s.id===submission.id),'peer sees only assigned version');
 const seminar=state.tables.activities.find(a=>a.item_key==='c01.seminar');assert.ok(seminar);
 await command('teacher','schedule',{activity_id:seminar.id,starts_at:'2026-11-05T22:00:00Z',ends_at:'2026-11-05T23:30:00Z',status:'open',meeting_url:'https://example.invalid/qa'});
 await command('formation','schedule',{activity_id:seminar.id,status:'closed'},403);
 await command('teacher','participation',{activity_id:seminar.id,user_id:people.formation.id,role:'Expositor',attendance:'present'});
 await command('teacher','performance',{activity_id:seminar.id,participants:[people.formation.id,people.both.id],occurred_at:'2026-11-05T22:00:00Z',record:'Registro sintético de duas contribuições, sem inferir domínio.'});
 const calendar=await request('formation',pathFor+'/calendar');assert.equal(calendar.status,200);assert.ok((await calendar.text()).includes('20261105T220000Z'));
 const upload=new FormData();upload.set('submission_id',submission.id);upload.set('file',new Blob(['Anexo privado QA'],{type:'text/plain'}),'qa.txt');
 const uploaded=await fetch(origin+pathFor+'/artifacts',{method:'POST',headers:{cookie:people.formation.cookie,origin},body:upload});const artifact=await uploaded.json();assert.equal(uploaded.status,200,JSON.stringify(artifact));
 for(const who of ['formation','teacher','both']){const r=await request(who,pathFor+`/artifacts?id=${artifact.id}`);assert.equal(r.status,200);const signed=await r.json();assert.equal(await(await fetch(signed.url)).text(),'Anexo privado QA');}
 assert.equal((await request('outsider',pathFor+`/artifacts?id=${artifact.id}`)).status,404);
 const exported=await request('formation','/api/me/export-data');assert.equal(exported.status,200);const portfolio=await exported.json();assert.equal(portfolio.formation_assessments.length,3);assert.ok(portfolio.formation_submissions.every(s=>s.user_id===people.formation.id));
 assert.equal(portfolio.formation_codex.length,1);assert.equal(portfolio.formation_performances.length,1);
 writeFileSync('.local-u00u05/formation-cycle-qa.json',JSON.stringify({tag,cohort,people,origin}),{mode:0o600});
 writeFileSync('docs/implementation/FORMATION_CYCLE_HTTP_2026-10-27.json',JSON.stringify({date:new Date().toISOString(),environment:'local Auth/PostgREST/Storage/Next; synthetic accounts',curriculum:manifest.version,checks:['area destinations','six notebooks and teacher guides','baseline glossary gate','draft reload/isolation','Codex privacy','peer/teacher/self feedback','stale draft conflict','immutable revisions and scoped peer access','schedule and calendar','participation and performance','private upload/download','account export'],result:'passed',limits:['browser interaction recorded separately','no production academic mutations','not pedagogical validation']},null,2)+'\n');
 console.log('PASS complete local formation cycle, private files, assessment and export.');
 if(process.env.QA_KEEP_APP==='1'){console.log('Local app retained for browser QA');await new Promise(()=>{});}
}catch(e){console.error(e);console.error(errors.slice(-3500));process.exitCode=1;}finally{app.kill('SIGTERM');}
