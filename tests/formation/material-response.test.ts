import {describe,it,expect} from 'vitest';
import {materialResponse} from '@/lib/formation/materialResponse';
import {readModuleMaterial} from '@/lib/formation/materials';
import {validateCurriculum} from '@/lib/formation/curriculum';
import proposal from '@/content/formations/trivium/releases/0.2.0.json';
describe('Real material rendering',()=>{
 it('removes executable HTML while preserving reading structure',async()=>{
  const response=await materialResponse('# Leitura\n\n<script>alert(1)</script><a href="javascript:alert(1)" onclick="bad()">Texto</a>\n\n| A | B |\n|---|---|\n| 1 | 2 |','participant');
  const html=await response.text();
  expect(html).toContain('<h1>Leitura</h1>');expect(html).toContain('<table>');
  expect(html).not.toMatch(/<script|javascript:|onclick=/);expect(response.headers.get('Cache-Control')).toBe('private, no-store');
 });
 for(const kind of ['participant','teacher'] as const)it(`renders the actual ${kind} material and preserves the full download`,async()=>{
  const text=await readModuleMaterial(validateCurriculum(proposal),kind);expect(text).toBeTruthy();
  const rendered=await materialResponse(text!,kind);expect(rendered.status).toBe(200);expect(await rendered.text()).toContain('<h1>');
  const download=await materialResponse(text!,kind,true);expect(await download.text()).toBe(text);
 });
});
