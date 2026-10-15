import {beforeEach,describe,expect,it,vi} from "vitest";
const mocks=vi.hoisted(()=>({user:vi.fn(),from:vi.fn(),rpc:vi.fn()}));
vi.mock("@/lib/supabaseServer",()=>({getCurrentUser:mocks.user,createSupabaseServerClient:async()=>mocks}));
import {GET} from "@/app/api/onboarding/status/route";
beforeEach(()=>{vi.clearAllMocks();mocks.user.mockResolvedValue({id:"user"});mocks.from.mockImplementation((table:string)=>{const chain={select:()=>chain,eq:()=>chain,order:async()=>({data:[{id:"m1",title:"Primeiro"},{id:"m2",title:"Segundo"}]}),limit:async()=>({data:table==="diagnostic_sessions"?[{id:"diagnostic"}]:[]})};return chain;});});
describe("onboarding is based on verified access",()=>{
 it("requires identity",async()=>{mocks.user.mockResolvedValue(null);expect((await GET()).status).toBe(401);});
 it("does not infer access from having a purchase row",async()=>{mocks.rpc.mockResolvedValue({data:false});expect((await (await GET()).json()).hasPurchase).toBe(false);});
 it("chooses an accessible module",async()=>{mocks.rpc.mockResolvedValueOnce({data:false}).mockResolvedValueOnce({data:true});expect(await (await GET()).json()).toMatchObject({hasPurchase:true,firstModuleId:"m2"});});
 it("does not turn an authorization outage into a successful empty result",async()=>{mocks.rpc.mockResolvedValue({error:{message:"offline"}});expect((await GET()).status).toBe(500);});
});
