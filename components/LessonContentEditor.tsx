"use client";
import {useState} from "react";
export function LessonContentEditor({moduleId,lessonId,sectionId,initial,video=false}:{moduleId:string;lessonId:string;sectionId?:string;initial:string;video?:boolean}){
 const [value,setValue]=useState(initial),[status,setStatus]=useState(""),[busy,setBusy]=useState(false);
 return <form className="space-y-3" onSubmit={async e=>{e.preventDefault();setBusy(true);try{const r=await fetch("/api/admin/content/lessons/"+moduleId,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({lesson_id:lessonId,...video?{cloudflare_stream_id:value}:{section_id:sectionId,content:value}})});const d=await r.json();setStatus(r.ok?"Alteração salva e registrada na auditoria.":d.error);}catch{setStatus("Sem conexão; o texto permanece aqui.");}finally{setBusy(false);}}}>
 <label className="block">{video?"Identificador do vídeo":"Texto da seção"}{video?<input disabled={busy} className="block border p-2 bg-transparent" value={value} maxLength={100} onChange={e=>{setValue(e.target.value);setStatus("Alteração não salva");}}/>:<textarea disabled={busy} className="block w-full min-h-64 border p-3 bg-transparent" value={value} maxLength={200000} onChange={e=>{setValue(e.target.value);setStatus("Alteração não salva");}}/>}</label>
 <button disabled={busy} className="border p-3">Salvar {video?"vídeo":"seção"}</button><p role="status">{status}</p></form>;
}
