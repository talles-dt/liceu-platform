import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {cohortSnapshot,identity,uuid} from "@/lib/formation/server";
import {FormationBoard} from "@/components/formation/FormationBoard";
import type {Curriculum} from "@/lib/formation/curriculum";
export const dynamic="force-dynamic";
export default async function CohortPage({params}:{params:Promise<{cohortId:string}>}){
 if(!await identity())redirect("/login");const {cohortId}=await params;if(!uuid(cohortId))notFound();const data=await cohortSnapshot(cohortId);if(!data)notFound();
 return <div className="max-w-5xl mx-auto p-6 md:p-10 space-y-8"><Link href="/formacoes" className="underline">Minhas formações</Link><header><p>Gramática · Lógica · Retórica</p><h1 className="text-3xl font-serif">{String(data.cohort.title)}</h1><p>Currículo {data.release.version} · {String(data.cohort.timezone)}</p></header><FormationBoard initial={{...data,release:{manifest:data.release.manifest as Curriculum,version:String(data.release.version)}}}/></div>;
}
