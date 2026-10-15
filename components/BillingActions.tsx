"use client";
import { useState } from "react";
export function BillingActions({ enabled, customer, trialEligible }: { enabled: boolean; customer: boolean; trialEligible: boolean }) {
 const [consent,setConsent]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState("");
 async function go(portal=false){setBusy(true);setError("");try{
  const res=await fetch(portal?"/api/billing/portal":"/api/stripe/checkout",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({kind:"subscription",consent})});
  const data=await res.json();if(!res.ok || !data.url)throw new Error(data.error||"Não foi possível continuar.");window.location.assign(data.url);
 }catch(e){setError(e instanceof Error?e.message:"Erro ao continuar");setBusy(false);}}
 return <div className="space-y-4">
  <label className="flex items-start gap-3"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} />
   <span>Concordo com a cobrança mensal automática no valor informado. {trialEligible?"Posso cancelar antes do fim dos 14 dias para evitar a primeira cobrança.":"Já utilizei o teste grátis e a cobrança começa na contratação."}</span></label>
  <button className="border px-5 py-3 disabled:opacity-40" disabled={!enabled||!consent||busy} onClick={()=>go()}>{busy?"Aguarde…":trialEligible?"Iniciar 14 dias grátis com cartão":"Assinar mensalmente"}</button>
  {customer && <button className="block underline" disabled={busy} onClick={()=>go(true)}>Gerenciar pagamento ou cancelar assinatura</button>}
  {error && <p role="alert">{error}</p>}
 </div>;
}
