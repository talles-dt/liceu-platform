import {beforeEach,describe,it,expect,vi} from 'vitest';
const mocks=vi.hoisted(()=>({identity:vi.fn(),read:vi.fn(),render:vi.fn(),from:vi.fn()}));
vi.mock('@/lib/formation/server',async original=>({...await original<typeof import('@/lib/formation/server')>(),identity:mocks.identity}));
vi.mock('@/lib/formation/materials',async original=>({...await original<typeof import('@/lib/formation/materials')>(),readModuleMaterial:mocks.read}));
vi.mock('@/lib/formation/materialResponse',()=>({materialResponse:mocks.render}));
import {GET} from '@/app/api/formations/[cohortId]/materials/route';
const id='11111111-1111-4111-8111-111111111111';
const ctx={params:Promise.resolve({cohortId:id})};
const req=(query='')=>new Request('http://localhost/api/formations/'+id+'/materials'+query);
function data(values:unknown[]){mocks.from.mockImplementation(()=>{const result=values.shift();const chain={select:()=>chain,eq:()=>chain,maybeSingle:async()=>result,single:async()=>result};return chain;});}
beforeEach(()=>{vi.clearAllMocks();mocks.identity.mockResolvedValue({user:{id},db:{from:mocks.from}});mocks.read.mockResolvedValue('Text');mocks.render.mockResolvedValue(new Response('Text'));});
describe('Material route authorization',()=>{
 it('denies unauthenticated before any query',async()=>{mocks.identity.mockResolvedValue(null);expect((await GET(req(),ctx)).status).toBe(401);expect(mocks.from).not.toHaveBeenCalled();});
 it('denies mentoring-only/no cohort membership',async()=>{data([{data:null}]);expect((await GET(req(),ctx)).status).toBe(403);expect(mocks.read).not.toHaveBeenCalled();});
 it('denies teacher guide to an enrolled participant',async()=>{data([{data:{role:'participant',status:'active'}}]);expect((await GET(req('?kind=teacher'),ctx)).status).toBe(403);expect(mocks.read).not.toHaveBeenCalled();});
 it('loads the release pinned to the authorized cohort, not a global latest release',async()=>{const manifest={version:'pinned'};data([{data:{role:'participant',status:'active'}},{data:{release_id:'release'}},{data:{manifest}}]);expect((await GET(req(),ctx)).status).toBe(200);expect(mocks.read).toHaveBeenCalledWith(manifest,'participant');});
 it('does not fall back to new material when cohort has no matching edition',async()=>{data([{data:{role:'participant',status:'active'}},{data:{release_id:'release'}},{data:{manifest:{}}}]);mocks.read.mockResolvedValue(null);expect((await GET(req(),ctx)).status).toBe(404);});
 it('fails closed if membership query fails',async()=>{data([{error:{code:'XX000'}}]);expect((await GET(req(),ctx)).status).toBe(503);expect(mocks.read).not.toHaveBeenCalled();});
});
