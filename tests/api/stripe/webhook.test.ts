import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockSupabase } from "../../mocks/supabase";
import { mockConstructEvent } from "../../mocks/stripe";
import { ensureCourseProgressForUserAdmin } from "../../mocks/provisioning";
const handlers = vi.hoisted(() => ({ subscription: vi.fn(), service: vi.fn() }));
vi.mock("@/lib/billing/webhook", () => ({ handleSubscriptionEvent: handlers.subscription, handleServiceEvent: handlers.service }));
import { POST } from "@/app/api/stripe/webhook/route";
const request = () => new Request("https://example.invalid/api/stripe/webhook", {method:"POST",headers:{"stripe-signature":"signature"},body:"signed payload"});
beforeEach(() => {vi.clearAllMocks();vi.stubEnv("STRIPE_WEBHOOK_SECRET","whsec_test");handlers.subscription.mockResolvedValue(false);handlers.service.mockResolvedValue(false);});
describe("payment receipt must be authenticated and durable", () => {
 it("fails closed without configuration",async()=>{vi.stubEnv("STRIPE_WEBHOOK_SECRET","");expect((await POST(request())).status).toBe(503);expect(mockConstructEvent).not.toHaveBeenCalled();});
 it("rejects invalid signature before persistence",async()=>{mockConstructEvent.mockImplementationOnce(()=>{throw Error("bad signature")});expect((await POST(request())).status).toBe(400);expect(mockSupabase.from).not.toHaveBeenCalled();});
 it("passes the raw payload and signature to verification",async()=>{mockConstructEvent.mockReturnValue({type:"other",data:{object:{}}});expect((await POST(request())).status).toBe(200);expect(mockConstructEvent).toHaveBeenCalledWith("signed payload","signature","whsec_test");});
 it("retries rather than acknowledges subscription persistence failure",async()=>{mockConstructEvent.mockReturnValue({type:"invoice.paid",data:{object:{}}});handlers.subscription.mockRejectedValueOnce(Error("db unavailable"));expect((await POST(request())).status).toBe(500);});
 it("retains ambiguous legacy payments without inventing course access",async()=>{const event={id:"evt_old",type:"checkout.session.completed",data:{object:{payment_status:"paid"}}};mockConstructEvent.mockReturnValue(event);const upsert=vi.fn().mockResolvedValue({error:null});mockSupabase.from.mockReturnValue({upsert} as never);expect((await POST(request())).status).toBe(200);expect(mockSupabase.from).toHaveBeenCalledWith("liceu_legacy_billing_events");expect(upsert).toHaveBeenCalledWith(expect.objectContaining({event_id:"evt_old"}),{onConflict:"event_id",ignoreDuplicates:true});expect(ensureCourseProgressForUserAdmin).not.toHaveBeenCalled();});
 it("retries when the reconciliation ledger cannot persist",async()=>{mockConstructEvent.mockReturnValue({id:"evt",type:"checkout.session.completed",data:{object:{payment_status:"paid"}}});mockSupabase.from.mockReturnValue({upsert:vi.fn().mockResolvedValue({error:{message:"offline"}})} as never);expect((await POST(request())).status).toBe(500);});
});
