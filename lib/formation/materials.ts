import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import moduleManifest from '@/content/formations/trivium/drafts/c01/0.2.0.json';
import type {Curriculum} from './curriculum';
export type MaterialKind='participant'|'teacher';
export function canReadMaterial(role:string,status:string,kind:MaterialKind){
 return ['active','completed'].includes(status)&&(kind==='teacher'?role==='teacher':['participant','teacher'].includes(role));
}
export async function readModuleMaterial(manifest:Curriculum,kind:MaterialKind){
 const reference=manifest.materials?.c01;
 if(!reference||reference.version!=='0.2.0')return null;
 const file=moduleManifest.materials.find(m=>m.role===kind)!;
 if(reference[`${kind}_sha256`]!==file.sha256)return null;
 const text=await readFile(resolve(process.cwd(),'content/formations/trivium/drafts/c01',file.path),'utf8');
 if(createHash('sha256').update(text).digest('hex')!==file.sha256)throw Error('Integridade do material inválida');
 return text;
}
