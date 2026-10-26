import { beforeEach, afterEach, it, expect, vi } from 'vitest';
const m = vi.hoisted(() => ({ rpc: vi.fn(), generateLink: vi.fn(), send: vi.fn() }));
vi.mock('@/lib/supabaseAdmin', () => ({ createSupabaseAdminClient: () => ({ rpc: m.rpc, auth: { admin: { generateLink: m.generateLink } } }) }));
vi.mock('@/lib/resend', () => ({ getResendClient: () => ({ emails: { send: m.send } }) }));
vi.mock('next/headers', () => ({ headers: async () => new Headers({'x-forwarded-for':'203.0.113.7'}) }));
import { recoveryLimit } from '@/lib/recoveryLimit';
import { sendRecoveryLink } from '@/app/forgot-password/actions';
beforeEach(() => {
 vi.clearAllMocks(); vi.stubEnv('RECOVERY_HASH_SECRET', 't'.repeat(32)); vi.stubEnv('VERCEL', '1');
 m.rpc.mockResolvedValue({data:true,error:null});
 m.generateLink.mockResolvedValue({data:{properties:{hashed_token:'test-token'}},error:null});
 m.send.mockResolvedValue({error:null});
});
afterEach(() => vi.unstubAllEnvs());
it('checks durable IP, global, minute and hour counters before email generation', async () => {
 expect(await sendRecoveryLink(' Test@Example.com ')).toEqual({success:true});
 expect(m.rpc.mock.calls.map(c=>[c[1].p_limit,c[1].p_seconds])).toEqual([[15,3600],[120,3600],[1,60],[3,3600]]);
 expect(JSON.stringify(m.rpc.mock.calls)).not.toContain('example.com');
 expect(JSON.stringify(m.rpc.mock.calls)).not.toContain('203.0.113.7');
 expect(m.generateLink.mock.calls[0][0].email).toBe('test@example.com');
 expect(m.rpc.mock.invocationCallOrder.at(-1)!).toBeLessThan(m.generateLink.mock.invocationCallOrder[0]);
});
it.each([0,1,2,3])('stops before token generation and sending when counter %i blocks', async index => {
 m.rpc.mockReset(); for(let i=0;i<index;i++)m.rpc.mockResolvedValueOnce({data:true});
 m.rpc.mockResolvedValueOnce({data:false});
 expect(await sendRecoveryLink('test@example.com')).toHaveProperty('error');
 expect(m.generateLink).not.toHaveBeenCalled(); expect(m.send).not.toHaveBeenCalled();
});
it('fails closed on database failure or missing hashing secret', async () => {
 m.rpc.mockRejectedValue(new Error('outage'));
 expect(await sendRecoveryLink('test@example.com')).toHaveProperty('error');
 expect(m.generateLink).not.toHaveBeenCalled();
 vi.stubEnv('RECOVERY_HASH_SECRET',''); m.rpc.mockClear();
 expect(await sendRecoveryLink('test@example.com')).toHaveProperty('error');
 expect(m.rpc).not.toHaveBeenCalled(); expect(m.send).not.toHaveBeenCalled();
});
it('normalizes email keys and ignores forwarded IP outside trusted hosting', async () => {
 vi.stubEnv('VERCEL','');
 const req=new Request('https://www.oliceu.com',{headers:{'x-forwarded-for':'203.0.113.7'}});
 await recoveryLimit(req,' Test@Example.com '); const keys=m.rpc.mock.calls.map(c=>c[1].p_key);
 m.rpc.mockClear(); await recoveryLimit(req,'test@example.com');
 expect(m.rpc.mock.calls.map(c=>c[1].p_key)).toEqual(keys);
 expect(keys).toHaveLength(3); expect(keys.some(k=>k.startsWith('recovery:ip:'))).toBe(false);
});
it('rejects malformed email before consuming counters',async()=>{
 expect(await sendRecoveryLink('invalid')).toHaveProperty('error');
 expect(m.rpc).not.toHaveBeenCalled(); expect(m.send).not.toHaveBeenCalled();
});
