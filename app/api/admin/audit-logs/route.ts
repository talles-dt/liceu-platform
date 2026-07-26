import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getCurrentUser } from "@/lib/supabaseServer";
import { assertAdmin } from "@/lib/admin/auth";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const admin = await assertAdmin();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const targetType = searchParams.get("target_type");
    const targetId = searchParams.get("target_id");
    const actorId = searchParams.get("actor_id");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;
    
    const supabase = createSupabaseAdminClient();
    
    let query = supabase
      .from("audit_logs")
      .select(`
        *,
        users!audit_logs_actor_id_fkey (name, email)
      `, { count: "exact" });
    
    if (action) query = query.eq("action", action);
    if (targetType) query = query.eq("target_type", targetType);
    if (targetId) query = query.eq("target_id", targetId);
    if (actorId) query = query.eq("actor_id", actorId);
    if (startDate) query = query.gte("created_at", startDate);
    if (endDate) query = query.lte("created_at", endDate);
    
    query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);
    
    const { data, error, count } = await query;
    
    if (error) throw error;
    
    return NextResponse.json({
      logs: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error("[admin/audit-logs] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}