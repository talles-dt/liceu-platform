/** Starts only local services, refuses another Stripe account or live mode. */
import {readFileSync,writeFileSync,createWriteStream} from 'node:fs';
import {execFileSync,spawn} from 'node:child_process';
import {createServer,request} from 'node:http';
import {resolve} from 'node:path';
import {connect} from 'node:net';
import assert from 'node:assert/strict';
const s=JSON.parse(readFileSync('.local-u00u05/status.json','utf8'));
assert.equal(new URL(s.API_URL).hostname,'127.0.0.1');
const env={...process.env};delete env.STRIPE_API_KEY;
const cli=(...args)=>JSON.parse(execFileSync('stripe',[...args,'--project-name','liceu-validation'],{env,stdio:['ignore','pipe','pipe']}).toString());
assert.equal(cli('get','/v1/account').id,'acct_1TC9LbDLweZOOMDK');assert.equal(cli('balance','retrieve').livemode,false);
const prices=JSON.parse(readFileSync('.local-u00u05/stripe-sandbox-state.json','utf8')).resources;
const secret=execFileSync('stripe',['listen','--project-name','liceu-validation','--print-secret'],{env,stdio:['ignore','pipe','pipe']}).toString().match(/whsec_[\w]+/)?.[0];assert.ok(secret);
const proxy=createServer((req,res)=>{
 const supabase=/^\/(auth|rest|storage)\/v1(?:\/|\?)/.test(req.url);
 const upstream=request({hostname:'127.0.0.1',port:supabase?54321:3111,path:req.url,method:req.method,headers:req.headers},r=>{res.writeHead(r.statusCode,r.headers);r.pipe(res);});
 upstream.on('error',()=>{res.writeHead(502);res.end('Local upstream unavailable');});req.pipe(upstream);
});
proxy.on('upgrade',(req,socket,head)=>{
 const upstream=connect(3111,'127.0.0.1',()=>{
  upstream.write(`${req.method} ${req.url} HTTP/${req.httpVersion}\r\n`+Object.entries(req.headers).map(([k,v])=>`${k}: ${v}`).join('\r\n')+'\r\n\r\n');
  if(head.length)upstream.write(head);socket.pipe(upstream);upstream.pipe(socket);
 });upstream.on('error',()=>socket.destroy());socket.on('error',()=>upstream.destroy());
});proxy.listen(3112,'127.0.0.1');
const app=spawn('node',['node_modules/next/dist/bin/next','dev','--port','3111','--hostname','127.0.0.1'],{env:{...env,LICEU_LOCAL_QA:'1',NODE_OPTIONS:`--require=${resolve('integration/stripe/cli-transport.cjs')}`,NEXT_PUBLIC_SUPABASE_URL:'http://localhost:3112',NEXT_PUBLIC_SUPABASE_ANON_KEY:s.ANON_KEY,SUPABASE_SERVICE_ROLE_KEY:s.SERVICE_ROLE_KEY,NEXT_PUBLIC_SITE_URL:'http://localhost:3112',STRIPE_SECRET_KEY:'sk_test_local_cli_transport',STRIPE_WEBHOOK_SECRET:secret,STRIPE_SALES_ENABLED:'true',STRIPE_MONTHLY_PRICE_ID:prices.price_monthly,STRIPE_REVIEW_PRICE_ID:prices.price_review,STRIPE_MENTORING_PRICE_ID:prices.price_mentoring,TRIAL_HASH_SECRET:'synthetic-local-browser-qa-secret-only-32'},stdio:['ignore','pipe','pipe']});
const log=createWriteStream('.local-u00u05/browser-qa.log');app.stdout.pipe(log);app.stderr.pipe(log);
const listener=spawn('stripe',['listen','--project-name','liceu-validation','--skip-update','--forward-to','http://127.0.0.1:3112/api/stripe/webhook','--events','checkout.session.completed,checkout.session.async_payment_succeeded,customer.subscription.created,customer.subscription.updated,customer.subscription.deleted,invoice.paid,invoice.payment_failed,refund.created,refund.updated,refund.failed'],{env,stdio:['ignore','pipe','pipe']});
const deliveries=createWriteStream('.local-u00u05/browser-deliveries.log');
for(const stream of [listener.stdout,listener.stderr])stream.on('data',d=>deliveries.write(d.toString().replace(/whsec_\w+/g,'[REDACTED]')));
writeFileSync('.local-u00u05/browser-qa-pids.json',JSON.stringify({runner:process.pid,app:app.pid,listener:listener.pid}));
function stop(){listener.kill();app.kill();proxy.close();}
process.on('SIGTERM',stop);process.on('SIGINT',stop);
console.log('Isolated browser QA: http://localhost:3112 (Stripe sandbox via CLI OAuth; local Supabase).');
