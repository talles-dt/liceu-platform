export const pillars = ["grammar", "logic", "rhetoric"] as const;
export type Pillar = typeof pillars[number];
export const movements = ["reading", "seminar", "imitatio", "composition", "disputatio", "declamatio", "reflection"] as const;
export type Activity = {key:string;type:string;title:string;prompt:string;pillars:Pillar[];competency_keys:string[];rubric_key:string;reading_keys:string[];roles:Record<string,number>};
export type Criterion = {key:string;pillar:Pillar;label:string;descriptors:Record<string,string>};
export type Curriculum = {entry?:{version:string;manifest_sha256:string};materials?:Record<string,{version:string;translation_review:"pending"|"approved";participant_sha256:string;teacher_sha256:string}>;schema_version:1;slug:string;title:string;version:string;editorial_status:"draft"|"approved";approval_note:string;competencies:{key:string;pillar:Pillar;objective:string}[];readings:{key:string;title:string;author:string;location:string;url:string;rights:string;text:string;status:"draft"|"verified"}[];rubrics:{key:string;title:string;criteria:Criterion[]}[];cycles:{key:string;title:string;question:string;cadence?:{weeks:number;individual_minutes:number[];meeting_minutes:number[]};objectives:Record<Pillar,string>;activities:Activity[]}[]};
const record = (x:unknown): x is Record<string,unknown> => !!x && typeof x==="object" && !Array.isArray(x);
const text = (x:unknown) => typeof x==="string" && x.trim().length>0;
export function validateCurriculum(input:unknown, forPublication=false): Curriculum {
 if(!record(input)) throw Error("Manifesto inválido");
 const errors:string[]=[];
 const check=(ok:unknown,message:string)=>{if(!ok)errors.push(message);};
 check(input.schema_version===1,"schema_version deve ser 1");
 check(typeof input.slug==="string" && /^[a-z0-9-]+$/.test(input.slug),"slug inválido");
 check(typeof input.version==="string" && /^\d+\.\d+\.\d+$/.test(input.version),"versão semântica obrigatória");
 check(text(input.title),"título obrigatório");
 check(["draft","approved"].includes(String(input.editorial_status)),"estado editorial inválido");
 if(forPublication)check(input.editorial_status==="approved"&&text(input.approval_note),"aprovação editorial registrada obrigatória");
 if(input.materials!==undefined){
 check(record(input.materials),"materiais inválidos");
 if(record(input.materials))for(const material of Object.values(input.materials)){
 check(record(material)&&typeof material.version==="string"&&/^\d+\.\d+\.\d+$/.test(material.version)&&["pending","approved"].includes(String(material.translation_review))&&[material.participant_sha256,material.teacher_sha256].every(h=>typeof h==="string"&&/^[a-f0-9]{64}$/.test(h)),"versão/hashes dos materiais inválidos");
 if(forPublication)check(record(material)&&material.translation_review==="approved","revisão humana das traduções pendente");
 }
 }
 const list=(value:unknown,label:string): Record<string,unknown>[]=>{if(!Array.isArray(value)||!value.every(record)){errors.push(`${label}: lista inválida`);return [];}return value;};
 if(input.entry!==undefined){check(record(input.entry)&&typeof input.entry.version==='string'&&/^\d+\.\d+\.\d+$/.test(input.entry.version)&&typeof input.entry.manifest_sha256==='string'&&/^[a-f0-9]{64}$/.test(input.entry.manifest_sha256),'suplemento de entrada inválido');}
 const competencies=list(input.competencies,"competências"),readings=list(input.readings,"leituras"),rubrics=list(input.rubrics,"rubricas"),cycles=list(input.cycles,"ciclos");
 const unique=(items:Record<string,unknown>[],label:string)=>{const seen=new Set();for(const i of items){check(typeof i.key==="string"&&/^[a-z0-9.-]+$/.test(i.key),`${label}: chave inválida`);check(!seen.has(i.key),`${label}: chave duplicada ${i.key}`);seen.add(i.key);}};
 unique(competencies,"competências");unique(readings,"leituras");unique(rubrics,"rubricas");unique(cycles,"ciclos");
 for(const c of competencies)check(pillars.includes(c.pillar as Pillar)&&text(c.objective),"competência sem pilar/objetivo");
 for(const r of readings){check(text(r.title)&&text(r.author)&&text(r.location)&&text(r.rights),"leitura sem proveniência");check(text(r.text)||typeof r.url==="string"&&/^https:\/\//.test(r.url),"leitura sem texto ou link HTTPS");if(forPublication)check(r.status==="verified","leitura ainda não verificada");}
 for(const r of rubrics){const criteria=list(r.criteria,"critérios");unique(criteria,"critérios");for(const c of criteria){check(pillars.includes(c.pillar as Pillar)&&text(c.label),"critério sem pilar");for(const level of ["support","developing","consistent","transfer"])check(record(c.descriptors)&&text(c.descriptors[level]),`descritor ${level} ausente`);}}
 check(cycles.length===6,"piloto exige seis ciclos");const all:Record<string,unknown>[]=[];
 for(const c of cycles){
 if(c.cadence!==undefined){
 const cadence=c.cadence;
 check(record(cadence)&&cadence.weeks===4&&Array.isArray(cadence.individual_minutes)&&cadence.individual_minutes.length===4&&cadence.individual_minutes.every(n=>Number.isInteger(n)&&Number(n)>=120&&Number(n)<=180),`${c.key}: carga individual deve caber em quatro semanas de 120–180 minutos`);
 check(record(cadence)&&Array.isArray(cadence.meeting_minutes)&&cadence.meeting_minutes.length===4&&cadence.meeting_minutes.filter(n=>n===90).length===3&&cadence.meeting_minutes.filter(n=>n===0).length===1,`${c.key}: três encontros de 90 minutos obrigatórios`);
 }
 check(text(c.title)&&text(c.question),"ciclo sem questão/título");const activities=list(c.activities,"atividades");all.push(...activities);
 if(forPublication)check(activities.some(a=>Array.isArray(a.reading_keys)&&a.reading_keys.length>0),`${c.key}: bibliografia do ciclo ainda incompleta`);
 for(const type of movements)check(activities.some(a=>a.type===type),`${c.key}: movimento ${type} ausente`);
 for(const a of activities){
 check([...movements,"symposium","baseline","panel"].includes(a.type as typeof movements[number]),"tipo de atividade inválido");
 check(text(a.title)&&text(a.prompt),"atividade sem título/prompt");
 check(Array.isArray(a.pillars)&&a.pillars.length>0&&a.pillars.every(p=>pillars.includes(p)),"pilares da atividade inválidos");
 check(Array.isArray(a.competency_keys)&&a.competency_keys.length>0&&a.competency_keys.every(key=>competencies.some(c=>c.key===key)),"referência de competência inválida");
 check(rubrics.some(r=>r.key===a.rubric_key),"rubrica inexistente");
 check(Array.isArray(a.reading_keys)&&a.reading_keys.every(key=>readings.some(r=>r.key===key)),"leitura inexistente");
 check(record(a.roles)&&Object.values(a.roles).every(n=>Number.isInteger(n)&&Number(n)>0),"papéis inválidos");
 if(a.type==="disputatio")check(record(a.roles)&&Object.values(a.roles).reduce<number>((n,v)=>n+Number(v),0)===6,"disputatio deve distribuir seis papéis");
 }
 for(const p of pillars){
 check(record(c.objectives)&&text(c.objectives[p]),`${c.key}: objetivo ${p} ausente`);
 check(activities.some(a=>Array.isArray(a.pillars)&&a.pillars.includes(p)&&Array.isArray(a.competency_keys)&&a.competency_keys.some(k=>competencies.some(x=>x.key===k&&x.pillar===p))&&rubrics.some(r=>r.key===a.rubric_key&&Array.isArray(r.criteria)&&r.criteria.some(x=>record(x)&&x.pillar===p))),`${c.key}: falta evidência e critério de ${p}`);
 }
 }
 if(record(input.materials))for(const key of Object.keys(input.materials))check(cycles.some(c=>c.key===key),"material sem ciclo correspondente");
 unique(all,"atividades");check(all.some(a=>a.type==="baseline"),"baseline ausente");check(all.some(a=>a.type==="panel"),"banca ausente");
 if(errors.length)throw Error(errors.join("\n"));return input as unknown as Curriculum;
}
