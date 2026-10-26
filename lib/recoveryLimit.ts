import { createHmac } from "node:crypto";
import { trustedIp } from "@/lib/billing/abuse";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

/** Database counters coordinate every process; no in-memory fallback on failure. */
export async function recoveryLimit(request: Request, email: string): Promise<string | null> {
  try {
    const secret = process.env.RECOVERY_HASH_SECRET;
    if (!secret || secret.length < 32) throw new Error("Recovery hashing secret unavailable");
    const hash = (value: string) => createHmac("sha256", secret).update(value).digest("hex");
    const db = createSupabaseAdminClient();
    const ip = trustedIp(request);
    const recipient = hash(email.trim().toLowerCase());
    const limits = [
      ...(ip ? [{ key: `recovery:ip:${hash(ip)}`, limit: 15, seconds: 3600 }] : []),
      { key: "recovery:global", limit: 120, seconds: 3600 },
      { key: `recovery:recipient-minute:${recipient}`, limit: 1, seconds: 60 },
      { key: `recovery:recipient-hour:${recipient}`, limit: 3, seconds: 3600 },
    ];
    for (const item of limits) {
      const { data, error } = await db.rpc("liceu_rate_limit", {
        p_key: item.key, p_limit: item.limit, p_seconds: item.seconds,
      });
      if (error) throw error;
      if (data !== true) return "Limite de solicitações atingido. Aguarde antes de tentar novamente. O limite por email é de um pedido por minuto e três por hora.";
    }
    return null;
  } catch {
    return "Não foi possível verificar a solicitação. Tente novamente mais tarde.";
  }
}
