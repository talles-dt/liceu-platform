import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getCurrentUser } from "@/lib/supabaseServer";
import { assertAdmin } from "@/lib/admin/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const admin = await assertAdmin();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    
    const { id } = await params;
    const supabase = createSupabaseAdminClient();
    
    const { data: grant, error } = await supabase
      .from("access_grants")
      .select(`
        *,
        users!access_grants_user_id_fkey (name, email)
      `)
      .eq("id", id)
      .single();
    
    if (error) throw error;
    if (!grant) return NextResponse.json({ error: "Grant not found" }, { status: 404 });
    
    return NextResponse.json({ grant });
  } catch (error) {
    console.error("[admin/access-grants/[id]] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const admin = await assertAdmin();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    
    const { id } = await params;
    const body = await request.json();
    const { modules, courses, expires_at, metadata, revoked, revoke_reason } = body;
    
    const supabase = createSupabaseAdminClient();
    
    // Get current state for audit
    const { data: current } = await supabase
      .from("access_grants")
      .select("*")
      .eq("id", id)
      .single();
    
    if (!current) return NextResponse.json({ error: "Grant not found" }, { status: 404 });
    
    const updates: Record<string, unknown> = {};
    if (modules !== undefined) updates.modules = modules;
    if (courses !== undefined) updates.courses = courses;
    if (expires_at !== undefined) updates.expires_at = expires_at;
    if (metadata !== undefined) updates.metadata = metadata;
    if (revoked !== undefined) {
      if (revoked && !current.revoked_at) {
        updates.revoked_at = new Date().toISOString();
        updates.revoked_by = user.id;
        updates.revoke_reason = revoke_reason || null;
      } else if (!revoked && current.revoked_at) {
        // Unrevoke - not typically allowed, but let's support it
        updates.revoked_at = null;
        updates.revoked_by = null;
        updates.revoke_reason = null;
      }
    }
    
    updates.updated_at = new Date().toISOString();
    
    const { data: updated, error } = await supabase
      .from("access_grants")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    
    if (error) throw error;
    
    // Audit log
    await supabase.rpc("log_audit", {
      p_action: revoked === true ? "access_revoked" : "access_grant_updated",
      p_target_type: "access_grant",
      p_target_id: id,
      p_target_identifier: current.user_id,
      p_old_values: current,
      p_new_values: updated,
      p_metadata: { updated_by: user.id, revoke_reason }
    });
    
    return NextResponse.json({ grant: updated });
  } catch (error) {
    console.error("[admin/access-grants/[id]] Update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const admin = await assertAdmin();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const revokeReason = searchParams.get("revoke_reason") || "Revoked by admin";
    
    const supabase = createSupabaseAdminClient();
    
    // Get current state for audit
    const { data: current } = await supabase
      .from("access_grants")
      .select("*")
      .eq("id", id)
      .single();
    
    if (!current) return NextResponse.json({ error: "Grant not found" }, { status: 404 });
    
    // Revoke via RPC
    const { error: rpcError } = await supabase.rpc("revoke_user_access", {
      p_grant_id: id,
      p_revoked_by: user.id,
      p_reason: revokeReason
    });
    
    if (rpcError) throw rpcError;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[admin/access-grants/[id]] Delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}