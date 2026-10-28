/* eslint-disable @typescript-eslint/no-require-imports -- Node --require preload must be CommonJS. */
/* Local-only OAuth transport. Real SDK requests and responses, no response fixtures. */
const assert=require('node:assert/strict');
const path=require('node:path');
const {execFile}=require('node:child_process');
const {promisify}=require('node:util');
const {Readable}=require('node:stream');
assert.equal(process.env.LICEU_LOCAL_QA,'1');
assert.ok(['localhost','127.0.0.1'].includes(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname));
assert.equal(process.env.STRIPE_SECRET_KEY,'sk_test_local_cli_transport');
const entry=require.resolve('stripe');
const {NodeHttpClient}=require(path.join(path.dirname(entry),'net/NodeHttpClient.js'));
const run=promisify(execFile);
NodeHttpClient.prototype.makeRequest=async function(host,port,requestPath,method,headers,body){
 assert.equal(host,'api.stripe.com');
 const url=new URL(requestPath,'https://api.stripe.com');
 const args=[method.toLowerCase(),url.pathname,'--project-name','liceu-validation','--stripe-version','2024-06-20'];
 for(const [k,v] of [...url.searchParams,...new URLSearchParams(body)])args.push('-d',`${k}=${v}`);
 if(headers['Idempotency-Key'])args.push('--idempotency',headers['Idempotency-Key']);
 if(method==='DELETE')args.push('--confirm');
 const env={...process.env};delete env.STRIPE_API_KEY;delete env.NODE_OPTIONS;
 let stdout;try{({stdout}=await run('stripe',args,{env,timeout:45000,maxBuffer:4*1024*1024}));}catch(e){stdout=e.stdout;if(!stdout)throw Error('Stripe CLI transport unavailable');}
 const data=JSON.parse(stdout);if('livemode' in data)assert.equal(data.livemode,false);
 const status=data.error?400:200;
 return {getStatusCode:()=>status,getHeaders:()=>({'content-type':'application/json'}),toJSON:async()=>data,getRawResponse:()=>Readable.from([JSON.stringify(data)]),toStream:()=>Readable.from([JSON.stringify(data)])};
};
// Next may load Stripe's ESM build; its HTTPS module shares this Node transport.
const https=require('node:https');const {EventEmitter}=require('node:events');const originalRequest=https.request;
https.request=function(options,callback){
 if(options?.host!=='api.stripe.com'&&options?.hostname!=='api.stripe.com')return originalRequest.apply(this,arguments);
 const req=new EventEmitter();let body='';req.setTimeout=()=>req;req.write=chunk=>{body+=chunk;return true;};req.destroy=error=>{if(error)req.emit('error',error);};
 req.end=()=>{
  NodeHttpClient.prototype.makeRequest('api.stripe.com',443,options.path,options.method,options.headers,body).then(r=>{
   const response=r.getRawResponse();response.statusCode=r.getStatusCode();response.headers=r.getHeaders();
   if(callback)callback(response);req.emit('response',response);
  }).catch(e=>req.emit('error',e));
 };
 process.nextTick(()=>req.emit('socket',{connecting:false}));return req;
};
