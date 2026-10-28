import {randomUUID} from "node:crypto";
import {createSupabaseAdminClient} from "@/lib/supabaseAdmin";
import {getStripeClient} from "@/lib/stripe";

/** Run only after independent review; each persisted step is safe to resume. */
async function executeErasure(requestId:string,actorId:string){
 const db=createSupabaseAdminClient(actorId);
 const q=await db.from("liceu_privacy_requests").select("*").eq("id",requestId).single();
 if(q.error)throw Error("Request unavailable");
 const job=q.data;
 if(job.status==="completed")return;
 if(!["approved","processing"].includes(job.status))throw Error("Independent review required");
 async function step(value:string){
  const r=await db.from("liceu_privacy_requests").update({status:"processing",step:value,last_error:null}).eq("id",requestId).eq("step",job.step).neq("status","completed").select("id");
  if(r.error||!r.data?.length)throw Error("Checkpoint changed; reload request");
 }
 try{
  if(job.step==="revoke"){
   // Never erase the identity needed to stop an outstanding renewal or refund.
   const account=await db.from("liceu_billing_accounts").select("customer_id").eq("user_id",job.user_id).maybeSingle();
   if(account.error)throw Error("Billing lookup unavailable");
   if(account.data?.customer_id){
    for await(const sub of getStripeClient().subscriptions.list({customer:account.data.customer_id,status:"all",limit:100})){
     if(!["canceled","incomplete_expired"].includes(sub.status))throw Error("Cancel outstanding subscriptions before erasure");
    }
   }
   const suspended=await db.from("users").update({suspended_at:new Date().toISOString(),suspended_by:actorId,suspension_reason:"privacy_erasure"}).eq("id",job.user_id);
   if(suspended.error)throw Error("Cannot revoke access");
   const ban=await db.auth.admin.updateUserById(job.user_id,{ban_duration:"876000h"});
   if(ban.error)throw Error("Cannot revoke authentication");
   const manifest=await db.rpc("liceu_plan_privacy_files",{p_request:requestId});
   if(manifest.error)throw Error("Cannot inventory private files");
   await step("files");job.step="files";
  }
  if(job.step==="files"){
   // Repeatedly consume the first page; never offset over a shrinking result set.
   while(true){
    const files=await db.from("liceu_privacy_files").select("bucket,path").eq("request_id",requestId).is("removed_at",null).limit(100);
    if(files.error)throw Error("File manifest unavailable");if(!files.data.length)break;
    for(const f of files.data){
     const removed=await db.storage.from(f.bucket).remove([f.path]);if(removed.error)throw Error("Storage removal failed");
     const checkpoint=await db.from("liceu_privacy_files").update({removed_at:new Date().toISOString()}).eq("request_id",requestId).eq("bucket",f.bucket).eq("path",f.path);
     if(checkpoint.error)throw Error("File checkpoint failed");
    }
   }
   await step("data");job.step="data";
  }
  if(job.step==="data"){
   const scrub=await db.rpc("liceu_scrub_personal_data",{p_request:requestId});
   if(scrub.error)throw Error("Personal data transaction failed");
   job.step="auth";
  }
  if(job.step==="auth"){
   // Soft deletion removes login/PII while preserving references needed by reviewed retained records.
   const removed=await db.auth.admin.deleteUser(job.user_id,true);
   if(removed.error&&removed.error.status!==404)throw Error("Authentication erasure failed");
   const done=await db.from("liceu_privacy_requests").update({status:"completed",step:"done",completed_at:new Date().toISOString(),last_error:null}).eq("id",requestId).eq("step","auth");
   if(done.error)throw Error("Final checkpoint failed");
  }
 }catch(e){
  await db.from("liceu_privacy_requests").update({last_error:e instanceof Error?e.message:"processing_failed"}).eq("id",requestId).neq("status","completed");
  throw e;
 }
}

export async function runErasure(requestId:string,actorId:string){
 const db=createSupabaseAdminClient(actorId),token=randomUUID(),entity="privacy:"+requestId;
 const lease=await db.rpc("liceu_lock_billing_entity",{p_entity:entity,p_token:token});
 if(lease.error||!lease.data)throw Error("Erasure already in progress");
 try{await executeErasure(requestId,actorId);}finally{await db.rpc("liceu_unlock_billing_entity",{p_entity:entity,p_token:token});}
}
