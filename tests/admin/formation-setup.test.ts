// @vitest-environment jsdom
import React,{act} from 'react';
import {createRoot, type Root} from 'react-dom/client';
import {afterEach,beforeEach,describe,it,expect,vi} from 'vitest';
const mocks=vi.hoisted(()=>({refresh:vi.fn(),fetch:vi.fn()}));
vi.mock('next/navigation',()=>({useRouter:()=>({refresh:mocks.refresh})}));
import {FormationSetup,type FormationSetupProps} from '@/components/formation/FormationSetup';
const actor='11111111-1111-4111-8111-111111111111',release='22222222-2222-4222-8222-222222222222',cohort='33333333-3333-4333-8333-333333333333';
const props:FormationSetupProps={currentUserId:actor,releases:[{id:release,version:'0.4.0'}],people:[{id:actor,name:'Professor',email:'professor@example.invalid',role:'admin',suspended_at:null}],cohorts:[],members:[]};
let node:HTMLDivElement,root:Root;
beforeEach(()=>{vi.clearAllMocks();vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);vi.stubGlobal('fetch',mocks.fetch);vi.stubGlobal('React',React);vi.stubGlobal('FormData',window.FormData);node=document.createElement('div');document.body.appendChild(node);root=createRoot(node);});
afterEach(async()=>{await act(async()=>root.unmount());node.remove();vi.unstubAllGlobals();});
const render=async(p=props)=>act(async()=>root.render(React.createElement(FormationSetup,p)));
const submit=async(label:string)=>act(async()=>{node.querySelector(`form[aria-label="${label}"]`)!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));});
describe('cohort setup for a nontechnical administrator',()=>{
 it('creates a cohort by name with current administrator selected as teacher and named edition',async()=>{
 await render();expect(node.textContent).not.toContain(actor);expect(node.textContent).not.toContain(release);expect(node.textContent).not.toContain('Commit editorial');
 expect((node.querySelector('[name="teacher_id"]') as HTMLSelectElement).value).toBe(actor);
 expect(node.textContent).toContain('Eu — Professor');expect(node.textContent).toContain('edição 0.4.0');
 (node.querySelector('[name="title"]') as HTMLInputElement).value='Coorte fundadora';mocks.fetch.mockResolvedValue({ok:true,json:async()=>({cohortId:cohort})});await submit('Criar coorte');
 expect(JSON.parse(mocks.fetch.mock.calls[0][1].body)).toEqual({action:'create_cohort',title:'Coorte fundadora',release_id:release,teacher_id:actor});
 expect(node.querySelector(`a[href="/formacoes/${cohort}"]`)).not.toBeNull();expect(mocks.refresh).toHaveBeenCalled();
 });
 it('grants own teacher access to an existing named cohort without copying ids',async()=>{
 await render({...props,cohorts:[{id:cohort,title:'Fundadores',status:'draft',capacity:6,release_id:release}]});mocks.fetch.mockResolvedValue({ok:true,json:async()=>({saved:true})});await submit('Dar acesso à coorte');
 expect(mocks.fetch).toHaveBeenCalledWith(`/api/formations/${cohort}`,expect.objectContaining({body:JSON.stringify({action:'enroll',body:{user_id:actor,role:'teacher'}})}));
 });
 it('shows existing membership instead of trying a duplicate enrollment',async()=>{
 await render({...props,cohorts:[{id:cohort,title:'Fundadores',status:'draft',capacity:6,release_id:release}],members:[{cohort_id:cohort,user_id:actor,role:'teacher',status:'active'}]});expect(node.textContent).toContain('Acesso ativo.');expect(node.textContent).toContain('Abrir minha coorte');expect(node.querySelector('form[aria-label="Dar acesso à coorte"] button')).toBeNull();
 });
 it('reports failures without claiming success',async()=>{await render();mocks.fetch.mockRejectedValue(Error('Falha de rede'));await submit('Criar coorte');expect(node.textContent).toContain('Falha de rede');expect(mocks.refresh).not.toHaveBeenCalled();});
 it('explains when no published curriculum is available',async()=>{await render({...props,releases:[]});expect(node.textContent).toContain('Nenhuma edição curricular publicada');expect(node.querySelector('form[aria-label="Criar coorte"]')).toBeNull();});
});
