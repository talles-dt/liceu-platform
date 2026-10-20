import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateCurriculum} from '../../lib/formation/curriculum.ts';
const root='content/formations/trivium/';
const read=p=>readFileSync(root+p,'utf8'),hash=s=>createHash('sha256').update(s).digest('hex');
const manifestText=read('supplements/entrada/0.1.0/manifest.json'),entry=JSON.parse(manifestText);
if(entry.editorial_status!=='approved')throw Error('Suplemento não aprovado');
const r=JSON.parse(read('releases/0.3.0.json')),registry=JSON.parse(read('materials/index.json'));
r.version='0.4.0';r.approval_note='Currículo 0.3.0 aprovado, acrescido do suplemento Palavras para começar, revisado e aprovado pelo responsável em 19/10/2026. Registro: supplements/entrada/APROVACAO.json.';
r.entry={version:entry.version,manifest_sha256:hash(manifestText)};
registry.c01['0.4.0']={};
for(const role of ['participant','teacher']){
 const old=registry.c01['0.3.0'][role];
 let body=read(old.path).replace('edição 0.3.0','edição 0.4.0').replace('| 1 — Primeira leitura | Baseline original (45); primeira leitura de P1 (30); notas de leitura (30); Codex (15) | 120 | Sem encontro obrigatório |','| 1 — Primeira leitura | Acolhimento (5); baseline original (45); caderno de entrada após a entrega (25); primeira leitura de P1 (30); duas notas breves (5); Codex (10) | 120 | Sem encontro obrigatório |');
 body=body.replace('## Antes das leituras','Depois de entregar o diagnóstico, abra **Palavras para começar** na área da coorte. Na primeira semana, as notas de leitura são duas linhas (uma compreensão e uma pergunta) e o Codex é uma entrada breve. Os 25 minutos do caderno de entrada substituem parte do bloco anterior de notas; não são tarefa adicional.\n\n## Antes das leituras');
 const path=old.path.replace('/0.3.0/','/0.4.0/');mkdirSync(root+path.slice(0,path.lastIndexOf('/')),{recursive:true});writeFileSync(root+path,body);registry.c01['0.4.0'][role]={path,sha256:hash(body)};
}
r.materials.c01={...r.materials.c01,version:'0.4.0',participant_sha256:registry.c01['0.4.0'].participant.sha256,teacher_sha256:registry.c01['0.4.0'].teacher.sha256};
validateCurriculum(r,true);
writeFileSync(root+'releases/0.4.0.json',JSON.stringify(r,null,2)+'\n');writeFileSync(root+'materials/index.json',JSON.stringify(registry,null,2)+'\n');
console.log('Release 0.4.0 aprovada: seis ciclos, suplemento separado e semana 1 com 120 minutos.');
