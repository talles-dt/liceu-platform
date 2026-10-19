import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateCurriculum} from '@/lib/formation/curriculum';
import {readModuleMaterial} from '@/lib/formation/materials';
import {materialResponse} from '@/lib/formation/materialResponse';
import previous from '@/content/formations/trivium/releases/0.2.0.json';
import proposal from '@/content/formations/trivium/releases/0.3.0.json';
const base='content/formations/trivium/';
const digest=(s:string)=>createHash('sha256').update(s).digest('hex');
describe('Complete pilot, editions and editorial boundaries',()=>{
 it('preserves C1 and its material approval byte for byte in the new release',()=>{
  expect(proposal.cycles[0]).toEqual(previous.cycles[0]);
  expect(proposal.materials.c01).toEqual(previous.materials.c01);
  for(const r of previous.readings)expect(proposal.readings.find(x=>x.key===r.key)).toEqual(r);
 });
 it('has six structurally publishable cycles but does not inherit editorial approval',()=>{
  expect(()=>validateCurriculum(proposal,true)).toThrow('aprovação editorial');
  const reviewed=structuredClone(proposal);reviewed.editorial_status='approved';reviewed.approval_note='Synthetic test only';
  for(const r of reviewed.readings)r.status='verified';
  expect(()=>validateCurriculum(reviewed,true)).toThrow('revisão humana');
  for(const m of Object.values(reviewed.materials))m.translation_review='approved';
  expect(validateCurriculum(reviewed,true).cycles).toHaveLength(6);
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
