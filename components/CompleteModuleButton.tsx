"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
export function CompleteModuleButton({moduleId}:{moduleId:string}){
 const [busy,setBusy]=useState(false),[message,setMessage]=useState("");const router=useRouter();
 return <div><button disabled={busy} className="border px-4 py-3" onClick={async()=>{setBusy(true);try{const r=await fetch(`/api/modules/${moduleId}/complete`,{method:"POST"});const d=await r.json();if(!r.ok)throw new Error(d.error);setMessage("Módulo concluído. Próximo módulo liberado.");router.refresh();}catch(e){setMessage(e instanceof Error?e.message:"Erro ao salvar");}finally{setBusy(false);}}}>Concluir módulo</button><p role="status">{message}</p></div>;
}
