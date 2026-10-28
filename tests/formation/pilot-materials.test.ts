import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateCurriculum} from '@/lib/formation/curriculum';
import {readModuleMaterial} from '@/lib/formation/materials';
import {materialResponse} from '@/lib/formation/materialResponse';
import {publicationCopy} from '../../scripts/formation/publication-copy.mjs';
import previous from '@/content/formations/trivium/releases/0.2.0.json';
import proposal from '@/content/formations/trivium/releases/0.3.0.json';
const base='content/formations/trivium/';
const digest=(s:string)=>createHash('sha256').update(s).digest('hex');
describe('Complete pilot, editions and editorial boundaries',()=>{
 it('preserves C1 teaching content and historical edition while cleaning its new copy',async()=>{
  expect(proposal.cycles[0]).toEqual(previous.cycles[0]);
  expect(proposal.materials.c01.version).toBe('0.3.0');
  for(const r of previous.readings){const clean=proposal.readings.find(x=>x.key===r.key)!;expect(clean.text).toBe(publicationCopy(r.text));}
  for(const role of ['participant','teacher'] as const){
   const old=await readModuleMaterial(validateCurriculum(previous),role,'c01');
   expect(await readModuleMaterial(validateCurriculum(proposal),role,'c01')).toBe(publicationCopy(old!));
   expect(old).toContain('na conversa de implantação');
  }
 });
 it('records the new explicit approval and still rejects an unreviewed release',()=>{
  expect(validateCurriculum(proposal,true).cycles).toHaveLength(6);
  const draft=structuredClone(proposal);draft.editorial_status='draft';
  expect(()=>validateCurriculum(draft,true)).toThrow('aprovação editorial');
  draft.editorial_status='approved';draft.materials.c02.translation_review='pending';
  expect(()=>validateCurriculum(draft,true)).toThrow('revisão humana');
 });
 it('removes preparation notes in all twelve published materials, retaining credits and teaching notes',async()=>{
  for(const n of [1,2,3,4,5,6])for(const role of ['participant','teacher'] as const){
   const body=(await readModuleMaterial(validateCurriculum(proposal),role,`c0${n}`))!;
   expect(body).not.toMatch(/revisão humana.*pendente|aguardam revisão|na conversa de implantação|não faz deploy|edição de preparação|aprovação do módulo 1 não constitui/i);
   expect(body).toContain('assistência de IA');expect(body).toContain('Fonte');
   expect(publicationCopy(body)).toBe(body);
  }
 });
 it('does not serve new modules to old releases or unknown editions',async()=>{
  expect(await readModuleMaterial(validateCurriculum(previous),'participant','c02')).toBeNull();
  const m=structuredClone(proposal);m.materials.c02.version='9.9.9';
  expect(await readModuleMaterial(validateCurriculum(m),'participant','c02')).toBeNull();
  expect(await readModuleMaterial(validateCurriculum(proposal),'teacher','../../sources')).toBeNull();
  m.materials.c02.version='0.3.0';m.materials.c02.participant_sha256='f'.repeat(64);
  expect(await readModuleMaterial(validateCurriculum(m),'participant','c02')).toBeNull();
 });
 it('rejects overloaded weeks and extra meetings',()=>{
  const m=structuredClone(proposal);m.cycles[1].cadence!.individual_minutes[0]=181;
  expect(()=>validateCurriculum(m)).toThrow('carga individual');
  m.cycles[1].cadence!.individual_minutes[0]=150;m.cycles[1].cadence!.meeting_minutes[0]=90;
  expect(()=>validateCurriculum(m)).toThrow('três encontros');
 });
 for(const n of [2,3,4,5,6])it(`keeps module ${n} complete, within time and teacher-only probes out of student content`,async()=>{
  const key=`c0${n}`,m=JSON.parse(readFileSync(base+`drafts/${key}/0.3.0.json`,'utf8'));
  const notebook=await readModuleMaterial(validateCurriculum(proposal),'participant',key);
  const guide=await readModuleMaterial(validateCurriculum(proposal),'teacher',key);
  expect(notebook).toBeTruthy();expect(guide).toContain(notebook);
  expect(guide).toContain(m.probe);expect(notebook).not.toContain(m.probe);expect(JSON.stringify(proposal)).not.toContain(m.probe);
  for(const readingKey of m.readings){const r=proposal.readings.find(r=>r.key===readingKey)!;expect(notebook).toContain(r.text);expect(digest(r.text)).toBe(m.bibliography.find((r:{key:string})=>r.key===readingKey).sha256);}
  for(const w of m.weeks){expect(w.tasks.reduce((s:number,t:{minutes:number})=>s+t.minutes,0)).toBe(w.individual_minutes);expect(w.individual_minutes).toBeGreaterThanOrEqual(120);expect(w.individual_minutes).toBeLessThanOrEqual(180);}
  for(const a of m.agendas)expect(a.segments.reduce((s:number,t:{minutes:number})=>s+t.minutes,0)).toBe(90);
  const html=await (await materialResponse(notebook!,'participant',false,{moduleKey:key,version:'0.3.0',previewRelease:'0.3.0'})).text();
  expect(html).toContain(`Módulo ${n} — Caderno`);expect(html).toContain(`module=${key}`);expect(html).toContain('release=0.3.0');expect(html).toContain('@media print');
  expect(html).toContain('table-layout:fixed');
  const download=await materialResponse(notebook!,'participant',true,{moduleKey:key,version:'0.3.0'});
  expect(download.headers.get('Content-Disposition')).toContain(`${key}-0.3.0.md`);expect(await download.text()).toBe(notebook);
 });
 it('keeps C6 a choose-one anthology and combines declamation with the bank',()=>{
  const m=JSON.parse(readFileSync(base+'drafts/c06/0.3.0.json','utf8'));
  expect(m.bibliography.every((r:{selection_group:string})=>r.selection_group==='choose_one')).toBe(true);
  expect(m.prompts.panel).toContain('não evento extra');expect(m.agendas[2].segments[0].minutes).toBe(60);
 });
});
