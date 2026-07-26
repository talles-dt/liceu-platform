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
    
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();
    
    if (profileError) throw profileError;
    if (!profile) return NextResponse.json({ error: "User not found" }, { status: 404 });
    
    // Get access grants
    const { data: grants } = await supabase
      .from("access_grants")
      .select("*")
      .eq("user_id", id)
      .order("granted_at", { ascending: false });
    
    // Get partnership memberships
    const { data: memberships } = await supabase
      .from("partnership_members")
      .select(`
        *,
        partnerships (id, name, slug, status)
      `)
      .eq("user_id", id);
    
    // Get audit logs for this user
    const { data: auditLogs } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("target_id", id)
      .order("created_at", { ascending: false })
      .limit(50);
    
    return NextResponse.json({
      user: profile,
      access_grants: grants || [],
      partnership_memberships: memberships || [],
      audit_logs: auditLogs || []
    });
  } catch (error) {
    console.error("[admin/users/[id]] Error:", error);
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
    const { name, role, suspended, suspension_reason } = body;
    
    const supabase = createSupabaseAdminClient();
    
    // Get current state for audit
    const { data: current } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();
    
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (role !== undefined) updates.role = role;
    if (suspended !== undefined) {
      updates.suspended_at = suspended ? new Date().toISOString() : null;
      updates.suspended_by = suspended ? user.id : null;
      updates.suspension_reason = suspended ? suspension_reason : null;
    }
    
    updates.updated_at = new Date().toISOString();
    
    const { data: updated, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    
    if (error) throw error;
    
    // Audit log
    await supabase.rpc("log_audit", {
      p_action: "user_updated",
      p_target_type: "user",
      p_target_id: id,
      p_target_identifier: current?.email || id,
      p_old_values: current,
      p_new_values: updated,
      p_metadata: { updated_by: user.id }
    });
    
    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error("[admin/users/[id]] Update error:", error);
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
    
    // Prevent self-deletion
    if (id === user.id) {
      return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
    }
    
    const supabase = createSupabaseAdminClient();
    
    // Get user for audit
    const { data: targetUser } = await supabase
      .from("users")
      .select("email, name")
      .eq("id", id)
      .single();
    
    // Delete from auth (cascades to public.users via trigger)
    const { error: authError } = await supabase.auth.admin.deleteUser(id);
    if (authError) throw authError;
    
    // Audit log
        await supabase.rpc("log_audit", {
          p_action: "user_deleted",
          p_target_type: "user",
          p_target_id: id,
          p_target_identifier: targetUser?.email || id,
          p_old_values: targetUser,
          p_metadata: { deleted_by: user.id }
        });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[admin/users/[id]] Delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}