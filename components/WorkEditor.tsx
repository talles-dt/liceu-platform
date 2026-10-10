"use client";
import {useEffect,useRef,useState} from "react";
export function WorkEditor({exerciseId,initialContent}:{exerciseId:string;initialContent:string}){
 const [content,setContent]=useState(initialContent),[status,setStatus]=useState(""),[busy,setBusy]=useState(false);const dirty=useRef(false);const revision=useRef(0);
 useEffect(()=>{if(!dirty.current)return;const controller=new AbortController();const own=revision.current;const timer=setTimeout(async()=>{
  setStatus("Salvando…");try{const r=await fetch("/api/work",{method:"POST",signal:controller.signal,headers:{"content-type":"application/json"},body:JSON.stringify({exerciseId,content})});if(!r.ok)throw new Error();if(own===revision.current)setStatus("Rascunho salvo");}catch{if(!controller.signal.aborted)setStatus("Falha ao salvar. Seu texto continua nesta tela.");}
 },1000);return()=>{clearTimeout(timer);controller.abort();};},[content,exerciseId]);
 return <div className="space-y-3"><textarea aria-label="Sua produção" className="w-full min-h-48 border bg-transparent p-3" value={content} maxLength={50000} onChange={e=>{dirty.current=true;revision.current++;setContent(e.target.value);}}/>
 <button disabled={busy||!content.trim()} className="border p-3" onClick={async()=>{setBusy(true);try{const r=await fetch("/api/work",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({exerciseId,content,publish:true})});if(!r.ok)throw new Error();setStatus("Versão guardada. Ela está disponível no histórico e para solicitar revisão.");}catch{setStatus("Falha ao guardar versão. Tente novamente.");}finally{setBusy(false);}}}>Guardar versão no histórico</button><p role="status">{status}</p></div>;
}
