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
    const userId = searchParams.get("user_id");
    const grantType = searchParams.get("grant_type");
    const activeOnly = searchParams.get("active_only") === "true";
    
    const supabase = createSupabaseAdminClient();
    
    let query = supabase
      .from("access_grants")
      .select(`
        *,
        users!access_grants_user_id_fkey (name, email)
      `, { count: "exact" });
    
    if (userId) query = query.eq("user_id", userId);
    if (grantType) query = query.eq("grant_type", grantType);
    if (activeOnly) {
      query = query
        .is("revoked_at", null)
        .or("expires_at.is.null,expires_at.gt." + new Date().toISOString());
    }
    
    query = query.order("granted_at", { ascending: false });
    
    const { data, error, count } = await query;
    
    if (error) throw error;
    
    return NextResponse.json({
      grants: data || [],
      total: count || 0
    });
  } catch (error) {
    console.error("[admin/access-grants] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const admin = await assertAdmin();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    
    const body = await request.json();
    const { 
      user_id, 
      grant_type, 
      modules, 
      courses, 
      expires_at, 
      source_id, 
      source_type = "manual",
      metadata = {}
    } = body;
    
    if (!user_id || !grant_type) {
      return NextResponse.json({ error: "user_id and grant_type required" }, { status: 400 });
    }
    
    const supabase = createSupabaseAdminClient();
    
    // Verify user exists
    const { data: targetUser } = await supabase
      .from("users")
      .select("id, email")
      .eq("id", user_id)
      .single();
    
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Create access grant via RPC
    const { data: grantId, error: rpcError } = await supabase.rpc("grant_user_access", {
      p_user_id: user_id,
      p_grant_type: grant_type,
      p_modules: modules || null,
      p_courses: courses || null,
      p_expires_at: expires_at || null,
      p_source_id: source_id || null,
      p_source_type: source_type,
      p_granted_by: user.id,
      p_metadata: metadata
    });
    
    if (rpcError) throw rpcError;
    
    const { data: grant, error } = await supabase
      .from("access_grants")
      .select("*")
      .eq("id", grantId)
      .single();
    
    if (error) throw error;
    
    return NextResponse.json({ grant });
  } catch (error) {
    console.error("[admin/access-grants] Create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}