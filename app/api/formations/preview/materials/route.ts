import {identity,fail} from '@/lib/formation/server';
import {readModuleMaterial} from '@/lib/formation/materials';
import {materialResponse} from '@/lib/formation/materialResponse';
import proposal from '@/content/formations/trivium/releases/0.2.0.json';
import {validateCurriculum} from '@/lib/formation/curriculum';
export async function GET(request:Request){
 const auth=await identity();if(!auth||auth.role!=='admin')return fail('Prévia editorial restrita à administração',403);
 const url=new URL(request.url),kind=url.searchParams.get('kind')??'participant';if(kind!=='participant'&&kind!=='teacher')return fail('Material inválido',400);
 try{const text=await readModuleMaterial(validateCurriculum(proposal),kind);return text?materialResponse(text,kind,url.searchParams.get('download')==='1'):fail('Material indisponível',404);}catch{return fail('Falha ao conferir material',503);}
}
