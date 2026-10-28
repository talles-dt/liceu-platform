import {cohortSnapshot,fail,uuid} from "@/lib/formation/server";
import type {Curriculum} from "@/lib/formation/curriculum";
const escape=(s:string)=>s.replace(/\\/g,"\\\\").replace(/\n/g,"\\n").replace(/[,;]/g,"\\$&").replace(/\r/g,"");
const stamp=(s:string)=>new Date(s).toISOString().replace(/[-:]/g,"").replace(/\.\d{3}Z$/,"Z");
export async function GET(_r:Request,{params}:{params:Promise<{cohortId:string}>}){
 const {cohortId}=await params;if(!uuid(cohortId))return fail("Não encontrado",404);
 try{const data=await cohortSnapshot(cohortId);if(!data)return fail("Sem acesso",404);const manifest=data.release.manifest as Curriculum;const items=manifest.cycles.flatMap(c=>c.activities);
 const lines=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Liceu//Formacao//PT","CALSCALE:GREGORIAN"];
 for(const a of data.tables.activities){if(!a.starts_at||!a.ends_at)continue;lines.push("BEGIN:VEVENT",`UID:${a.id}@liceu`, `DTSTAMP:${stamp(new Date().toISOString())}`,`DTSTART:${stamp(String(a.starts_at))}`,`DTEND:${stamp(String(a.ends_at))}`,`SEQUENCE:${a.revision}`,`SUMMARY:${escape(items.find(x=>x.key===a.item_key)?.title??"Encontro")}`,`STATUS:${a.status==="cancelled"?"CANCELLED":"CONFIRMED"}`,"END:VEVENT");}
 lines.push("END:VCALENDAR");return new Response(lines.join("\r\n")+"\r\n",{headers:{"Content-Type":"text/calendar; charset=utf-8","Cache-Control":"private, no-store","Content-Disposition":"attachment; filename=liceu-agenda.ics"}});
 }catch{return fail("Agenda indisponível",503);}
}
