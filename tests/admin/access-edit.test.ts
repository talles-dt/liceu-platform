import {beforeEach,describe,it,expect,vi} from 'vitest';
const mock=vi.hoisted(()=>({admin:vi.fn(),rpc:vi.fn()}));
vi.mock('@/lib/admin/auth',()=>({assertAdmin:mock.admin}));
vi.mock('@/lib/supabaseAdmin',()=>({createSupabaseAdminClient:()=>({rpc:mock.rpc})}));
import {PATCH} from '@/app/api/admin/students/[studentId]/access/route';
const id='11111111-1111-4111-8111-111111111111';
const params={params:Promise.resolve({studentId:id})};
const payload={action:'formation',cohortId:id,status:'paused',expected:null,reason:'Pausa solicitada pelo aluno'};
const request=(body:unknown,origin='http://localhost')=>new Request(`http://localhost/api/admin/students/${id}/access`,{method:'PATCH',headers:{origin,'content-type':'application/json'},body:JSON.stringify(body)});
beforeEach(()=>{vi.clearAllMocks();vi.stubEnv('NEXT_PUBLIC_SITE_URL','http://localhost');mock.admin.mockResolvedValue({id:'verified-admin'});mock.rpc.mockResolvedValue({error:null});});
describe('edit existing student access',()=>{
 it('rejects non-admin and foreign origins without a write',async()=>{expect((await PATCH(request(payload,'https://foreign.invalid'),params)).status).toBe(403);mock.admin.mockResolvedValue(null);expect((await PATCH(request(payload),params)).status).toBe(403);expect(mock.rpc).not.toHaveBeenCalled();});
 it('rejects malformed instructions and omitted concurrency state',async()=>{for(const b of [null,{}, {...payload,expected:undefined},{...payload,status:'owner'},{...payload,reason:''},{action:'mentoring',mode:'save',grantId:id,expected:null,reason:'Teste de acesso',scope:'short',expiresAt:null}])expect((await PATCH(request(b),params)).status).toBe(400);expect(mock.rpc).not.toHaveBeenCalled();});
 it('derives actor and student on the server, keeps the response private',async()=>{const r=await PATCH(request({...payload,p_actor:'attacker',p_user:'victim'}),params);expect(r.status).toBe(200);expect(r.headers.get('cache-control')).toContain('no-store');expect(mock.rpc).toHaveBeenCalledWith('liceu_admin_student_access',expect.objectContaining({p_actor:'verified-admin',p_user:id}));});
 it('reports conflict and database failures instead of success',async()=>{for(const [code,status] of [['PT409',409],['42501',403],['XX000',503]]){mock.rpc.mockResolvedValue({error:{code}});expect((await PATCH(request(payload),params)).status).toBe(status);}});
});
