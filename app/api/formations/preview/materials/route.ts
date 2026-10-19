import {identity,fail} from '@/lib/formation/server';
import {readModuleMaterial,isModuleKey} from '@/lib/formation/materials';
import {materialResponse} from '@/lib/formation/materialResponse';
import previous from '@/content/formations/trivium/releases/0.2.0.json';
import current from '@/content/formations/trivium/releases/0.4.0.json';
import {readEntry,isEntryKind} from '@/lib/formation/entry';
import proposal from '@/content/formations/trivium/releases/0.3.0.json';
import {validateCurriculum} from '@/lib/formation/curriculum';
export async function GET(request:Request){
 const auth=await identity();if(!auth||auth.role!=='admin')return fail('Prévia editorial restrita à administração',403);
 const url=new URL(request.url),kind=url.searchParams.get('kind')??'participant',moduleKey=url.searchParams.get('module')??'c01',release=url.searchParams.get('release')??'0.4.0';
 if(!isModuleKey(moduleKey))return fail('Módulo inválido',400);
 if(!['0.2.0','0.3.0','0.4.0'].includes(release))return fail('Edição indisponível',404);
 const manifest=validateCurriculum(release==='0.2.0'?previous:release==='0.3.0'?proposal:current);if(kind!=='participant'&&kind!=='teacher')return fail('Material inválido',400);
 const entry=url.searchParams.get('entry');
 if(entry){if(!isEntryKind(entry))return fail('Suplemento inválido',400);
 try{const text=await readEntry(manifest,entry);return text?materialResponse(text,entry==='teacher'?'teacher':'participant',url.searchParams.get('download')==='1',{entry,version:manifest.entry?.version,previewRelease:release}):fail('Suplemento indisponível',404);}catch{return fail('Falha ao conferir suplemento',503);}}
 try{const text=await readModuleMaterial(manifest,kind,moduleKey);return text?materialResponse(text,kind,url.searchParams.get('download')==='1',{moduleKey,version:manifest.materials?.[moduleKey]?.version,previewRelease:release}):fail('Material indisponível',404);}catch{return fail('Falha ao conferir material',503);}
}
