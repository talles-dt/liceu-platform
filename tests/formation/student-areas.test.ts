import {describe,it,expect} from 'vitest';
import {studentHome,mentoringAccess} from '@/lib/studentAreas';
import {canReadMaterial,readModuleMaterial} from '@/lib/formation/materials';
import {validateCurriculum} from '@/lib/formation/curriculum';
import proposal from '@/content/formations/trivium/releases/0.2.0.json';
describe('Independent student areas',()=>{
 it('routes single memberships directly and preserves choice for both/neither',()=>{
  expect(studentHome({formation:true,mentoring:false})).toBe('/formacoes');
  expect(studentHome({formation:false,mentoring:true})).toBe('/aluno/mentoria');
  expect(studentHome({formation:true,mentoring:true})).toBeNull();
  expect(studentHome({formation:false,mentoring:false})).toBeNull();
 });
 it('does not grant mentoring for review purchases, proposals or canceled orders',()=>{
  expect(mentoringAccess([{kind:'review',status:'paid'},{kind:'mentoring',status:'offered'},{kind:'mentoring',status:'cancelled'}])).toBe(false);
  expect(mentoringAccess([{kind:'mentoring',status:'paid'}])).toBe(true);
  expect(mentoringAccess([{kind:'mentoring',status:'completed'}])).toBe(true);
 });
 it('keeps teacher guide out of participant/evaluator and withdrawn access',()=>{
  expect(canReadMaterial('participant','active','teacher')).toBe(false);
  expect(canReadMaterial('evaluator','active','teacher')).toBe(false);
  expect(canReadMaterial('teacher','withdrawn','teacher')).toBe(false);
  expect(canReadMaterial('teacher','active','teacher')).toBe(true);
  expect(canReadMaterial('participant','completed','participant')).toBe(true);
 });
 it('loads complete pinned materials without exposing transfer probe in workbook',async()=>{
  const m=validateCurriculum(proposal);
  const participant=await readModuleMaterial(m,'participant'),teacher=await readModuleMaterial(m,'teacher');
  for(const name of ['Platão','Fedro','Aristóteles','Quintiliano'])expect(participant).toContain(name);
  expect(participant).not.toContain('O clube abriu duas oficinas aos sábados');
  expect(teacher).toContain('O clube abriu duas oficinas aos sábados');
  m.materials!.c01.participant_sha256='a'.repeat(64);
  expect(await readModuleMaterial(m,'participant')).toBeNull();
 });
 it('rejects publication of unreviewed translations even if outer approval is changed',()=>{
  const m=structuredClone(proposal);m.materials.c01.translation_review='pending';m.editorial_status='approved';m.approval_note='approved design';
  expect(()=>validateCurriculum(m,true)).toThrow('revisão humana');
 });
 it('keeps the agreed cadence and exact composition requirement',()=>{
  const m=validateCurriculum(proposal),c=m.cycles[0];
  expect(c.cadence?.individual_minutes.reduce((a,b)=>a+b,0)).toBe(525);
  expect(c.cadence?.meeting_minutes.reduce((a,b)=>a+b,0)).toBe(270);
  expect(c.activities.find(a=>a.type==='composition')?.prompt).toContain('450–650');
  expect(c.activities[0].prompt).toContain('quatro dos seis participantes');
 });
});
