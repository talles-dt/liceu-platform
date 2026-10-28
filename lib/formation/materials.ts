import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import registry from '@/content/formations/trivium/materials/index.json';
import type {Curriculum} from './curriculum';
export type MaterialKind='participant'|'teacher';
export function isModuleKey(value:string){return /^c0[1-6]$/.test(value);}
export function canReadMaterial(role:string,status:string,kind:MaterialKind){
 return ['active','completed'].includes(status)&&(kind==='teacher'?role==='teacher':['participant','teacher'].includes(role));
}
type Files=Record<string,Record<string,Record<MaterialKind,{path:string;sha256:string}>>>;
export async function readModuleMaterial(manifest:Curriculum,kind:MaterialKind,moduleKey='c01'){
 if(!isModuleKey(moduleKey))return null;
 const reference=manifest.materials?.[moduleKey];
 if(!reference)return null;
 // Only repository-owned registry entries can resolve files. No request or release supplies a path.
 const versions=Object.hasOwn(registry,moduleKey)?(registry as Files)[moduleKey]:undefined;
 const edition=versions&&Object.hasOwn(versions,reference.version)?versions[reference.version]:undefined;
 const file=edition?.[kind];
 if(!file||reference[`${kind}_sha256`]!==file.sha256)return null;
 const text=await readFile(resolve(process.cwd(),'content/formations/trivium',file.path),'utf8');
 if(createHash('sha256').update(text).digest('hex')!==file.sha256)throw Error('Integridade do material inválida');
 return text;
}
