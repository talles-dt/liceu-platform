// Production RPC verification using disposable counter keys only. Sends no email.
import {createClient} from '@supabase/supabase-js';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
process.loadEnvFile('.local-u00u05/recovery-qa/.env.production');
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
assert.equal(new URL(url).hostname,'rymzyaxhrcusqqzllzay.supabase.co');
const options={auth:{persistSession:false,autoRefreshToken:false}};
const db=createClient(url,process.env.SUPABASE_SERVICE_ROLE_KEY,options);
const anon=createClient(url,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,options);
const key=`qa:recovery-limit:${randomUUID()}`;
let primaryError;
try {
 const args={p_key:key,p_limit:3,p_seconds:60};
 const attempts=await Promise.all(Array.from({length:10},()=>db.rpc('liceu_rate_limit',args)));
 attempts.forEach(r=>assert.ok(!r.error,'RPC available'));
 assert.equal(attempts.filter(r=>r.data===true).length,3,'Exactly three concurrent requests allowed');
 const denied=await anon.rpc('liceu_rate_limit',args);assert.ok(denied.error,'Anonymous client cannot manipulate counters');
 const expired=await db.from('liceu_rate_limits').update({window_end:new Date(Date.now()-1000).toISOString()}).eq('key',key);assert.ok(!expired.error);
 const reopened=await db.rpc('liceu_rate_limit',args);assert.equal(reopened.data,true,'Window expiration restores access');
 console.log('PASS: 3/10 concurrent requests accepted; anonymous mutation denied; expired window resets.');
} catch(error) {
 primaryError=error; throw error;
} finally {
 const removed=await db.from('liceu_rate_limits').delete().eq('key',key);if(removed.error){
  console.error('Cleanup could not be confirmed for temporary counter:',key);
  if(!primaryError)throw new Error('Disposable counter cleanup failed');
 }else console.log('Temporary counter removed.');
}
