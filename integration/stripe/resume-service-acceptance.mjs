// Resumes ONLY the retained synthetic sandbox orders. No live payments.
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
import {createServerClient} from '@supabase/ssr';
const checkpoint=JSON.parse(readFileSync('docs/implementation/STRIPE_BROWSER_CHECKPOINT.json'));
const config=JSON.parse(readFileSync('.local-u00u05/status.json'));
const actors=JSON.parse(readFileSync('.local-u00u05/browser-fixtures.json'));
assert.equal(new URL(config.API_URL).hostname,'127.0.0.1');
const env={...process.env};delete env.STRIPE_API_KEY;delete env.NODE_OPTIONS;
const cli=(...args)=>JSON.parse(execFileSync('stripe',[...args,'--project-name','liceu-validation'],{env,stdio:['ignore','pipe','pipe'],timeout:45000}).toString());
assert.equal(cli('get','/v1/account').id,'acct_1TC9LbDLweZOOMDK');assert.equal(cli('balance','retrieve').livemode,false);
const db=createClient(config.API_URL,config.SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const ok=r=>{if(r.error)throw r.error;return r.data;};
const origin='http://localhost:3112';const cookies={};
for(const role of ['student','teacher','admin']){
 assert.ok(actors[role].email.startsWith('browser-qa-')&&actors[role].email.endsWith('@example.invalid'));
 const jar=new Map();const client=createServerClient(origin,config.ANON_KEY,{cookies:{getAll:()=>[...jar].map(([name,value])=>({name,value})),setAll:values=>values.forEach(v=>jar.set(v.name,v.value))}});
 ok(await client.auth.signInWithPassword({email:actors[role].email,password:actors[role].password}));
 cookies[role]=[...jar].map(([k,v])=>`${k}=${v}`).join('; ');
}
async function call(role,path){const r=await fetch(origin+path,{method:'POST',headers:{origin,cookie:cookies[role],'content-type':'application/json'},body:'{}',signal:AbortSignal.timeout(120000)});return {status:r.status,body:await r.json()};}
const results=[];
for(const id of checkpoint.service_orders){
 const order=ok(await db.from('liceu_service_orders').select('id,user_id,kind,status,payment_intent_id,refund_id').eq('id',id).single());
 assert.equal(order.user_id,actors.student.id);assert.ok(['review','mentoring'].includes(order.kind));
 const intent=cli('get',`/v1/payment_intents/${order.payment_intent_id}`);assert.equal(intent.livemode,false);assert.equal(intent.currency,'brl');assert.equal(intent.amount,order.kind==='review'?19900:44900);
 assert.equal((await call('student',`/api/services/${id}/refund`)).status,403);
 assert.equal((await call('teacher',`/api/services/${id}/refund`)).status,403);
 const requested=await call('student',`/api/services/${id}/cancel`);assert.equal(requested.status,200,JSON.stringify(requested));
 const refunded=await call('admin',`/api/services/${id}/refund`);assert.equal(refunded.status,200,JSON.stringify(refunded));assert.equal(refunded.body.status,'refunded');
 const after=ok(await db.from('liceu_service_orders').select('status,refund_id').eq('id',id).single());assert.equal(after.status,'refunded');
 const repeated=await call('admin',`/api/services/${id}/refund`);assert.equal(repeated.status,200);assert.equal(repeated.body.status,'refunded');
 const refunds=cli('get','/v1/refunds','-d',`payment_intent=${order.payment_intent_id}`,'-d','limit=100').data;
 assert.equal(refunds.length,1);assert.equal(refunds[0].id,after.refund_id);assert.equal(refunds[0].status,'succeeded');assert.equal(refunds[0].amount,intent.amount);
 results.push({order:id,kind:order.kind,amount:intent.amount,status:after.status,refund:after.refund_id,repeated_without_duplicate:true});
}
const report={date:new Date().toISOString(),environment:'Stripe sandbox + local Next/Auth/PostgREST; CLI OAuth transport',account:'acct_1TC9LbDLweZOOMDK',livemode:false,results,limits:['No live payment or production mutation','Provider webhook timing recorded separately','Cal external not covered']};
writeFileSync('docs/implementation/STRIPE_SERVICE_ACCEPTANCE_2026-10-28.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
