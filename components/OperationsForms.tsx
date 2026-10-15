"use client";
import {useState} from "react";
export function ReplayEvent({provider,eventId}:{provider:string;eventId:string}){
 const [message,setMessage]=useState(""),[busy,setBusy]=useState(false);
 return <div><button disabled={busy} className="border p-2" onClick={async()=>{setBusy(true);try{const r=await fetch("/api/admin/operations",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"replay",provider,eventId})});const d=await r.json();setMessage(r.ok?"Processado. Atualize para conferir.":d.error);}catch{setMessage("Sem conexão. O evento permanece na fila.");}finally{setBusy(false);}}}>Retomar processamento</button><p role="status">{message}</p></div>;
}
export function LegacyResolution({eventId}:{eventId:string}){
 const [message,setMessage]=useState(""),[busy,setBusy]=useState(false);
 return <form className="space-y-2" onSubmit={async e=>{e.preventDefault();setBusy(true);const f=new FormData(e.currentTarget);try{const r=await fetch("/api/admin/operations",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"resolve_legacy",eventId,email:f.get("email"),reason:f.get("reason"),until:new Date(String(f.get("until"))).toISOString()})});const d=await r.json();setMessage(r.ok?"Conciliação registrada. A conta com email confirmado poderá recuperar o acesso.":d.error);}catch{setMessage("Falha ao registrar.");}finally{setBusy(false);}}}>
 <p>Conceder acesso ao curso inteiro, sem alterar o progresso. Confira o comprovante antes de registrar.</p>
 <label className="block">Email do pagador <input required name="email" type="email" className="border bg-transparent p-2"/></label>
 <label className="block">Validade do acesso <input required name="until" type="datetime-local" className="border bg-transparent p-2"/></label>
 <label className="block">Justificativa e referência do comprovante <textarea required minLength={20} maxLength={3000} name="reason" className="border bg-transparent p-2"/></label>
 <button disabled={busy} className="border p-2">Registrar conciliação</button><p role="status">{message}</p></form>;
}
export function ClaimLegacy(){
 const [message,setMessage]=useState("");
 return <div><button className="underline" onClick={async()=>{try{const r=await fetch("/api/me/legacy-access",{method:"POST"});const d=await r.json();setMessage(r.ok?d.claimed?"Acesso anterior recuperado.":"Não há conciliação pendente para seu email confirmado.":d.error);}catch{setMessage("Não foi possível consultar.");}}}>Recuperar compra anterior conciliada</button><p role="status">{message}</p></div>;
}
