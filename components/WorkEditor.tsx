"use client";
import {useEffect,useRef,useState} from "react";
export function WorkEditor({exerciseId,initialContent,initialRevision=0}:{exerciseId:string;initialContent:string;initialRevision?:number}){
 const [content,setContent]=useState(initialContent),[revision,setRevision]=useState(initialRevision),[status,setStatus]=useState(""),[busy,setBusy]=useState(false);const dirty=useRef(false);const requestId=useRef<string|null>(null);
 useEffect(()=>{const warn=(e:BeforeUnloadEvent)=>{if(dirty.current){e.preventDefault();e.returnValue="";}};const navigate=(event:MouseEvent)=>{
  const link=event.target instanceof Element?event.target.closest("a[href]"):null;
  if(!dirty.current||!link||event.defaultPrevented||event.ctrlKey||event.metaKey||event.shiftKey||link.getAttribute("target")==="_blank")return;
  if(!window.confirm("Há alterações não salvas. Sair e descartar o texto?")){event.preventDefault();event.stopPropagation();}
 };
 document.addEventListener("click",navigate,true);window.addEventListener("beforeunload",warn);
 return()=>{document.removeEventListener("click",navigate,true);window.removeEventListener("beforeunload",warn);};},[]);
 async function save(publish:boolean){setBusy(true);try{if(publish&&!requestId.current)requestId.current=crypto.randomUUID();const r=await fetch("/api/work",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({exerciseId,content,revision,publish,requestId:requestId.current})});const d=await r.json();if(!r.ok)throw Error(d.error??"Falha ao salvar");setRevision(d.revision);dirty.current=false;requestId.current=null;setStatus(publish?"Versão guardada no histórico.":"Rascunho salvo.");}catch(e){setStatus(e instanceof TypeError?"Falha de conexão. Seu texto continua aqui; tente salvar novamente.":e instanceof Error?e.message:"Falha ao salvar. Seu texto continua aqui.");}finally{setBusy(false);}}
 return <div className="space-y-3"><textarea aria-label="Sua produção" disabled={busy} className="w-full min-h-48 border bg-transparent p-3" value={content} maxLength={50000} onChange={e=>{dirty.current=true;requestId.current=null;setContent(e.target.value);setStatus("Alterações ainda não salvas");}}/><div className="flex gap-3"><button disabled={busy} className="border p-3" onClick={()=>save(false)}>Salvar rascunho</button><button disabled={busy||!content.trim()} className="border p-3" onClick={()=>save(true)}>Guardar versão no histórico</button></div><p role="status">{status}</p></div>;
}
