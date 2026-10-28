import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import type {Curriculum} from './curriculum';
export const entryNames={welcome:'Acolhimento',notebook:'Caderno de entrada',glossary:'Glossário',teacher:'Guia docente de entrada'} as const;
export type EntryKind=keyof typeof entryNames;
const files:Record<EntryKind,string>={welcome:'ACOLHIMENTO.md',notebook:'CADERNO_DE_ENTRADA.md',glossary:'GLOSSARIO.md',teacher:'GUIA_DOCENTE.md'};
export function isEntryKind(s:string):s is EntryKind{return Object.hasOwn(entryNames,s);}
const hash=(s:string)=>createHash('sha256').update(s).digest('hex');
export async function readEntry(manifest:Curriculum,kind:EntryKind){
 if(manifest.entry?.version!=='0.1.0')return null;
 const root=process.cwd()+'/content/formations/trivium/supplements/entrada/0.1.0/';
 const raw=await readFile(root+'manifest.json','utf8');
 if(hash(raw)!==manifest.entry.manifest_sha256)throw Error('Integridade do suplemento inválida');
 const m=JSON.parse(raw);if(m.editorial_status!=='approved')throw Error('Suplemento não aprovado');
 const filename=files[kind],file=m.materials.find((f:{file:string})=>f.file===filename);
 if(!file)throw Error('Material ausente');
 const text=await readFile(root+filename,'utf8');if(hash(text)!==file.sha256)throw Error('Integridade do texto inválida');
 return text;
}
