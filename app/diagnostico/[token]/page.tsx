import {notFound} from "next/navigation";
import {ReadingLayout} from "@/components/ReadingLayout";
import {createSupabaseAdminClient} from "@/lib/supabaseAdmin";
export default async function SharedDiagnostic({params}:{params:Promise<{token:string}>}){
 const {token}=await params;if(!/^[a-zA-Z0-9_-]{20,128}$/.test(token))notFound();
 const {data,error}=await createSupabaseAdminClient().from("diagnostic_sessions").select("archetype_name,ethos_level").eq("share_token",token).not("shared_at","is",null).maybeSingle();
 if(error||!data)notFound();
 return <ReadingLayout eyebrow="LICEU / DIAGNÓSTICO COMPARTILHADO" title={data.archetype_name} subtitle="Resultado compartilhado pelo participante."><p>{data.ethos_level}</p><p>Este diagnóstico é um ponto de partida para o estudo.</p></ReadingLayout>;
}
