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
    
    const { data: partnership, error } = await supabase
      .from("partnerships")
      .select(`
        *,
        partnership_members (
          *,
          users!partnership_members_user_id_fkey (name, email)
        )
      `)
      .eq("id", id)
      .single();
    
    if (error) throw error;
    if (!partnership) return NextResponse.json({ error: "Partnership not found" }, { status: 404 });
    
    return NextResponse.json({ partnership });
  } catch (error) {
    console.error("[admin/partnerships/[id]] Error:", error);
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
    const { name, description, contact_email, contact_name, status, partner_type, modules, courses, max_seats, settings, terminated_reason } = body;
    
    const supabase = createSupabaseAdminClient();
    
    // Get current state for audit
    const { data: current } = await supabase
      .from("partnerships")
      .select("*")
      .eq("id", id)
      .single();
    
    if (!current) return NextResponse.json({ error: "Partnership not found" }, { status: 404 });
    
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (contact_email !== undefined) updates.contact_email = contact_email;
    if (contact_name !== undefined) updates.contact_name = contact_name;
    if (status !== undefined) {
      updates.status = status;
      if (status === "active" && current.status !== "active") {
        updates.activated_at = new Date().toISOString();
      } else if (status === "terminated" && current.status !== "terminated") {
        updates.terminated_at = new Date().toISOString();
        updates.terminated_by = user.id;
        updates.termination_reason = terminated_reason;
      }
    }
    if (partner_type !== undefined) updates.partner_type = partner_type;
    if (modules !== undefined) updates.modules = modules;
    if (courses !== undefined) updates.courses = courses;
    if (max_seats !== undefined) updates.max_seats = max_seats;
    if (settings !== undefined) updates.settings = settings;
    
    updates.updated_at = new Date().toISOString();
    
    const { data: updated, error } = await supabase
      .from("partnerships")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    
    if (error) throw error;
    
    // Audit log
    await supabase.rpc("log_audit", {
      p_action: "partnership_updated",
      p_target_type: "partnership",
      p_target_id: id,
      p_target_identifier: current.slug,
      p_old_values: current,
      p_new_values: updated,
      p_metadata: { updated_by: user.id }
    });
    
    return NextResponse.json({ partnership: updated });
  } catch (error) {
    console.error("[admin/partnerships/[id]] Update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
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
    const { user_id, email } = body;
    
    if (!user_id && !email) {
      return NextResponse.json({ error: "user_id or email required" }, { status: 400 });
    }
    
    const supabase = createSupabaseAdminClient();
    
    // Get partnership
    const { data: partnership } = await supabase
      .from("partnerships")
      .select("*")
      .eq("id", id)
      .single();
    
    if (!partnership) return NextResponse.json({ error: "Partnership not found" }, { status: 404 });
    if (partnership.status !== "active") {
      return NextResponse.json({ error: "Partnership not active" }, { status: 400 });
    }
    if (partnership.max_seats && partnership.used_seats >= partnership.max_seats) {
      return NextResponse.json({ error: "Partnership full" }, { status: 400 });
    }
    
    // Find user
    let targetUser;
    if (user_id) {
      const { data } = await supabase
        .from("users")
        .select("id, email")
        .eq("id", user_id)
        .single();
      targetUser = data;
    } else {
      const { data } = await supabase
        .from("users")
        .select("id, email")
        .eq("email", email)
        .single();
      targetUser = data;
    }
    
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Check if already a member
    const { data: existing } = await supabase
      .from("partnership_members")
      .select("id")
      .eq("partnership_id", id)
      .eq("user_id", targetUser.id)
      .single();
    
    if (existing) {
      return NextResponse.json({ error: "User already a member" }, { status: 409 });
    }
    
    // Create access grant for partnership modules/courses
    const { data: grantId } = await supabase.rpc("grant_user_access", {
      p_user_id: targetUser.id,
      p_grant_type: partnership.access_grant_type,
      p_modules: partnership.modules || null,
      p_courses: partnership.courses || null,
      p_source_id: partnership.id,
      p_source_type: "partnership",
      p_granted_by: user.id,
      p_metadata: { partnership_id: partnership.id }
    });
    
    // Add partnership member
    const { data: member, error } = await supabase
      .from("partnership_members")
      .insert({
        partnership_id: id,
        user_id: targetUser.id,
        access_grant_id: grantId,
        accepted_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Update used_seats
    await supabase
      .from("partnerships")
      .update({ used_seats: partnership.used_seats + 1 })
      .eq("id", id);
    
    // Audit log
    await supabase.rpc("log_audit", {
      p_action: "partnership_member_added",
      p_target_type: "partnership_member",
      p_target_id: member.id,
      p_target_identifier: targetUser.email,
      p_new_values: member,
      p_metadata: { partnership_id: partnership.id, added_by: user.id }
    });
    
    return NextResponse.json({ member });
  } catch (error) {
    console.error("[admin/partnerships/[id]/members] Add error:", error);
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
    const memberId = searchParams.get("member_id");
    const revokeReason = searchParams.get("revoke_reason") || "Removed by admin";
    
    if (!memberId) {
      return NextResponse.json({ error: "member_id required" }, { status: 400 });
    }
    
    const supabase = createSupabaseAdminClient();
    
    // Get member for audit
    const { data: member } = await supabase
      .from("partnership_members")
      .select(`
        *,
        users!partnership_members_user_id_fkey (email, name)
      `)
      .eq("id", memberId)
      .eq("partnership_id", id)
      .single();
    
    if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });
    
    // Get partnership for audit
    const { data: partnershipData } = await supabase
      .from("partnerships")
      .select("id")
      .eq("id", id)
      .single();
    
    // Revoke access grant
    if (member.access_grant_id) {
      await supabase.rpc("revoke_user_access", {
        p_grant_id: member.access_grant_id,
        p_revoked_by: user.id,
        p_reason: revokeReason
      });
    }
    
    // Update member
    await supabase
      .from("partnership_members")
      .update({
        revoked_at: new Date().toISOString(),
        revoked_by: user.id,
        revoke_reason: revokeReason
      })
      .eq("id", memberId);
    
    // Update used_seats
    const { data: partnershipSeats } = await supabase
      .from("partnerships")
      .select("id, used_seats")
      .eq("id", id)
      .single();
    
    if (partnershipSeats) {
      await supabase
        .from("partnerships")
        .update({ used_seats: Math.max(0, partnershipSeats.used_seats - 1) })
        .eq("id", id);
    }
    
    // Audit log
    await supabase.rpc("log_audit", {
      p_action: "partnership_member_removed",
      p_target_type: "partnership_member",
      p_target_id: memberId,
      p_target_identifier: member.users?.email,
      p_old_values: member,
      p_metadata: { partnership_id: partnershipData?.id, removed_by: user.id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[admin/partnerships/[id]/members] Remove error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}