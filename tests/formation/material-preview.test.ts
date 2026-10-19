import {beforeEach,describe,it,expect,vi} from 'vitest';
const identity=vi.hoisted(()=>vi.fn());
vi.mock('@/lib/formation/server',async original=>({...await original<typeof import('@/lib/formation/server')>(),identity}));
import {GET} from '@/app/api/formations/preview/materials/route';
const request=(q:string)=>new Request('https://www.oliceu.com/api/formations/preview/materials'+q);
beforeEach(()=>identity.mockResolvedValue({role:'admin'}));
describe('Editorial material preview',()=>{
 it('does not expose guides to a non-admin',async()=>{identity.mockResolvedValue({role:'student'});expect((await GET(request('?kind=teacher&module=c06'))).status).toBe(403);});
 it('renders real new materials for an admin and retains edition in download links',async()=>{const r=await GET(request('?kind=teacher&module=c05&release=0.3.0'));expect(r.status).toBe(200);const html=await r.text();expect(html).toContain('Parte reservada ao professor');expect(html).toContain('module=c05');expect(html).toContain('release=0.3.0');});
 it('keeps previous editions and fails closed for missing module, edition or kind',async()=>{
  expect((await GET(request('?module=c01&release=0.2.0'))).status).toBe(200);
  expect((await GET(request('?module=c02&release=0.2.0'))).status).toBe(404);
  expect((await GET(request('?release=9.9.9'))).status).toBe(404);
  expect((await GET(request('?module=../../secret'))).status).toBe(400);
  expect((await GET(request('?kind=admin'))).status).toBe(400);
 });
});
