import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import Stripe from "stripe";
import {randomBytes} from "node:crypto";
const {processEvent}=vi.hoisted(()=>({processEvent:vi.fn()}));
vi.mock("@/lib/operations/events",()=>({processEvent}));
import {POST} from "@/app/api/stripe/webhook/route";
const stripe=new Stripe("sk_test_local_signature_only");
const secret="whsec_"+randomBytes(24).toString("hex");
const payload=JSON.stringify({id:"evt_signature_local",object:"event",type:"product.created",data:{object:{id:"prod_local",object:"product"}}});
function request(body=payload,signingSecret=secret,timestamp=Math.floor(Date.now()/1000)){
 return new Request("https://example.invalid/api/stripe/webhook",{method:"POST",body,headers:{"stripe-signature":stripe.webhooks.generateTestHeaderString({payload,secret:signingSecret,timestamp})}});
}
beforeEach(()=>{vi.clearAllMocks();vi.stubEnv("STRIPE_SECRET_KEY","sk_test_local_signature_only");vi.stubEnv("STRIPE_WEBHOOK_SECRET",secret);processEvent.mockResolvedValue(undefined);});
afterEach(()=>vi.unstubAllEnvs());
describe("real Stripe signature verification at the route boundary",()=>{
 it("accepts authentic raw bytes and dispatches the parsed event",async()=>{expect((await POST(request())).status).toBe(200);expect(processEvent).toHaveBeenCalledWith("stripe","evt_signature_local",JSON.parse(payload));});
 it("rejects changed raw bytes without dispatch",async()=>{expect((await POST(request(payload+" "))).status).toBe(400);expect(processEvent).not.toHaveBeenCalled();});
 it("rejects another endpoint secret without dispatch",async()=>{expect((await POST(request(payload,"whsec_other_endpoint"))).status).toBe(400);expect(processEvent).not.toHaveBeenCalled();});
 it("rejects expired signatures without dispatch",async()=>{expect((await POST(request(payload,secret,1))).status).toBe(400);expect(processEvent).not.toHaveBeenCalled();});
});
