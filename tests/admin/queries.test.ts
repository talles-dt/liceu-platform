import {beforeEach,describe,it,expect,vi} from 'vitest';
const mock=vi.hoisted(()=>({range:vi.fn(),select:vi.fn(),from:vi.fn()}));
vi.mock('@/lib/supabaseAdmin',()=>({createSupabaseAdminClient:()=>({from:mock.from})}));
vi.mock('@/lib/admin/auth',()=>({assertAdmin:vi.fn()}));
import {adminRows,adminCount} from '@/lib/admin/queries';
beforeEach(()=>{vi.clearAllMocks();const query={order:vi.fn(),range:mock.range};query.order.mockReturnValue(query);mock.select.mockReturnValue(query);mock.from.mockReturnValue({select:mock.select});});
describe('administrative data integrity',()=>{
 it('reads beyond the first page without silently clipping the roster',async()=>{mock.range.mockResolvedValueOnce({data:Array.from({length:500},(_,id)=>({id})),error:null}).mockResolvedValueOnce({data:[{id:500}],error:null});expect(await adminRows('users','id')).toHaveLength(501);expect(mock.range).toHaveBeenNthCalledWith(2,500,999);});
 it('does not return a partial roster when a later page fails',async()=>{mock.range.mockResolvedValueOnce({data:Array(500).fill({id:1}),error:null}).mockResolvedValueOnce({data:null,error:{message:'unavailable'}});await expect(adminRows('users','id')).rejects.toThrow('Não foi possível');});
 it('distinguishes unavailable metrics from an empty database',async()=>{mock.select.mockResolvedValueOnce({count:null,error:{message:'timeout'}}).mockResolvedValueOnce({count:0,error:null});expect(await adminCount('users')).toBeNull();expect(await adminCount('users')).toBe(0);});
});
