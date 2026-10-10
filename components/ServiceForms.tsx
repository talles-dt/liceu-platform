"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
type Work={id:string;created_at:string};
export function ServiceRequest({works}:{works:Work[]}){
 const router=useRouter();const [message,setMessage]=useState("");const [busy,setBusy]=useState(false);
 async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setMessage("");
 const f=new FormData(e.currentTarget);try{const res=await fetch("/api/services",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({kind:f.get("kind"),scope:f.get("scope"),workVersionId:f.get("work")})});const d=await res.json();if(!res.ok)throw new Error(d.error);setMessage("Solicitação registrada. Você receberá uma proposta antes de pagar.");router.refresh();}catch(e){setMessage(e instanceof Error?e.message:"Erro ao enviar");}finally{setBusy(false);}}
 return <form onSubmit={submit} className="space-y-4 border p-5"><h2 className="text-xl">Solicitar acompanhamento</h2>
 <label className="block">Tipo <select name="kind" className="block bg-[var(--liceu-bg)] p-2 border"><option value="mentoring">Mentoria por sessão</option><option value="review">Revisão de uma produção</option></select></label>
 <label className="block">Produção para revisão <select name="work" className="block bg-[var(--liceu-bg)] p-2 border"><option value="">Escolha se solicitar revisão</option>{works.map(w=><option key={w.id} value={w.id}>{new Date(w.created_at).toLocaleString("pt-BR")}</option>)}</select></label>
 <label className="block">Seu objetivo<textarea required name="scope" minLength={20} maxLength={3000} className="block w-full min-h-32 border bg-transparent p-3" /></label>
 <button disabled={busy} className="border px-4 py-2">{busy?"Enviando…":"Enviar solicitação sem cobrança"}</button><p role="status">{message}</p></form>;
}
export function OrderPayment({id}:{id:string}){
 const [error,setError]=useState("");const [busy,setBusy]=useState(false);
 return <div><button disabled={busy} className="underline" onClick={async()=>{setBusy(true);try{const r=await fetch(`/api/services/${id}/checkout`,{method:"POST"});const d=await r.json();if(!r.ok)throw new Error(d.error);window.location.assign(d.url);}catch(e){setError(e instanceof Error?e.message:"Erro ao continuar");setBusy(false);}}}>Aceitar proposta e conferir pagamento</button><p role="alert">{error}</p></div>;
}
export function TeacherOrderForm({id,status,scope}:{id:string;status:string;scope:string}){
 const [message,setMessage]=useState("");const [busy,setBusy]=useState(false);const router=useRouter();
 if(!["requested","paid"].includes(status))return null;
 return <form className="space-y-3" onSubmit={async e=>{e.preventDefault();setBusy(true);const f=new FormData(e.currentTarget);try{const r=await fetch(`/api/services/${id}`,{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify(status==="requested"?{action:"offer",scope:f.get("scope"),dueAt:f.get("dueAt"),durationMinutes:Number(f.get("duration"))}:{action:"complete",feedback:f.get("feedback")})});const d=await r.json();if(!r.ok)throw new Error(d.error);router.refresh();}catch(e){setMessage(e instanceof Error?e.message:"Erro ao salvar");}finally{setBusy(false);}}}>
 {status==="requested"?<><label className="block">Escopo<textarea name="scope" defaultValue={scope} minLength={20} required className="block w-full bg-transparent border p-2"/></label><label className="block">Prazo da revisão ou horário proposto (seu fuso local)<input name="dueAt" required type="datetime-local" className="block bg-transparent border p-2"/></label><label className="block">Duração da mentoria (minutos)<input name="duration" type="number" defaultValue={60} min={15} max={180} className="block bg-transparent border p-2"/></label></>:<label className="block">Feedback entregue<textarea name="feedback" required minLength={20} maxLength={20000} className="block w-full min-h-32 bg-transparent border p-2" /></label>}
 <button disabled={busy} className="border p-2">{status==="requested"?"Assumir pedido e enviar proposta":"Registrar entrega"}</button><p role="alert">{message}</p></form>;
}
