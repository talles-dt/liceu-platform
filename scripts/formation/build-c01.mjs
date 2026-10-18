import {readFileSync,writeFileSync} from 'node:fs';
import {validateCurriculum} from '../../lib/formation/curriculum.ts';
const base='content/formations/trivium/';
const moduleBase=base+'drafts/c01/';
const moduleProposal=JSON.parse(readFileSync(moduleBase+'0.2.0.json','utf8'));
const proposal=readFileSync(moduleBase+'MODULO_01.md','utf8');
const result=JSON.parse(readFileSync(base+'releases/0.1.0.json','utf8'));
result.version='0.2.0';result.editorial_status=moduleProposal.editorial_status==='approved'?'approved':'draft';result.approval_note=moduleProposal.approval_note??'Revisão editorial pendente.';
result.materials={c01:{version:'0.2.0',translation_review:moduleProposal.translation_review??'pending',participant_sha256:moduleProposal.materials[0].sha256,teacher_sha256:moduleProposal.materials[1].sha256}};
const cycle=result.cycles[0];cycle.title=moduleProposal.title;cycle.question=moduleProposal.question;cycle.objectives=moduleProposal.objectives;
cycle.cadence={weeks:4,individual_minutes:moduleProposal.weeks.map(w=>w.individual_minutes),meeting_minutes:moduleProposal.weeks.map(w=>w.meeting_minutes)};
for(const reading of moduleProposal.readings.filter(r=>r.path)){
 result.readings.push({key:reading.key,title:reading.work,author:reading.author,location:reading.location.join('; '),url:reading.url,rights:reading.translation_credit+'; fontes e direitos identificados no texto.',text:readFileSync(moduleBase+reading.path,'utf8'),status:moduleProposal.editorial_status==='approved'?'verified':'draft'});
}
result.readings.push({key:'c01.worksheet',title:'Instrumentos de leitura',author:'Liceu Underground',location:'Ficha integral',url:'',rights:'Texto original preparado para este módulo.',text:proposal.split('## 7. Ficha original: instrumentos de leitura')[1].split('## 8.')[0].trim(),status:'verified'});
result.rubrics.push({key:'c01.integrated',title:'Módulo 1 — leitura, raciocínio e expressão',criteria:moduleProposal.rubric.criteria.map((c,i)=>({...result.rubrics[0].criteria[i],descriptors:c.descriptors}))});
cycle.activities=moduleProposal.activities.map(a=>{
 const previous=cycle.activities.find(x=>x.key===a.key);
 const anchor=a.prompt_ref.split('#')[1];
 const prompt=proposal.split(`<a id="${anchor}"></a>`)[1].split(/<a id="A\d"><\/a>|## 5\./)[0].trim();
 return {...previous,prompt,reading_keys:a.reading_keys??(a.type==='baseline'?[]:['c01.plato.apology','c01.worksheet']),rubric_key:'c01.integrated',roles:a.roles??previous.roles};
});
if(moduleProposal.editorial_status==='approved')for(const reading of result.readings)reading.status='verified';
validateCurriculum(result);
writeFileSync(base+'releases/0.2.0.json',JSON.stringify(result,null,2)+'\n');
console.log(`Pacote 0.2.0 gerado; estado editorial ${result.editorial_status}. A publicação ainda exige bibliografia de todos os ciclos.`);
