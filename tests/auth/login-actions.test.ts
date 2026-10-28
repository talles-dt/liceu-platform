import {beforeEach,expect,it,vi} from 'vitest';
const m=vi.hoisted(()=>({signIn:vi.fn(),signOut:vi.fn(),upsert:vi.fn(),profile:vi.fn(),user:vi.fn()}));
vi.mock('@/lib/supabaseServer',()=>({getCurrentUser:m.user,createSupabaseServerClient:async()=>({auth:{signInWithPassword:m.signIn,signOut:m.signOut}})}));
vi.mock('@/lib/supabaseAdmin',()=>({createSupabaseAdminClient:()=>({from:()=>({upsert:m.upsert,select:()=>({eq:()=>({maybeSingle:m.profile})})})})}));
import {loginWithPassword,confirmLoginSession} from '@/app/login/actions';
beforeEach(()=>{vi.clearAllMocks();m.signIn.mockResolvedValue({data:{user:{id:'qa',email:'qa@example.invalid',user_metadata:{}},session:{}},error:null});m.upsert.mockResolvedValue({error:null});m.profile.mockResolvedValue({data:{role:'student',suspended_at:null},error:null});m.signOut.mockResolvedValue({error:null});});
it('logs in through server and preserves existing privileges during profile sync',async()=>{
 expect(await loginWithPassword(' QA@Example.invalid ','valid-password')).toEqual({destination:'/dashboard'});
 expect(m.signIn).toHaveBeenCalledWith({email:'qa@example.invalid',password:'valid-password'});
 expect(m.upsert.mock.calls[0][1]).toEqual({onConflict:'id',ignoreDuplicates:true});
});
it('returns admin only for the persisted role',async()=>{m.profile.mockResolvedValue({data:{role:'admin'}});expect(await loginWithPassword('qa@example.invalid','p')).toEqual({destination:'/admin'});});
it('does not redirect on invalid credentials',async()=>{m.signIn.mockResolvedValue({data:{},error:{code:'invalid_credentials'}});expect(await loginWithPassword('qa@example.invalid','p')).toEqual({error:'Email ou senha incorretos.'});expect(m.upsert).not.toHaveBeenCalled();});
it.each([{data:null,error:{}},{data:null,error:null},{data:{role:'student',suspended_at:'today'}}])('refuses missing, unavailable or suspended profile',async profile=>{m.profile.mockResolvedValue(profile);expect(await loginWithPassword('qa@example.invalid','p')).toHaveProperty('error');expect(m.signOut).toHaveBeenCalled();});
it('does not treat lost cookie or backend failure as confirmed session',async()=>{m.user.mockResolvedValue(null);expect(await confirmLoginSession()).toEqual({confirmed:false});m.user.mockRejectedValue(Error('outage'));expect(await confirmLoginSession()).toEqual({confirmed:false});m.user.mockResolvedValue({id:'qa'});expect(await confirmLoginSession()).toEqual({confirmed:true});});
