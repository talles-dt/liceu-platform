// Real Auth integration on an isolated, disposable account. Does not send email.
import {createClient} from '@supabase/supabase-js';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
process.loadEnvFile('.local-u00u05/recovery-qa/.env.production');
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
assert.equal(new URL(url).hostname,'rymzyaxhrcusqqzllzay.supabase.co');
const options={auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}};
const admin=createClient(url,process.env.SUPABASE_SERVICE_ROLE_KEY,options);
const client=()=>createClient(url,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,options);
const tag=randomUUID(),email=`recovery-qa-${tag}@example.invalid`,oldPassword=randomUUID()+'Aa1!',newPassword=randomUUID()+'Bb2!';
const site=process.env.NEXT_PUBLIC_SITE_URL||'https://www.oliceu.com';
let id;const evidence={project:'rymzyaxhrcusqqzllzay',testedAt:new Date().toISOString(),emailDeliveryTested:false,checks:[],cleanedUp:false};
try{
 const created=await admin.auth.admin.createUser({email,password:oldPassword,email_confirm:true,user_metadata:{qa_recovery:tag}});assert.ok(!created.error,'Create synthetic account');id=created.data.user.id;
 const generated=await admin.auth.admin.generateLink({type:'recovery',email,options:{redirectTo:site+'/reset-password'}});assert.ok(!generated.error,'Generate recovery link');
 const tokenHash=generated.data.properties.hashed_token;assert.ok(tokenHash,'Recovery token present');
 const landing=new URL('/reset-password',site);landing.hash=new URLSearchParams({recovery_token:tokenHash}).toString();
 // A scanner GET sends no fragment and must not consume the recovery token.
 for(let i=0;i<2;i++){const prefetch=await fetch(landing);assert.equal(prefetch.status,200,'Landing page is readable');}
 evidence.checks.push('two landing-page GETs do not consume recovery token');
 const recovery=client();const session=await recovery.auth.verifyOtp({token_hash:tokenHash,type:'recovery'});assert.ok(!session.error,'Explicit confirmation establishes recovery session');assert.equal(session.data.user.id,id);
 evidence.checks.push('explicit recovery confirmation accepts token after GETs');
 const changed=await recovery.auth.updateUser({password:newPassword});assert.ok(!changed.error,'Update password');await recovery.auth.signOut();evidence.checks.push('new password saved via public SDK');
 const old=await client().auth.signInWithPassword({email,password:oldPassword});assert.ok(old.error,'Old password rejected');evidence.checks.push('old password rejected');
 const fresh=client();const login=await fresh.auth.signInWithPassword({email,password:newPassword});assert.ok(!login.error,'New password login');assert.equal(login.data.user.id,id);await fresh.auth.signOut();evidence.checks.push('new password authenticates same account');
 const replay=await client().auth.verifyOtp({token_hash:tokenHash,type:'recovery'});assert.ok(replay.error&&!replay.data.session,'Used token rejected');evidence.checks.push('used recovery token rejected');
}catch(error){evidence.error=error.message;process.exitCode=1;}finally{
 if(id){const own=await admin.auth.admin.getUserById(id);assert.equal(own.data.user?.user_metadata.qa_recovery,tag);const deleted=await admin.auth.admin.deleteUser(id);assert.ok(!deleted.error,'Remove synthetic account');evidence.cleanedUp=true;}
 writeFileSync('.local-u00u05/recovery-qa/auth-result.json',JSON.stringify(evidence,null,2),{mode:0o600});console.log(JSON.stringify(evidence,null,2));
}
