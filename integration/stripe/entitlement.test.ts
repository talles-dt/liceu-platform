/** Opt-in real sandbox integration. Only Stripe's HTTP transport is adapted to CLI OAuth. */
import {test,vi} from 'vitest';
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {spawn} from 'node:child_process';
import {promisify} from 'node:util';
import {readFileSync,writeFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {createServer} from 'node:http';
import {createClient} from '@supabase/supabase-js';
import Stripe from 'stripe';

const run=promisify(execFile), profile='liceu-validation';
async function api(resource:string,operation:string,id?:string,params:Record<string,unknown>={}){
 const env={...process.env};delete env.STRIPE_API_KEY;
 const args=[...resource.split(' '),operation,...(id?[id]:[]),'--project-name',profile,'--stripe-version','2024-06-20'];
 for(const [k,v] of Object.entries(params))args.push('-d',`${k}=${v}`);
 if(operation==='cancel')args.push('--confirm');
 const {stdout}=await run('stripe',args,{env,timeout:45000,maxBuffer:4*1024*1024});
 if(operation==='cancel'&&!stdout.trim().startsWith('{'))return api(resource,'retrieve',id);
 const result=JSON.parse(stdout);assert.ok(!result.error,JSON.stringify(result.error));
 if('livemode' in result)assert.equal(result.livemode,false,'LIVE MODE REJECTED');return result;
}
vi.mock('@/lib/stripe',()=>({getStripeClient:()=>({
 webhooks:new Stripe('sk_test_signature_verification_only').webhooks,
 subscriptions:{retrieve:(id:string)=>api('subscriptions','retrieve',id,{'expand[0]':'latest_invoice','expand[1]':'default_payment_method'}),cancel:(id:string)=>api('subscriptions','cancel',id,{'invoice_now':false,'prorate':false})},
 checkout:{sessions:{listLineItems:(id:string)=>api('get',`/v1/checkout/sessions/${id}/line_items`)}}
})}));
const pause=(ms:number)=>new Promise(r=>setTimeout(r,ms));
function checked<T extends {data:unknown,error:{message:string}|null}>(result:T):NonNullable<T["data"]>{if(result.error)throw Error(result.error.message);return result.data as NonNullable<T["data"]>;}

test('real signed Stripe deliveries update local student entitlement',async()=>{
 const config=JSON.parse(readFileSync('.local-u00u05/status.json','utf8'));
 assert.equal(new URL(config.API_URL).hostname,'127.0.0.1');
 assert.equal((await api('get','/v1/account')).id,'acct_1TC9LbDLweZOOMDK');
 assert.equal((await api('balance','retrieve')).livemode,false);
 process.env.NEXT_PUBLIC_SUPABASE_URL=config.API_URL;process.env.SUPABASE_SERVICE_ROLE_KEY=config.SERVICE_ROLE_KEY;
 process.env.TRIAL_HASH_SECRET=randomUUID()+randomUUID();
 const db=createClient(config.API_URL,config.SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
 const student=createClient(config.API_URL,config.ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
 const password=randomUUID()+'Aa9!',email=`stripe-${randomUUID()}@example.invalid`;
 const {user}=checked(await db.auth.admin.createUser({email,password,email_confirm:true}));
 assert.ok(user);
 checked(await student.auth.signInWithPassword({email,password}));
 const moduleId=randomUUID(),lessonId=randomUUID();
 const firstModule=checked(await db.from('liceu_modules').select('order_index').order('order_index').limit(1));
 const firstOrder=(firstModule[0]?.order_index??0)-1;
 checked(await db.from('liceu_modules').insert({id:moduleId,code:moduleId.slice(0,8),title:'Stripe sandbox entitlement',order_index:firstOrder,is_active:true}));
 checked(await db.from('liceu_lessons').insert({id:lessonId,module_id:moduleId,code:lessonId.slice(0,8),title:'Sandbox gated lesson',learning_objective:'QA only',order_index:1,is_published:true}));
 const checks:string[]=[],deliveries:{id:string,type:string,status:number}[]=[];
 const pass=(s:string)=>{checks.push(s);console.log('PASS: '+s);};
 const access=async(expected:boolean)=>{
  assert.equal(checked(await student.rpc('liceu_can_access_module',{p_module_id:moduleId})),expected);
  assert.equal(checked(await student.from('liceu_lessons').select('id').eq('id',lessonId)).length,expected?1:0);
 };
 await access(false);pass('Unpaid student denied by RPC and real RLS');
 const {POST}=await import('@/app/api/stripe/webhook/route');
 let queue=Promise.resolve();let captured:{body:string,signature:string}|undefined;
 const server=createServer((req,res)=>{
  let body='';req.on('data',c=>body+=c);req.on('end',()=>{
   queue=queue.then(async()=>{
    const event=JSON.parse(body);assert.equal(event.livemode,false);
    const signature=String(req.headers['stripe-signature']||'');
    const response=await POST(new Request('http://127.0.0.1/api/stripe/webhook',{method:'POST',body,headers:{'stripe-signature':signature}}));
    deliveries.push({id:event.id,type:event.type,status:response.status});captured={body,signature};
    res.writeHead(response.status);res.end(await response.text());
   }).catch(()=>{res.writeHead(500);res.end('QA harness failure');});
  });
 });
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
 const address=server.address() as {port:number};
 const cliEnv={...process.env};delete cliEnv.STRIPE_API_KEY;
 const listener=spawn('stripe',['listen','--project-name',profile,'--skip-update','--events','customer.subscription.created,customer.subscription.updated,customer.subscription.deleted,invoice.paid,invoice.payment_failed','--forward-to',`http://127.0.0.1:${address.port}/api/stripe/webhook`],{env:cliEnv,stdio:['ignore','pipe','pipe']});
 let listenerOutput='';
 for(const stream of [listener.stdout,listener.stderr])stream.on('data',chunk=>{listenerOutput+=chunk.toString();const secret=listenerOutput.match(/whsec_[a-zA-Z0-9]+/);if(secret)process.env.STRIPE_WEBHOOK_SECRET=secret[0];});
 let subscription:string|undefined,clock:string|undefined;
 const report:{at:string,scope:string,account:string,livemode:boolean,checks:string[],deliveries:typeof deliveries,limits:string[],resources?:Record<string,string>,status?:string,error?:string}={at:new Date().toISOString(),scope:'Real Stripe sandbox signed forwarding -> application route/inbox/handlers -> isolated Supabase Auth/PostgREST/RLS',account:'acct_1TC9LbDLweZOOMDK',livemode:false,checks,deliveries,limits:['Stripe SDK network calls use a CLI OAuth adapter; production SDK credential transport not exercised','HTTP harness invokes the real route, not a deployed Next server','Expiry boundary simulated by changing only the synthetic local subscription access_until; Stripe test clocks do not move PostgreSQL time','No production writes, charges, or sales activation']};
 async function row(){return checked(await db.from('liceu_subscriptions').select('*').eq('subscription_id',subscription!).maybeSingle());}
 async function until(predicate:()=>Promise<boolean>,label:string){for(let i=0;i<90;i++){if(await predicate())return;await pause(1000);}throw Error('Timeout: '+label);}
 async function advance(to:number){await api('test_helpers test_clocks','advance',clock!,{frozen_time:to});await until(async()=>(await api('test_helpers test_clocks','retrieve',clock!)).status==='ready','Stripe clock ready');}
 try{
  await until(async()=>!!process.env.STRIPE_WEBHOOK_SECRET,'listener ready');
  clock=(await api('test_helpers test_clocks','create',undefined,{frozen_time:Math.floor(Date.now()/1000),name:'Liceu local entitlement QA'})).id;
  const customer=(await api('customers','create',undefined,{test_clock:clock,name:'Synthetic local Liceu student'})).id;
  checked(await db.from('liceu_billing_accounts').insert({user_id:user.id,customer_id:customer}));
  async function card(fixture:string){const pm=await api('payment_methods','attach',fixture,{customer});await api('customers','update',customer,{'invoice_settings[default_payment_method]':pm.id});}
  await card('pm_card_visa');
  const price=JSON.parse(readFileSync('.local-u00u05/stripe-sandbox-state.json','utf8')).resources.price_monthly;
  let sub=await api('subscriptions','create',undefined,{customer,'items[0][price]':price,payment_behavior:'error_if_incomplete','metadata[liceu_user_id]':user.id});subscription=sub.id;
  report.resources={subscription:subscription!,clock:clock!,customer,user:user.id};
  await until(async()=> (await row())?.status==='active','paid activation');await access(true);
  const initial=await row();assert.equal(Date.parse(initial.access_until)/1000,sub.current_period_end);pass('Real initial payment grants paid interval and lesson access');
  await advance(sub.current_period_end+1);await advance(sub.current_period_end+7200);
  sub=await api('subscriptions','retrieve',subscription);await until(async()=>Date.parse((await row())?.access_until)>Date.parse(initial.access_until),'renewal extends access');
  const renewed=await row();assert.equal(Date.parse(renewed.access_until)/1000,sub.current_period_end);await access(true);pass('Real paid renewal extends access');
  await card('pm_card_chargeCustomerFail');await advance(sub.current_period_end+1);await advance(sub.current_period_end+7200);
  await until(async()=>(await row())?.status==='past_due','failed renewal');assert.equal((await row()).access_until,renewed.access_until);await access(true);pass('Failed renewal preserves only already-paid interval');
  await api('subscriptions','cancel',subscription,{invoice_now:false,prorate:false});
  await until(async()=>(await row())?.status==='canceled','cancellation');assert.equal((await row()).access_until,renewed.access_until);await access(true);pass('Cancellation preserves already-paid interval without extension');
  await queue;assert.ok(captured);
  const duplicate=await POST(new Request('http://localhost/api/stripe/webhook',{method:'POST',body:captured.body,headers:{'stripe-signature':captured.signature}}));assert.equal(duplicate.status,200);
  const eventId=JSON.parse(captured.body).id;
  const receipt=checked(await db.from('liceu_webhook_inbox').select('status,attempts').eq('provider','stripe').eq('event_id',eventId).single());assert.equal(receipt.status,'done');assert.equal(receipt.attempts,1);pass('Repeated signed event acknowledged once');
  const tampered=await POST(new Request('http://localhost/api/stripe/webhook',{method:'POST',body:captured.body+' ',headers:{'stripe-signature':captured.signature}}));assert.equal(tampered.status,400);pass('Tampered delivery rejected');
  checked(await db.from('liceu_subscriptions').update({access_until:new Date(Date.now()-60000).toISOString()}).eq('subscription_id',subscription));await access(false);pass('After paid interval expires, RPC and RLS deny lesson access');
  assert.ok(deliveries.length>0);assert.ok(deliveries.every(d=>d.status===200),JSON.stringify(deliveries));report.status='passed';
 }catch(e){report.status='failed';report.error=e instanceof Error?e.message:String(e);throw e;}
 finally{
  if(subscription){const sub=await api('subscriptions','retrieve',subscription);if(sub.status!=='canceled')await api('subscriptions','cancel',subscription,{invoice_now:false,prorate:false});}
  listener.kill('SIGTERM');await queue;await new Promise<void>(resolve=>server.close(()=>resolve()));
  delete process.env.STRIPE_WEBHOOK_SECRET;
  writeFileSync('docs/implementation/STRIPE_ENTITLEMENT_VERIFICATION.json',JSON.stringify(report,null,2)+'\n');
 }
});
