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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role");
    const status = searchParams.get("status");
    const offset = (page - 1) * limit;
    
    const supabase = createSupabaseAdminClient();
    
    let query = supabase
      .from("users")
      .select("id, name, email, role, created_at, email_verified, last_login_at, login_count, suspended_at, metadata", { count: "exact" });
    
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }
    if (role) {
      query = query.eq("role", role);
    }
    if (status === "active") {
      query = query.is("suspended_at", null);
    } else if (status === "suspended") {
      query = query.not("suspended_at", "is", null);
    }
    
    query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);
    
    const { data, error, count } = await query;
    
    if (error) throw error;
    
    // Get access grant counts for each user
    const userIds = data?.map(u => u.id) || [];
    let grantsMap = new Map<string, number>();
    if (userIds.length > 0) {
      const { data: grants } = await supabase
        .from("access_grants")
        .select("user_id")
        .in("user_id", userIds)
        .is("revoked_at", null);
      
      grants?.forEach(g => {
        grantsMap.set(g.user_id, (grantsMap.get(g.user_id) || 0) + 1);
      });
    }
    
    const usersWithGrants = data?.map(u => ({
      ...u,
      active_grants: grantsMap.get(u.id) || 0
    })) || [];
    
    return NextResponse.json({
      users: usersWithGrants,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error("[admin/users] Error:", error);
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
    const { email, name, role = "student", password } = body;
    
    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }
    
    const emailLower = email.trim().toLowerCase();
    const supabase = createSupabaseAdminClient();
    
    // Check if email already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const emailExists = existingUsers?.users?.some(
      (u) => u.email?.toLowerCase() === emailLower,
    );

    if (emailExists) {
      return NextResponse.json(
        { error: "Email already exists. Use a different email or update the existing user." },
        { status: 400 },
      );
    }
    
    // Create user in auth
    const createParams: { email: string; email_confirm: boolean; user_metadata: { full_name?: string; name?: string }; password?: string } = {
      email: emailLower,
      email_confirm: true,
      user_metadata: { full_name: name, name }
    };
    
    if (password) {
      createParams.password = password;
    }
    
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser(createParams);
    
    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }
    
    // Create profile in public.users
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .insert({
        id: authUser.user.id,
        name: name || emailLower.split("@")[0],
        email: emailLower,
        role
      })
      .select()
      .single();
    
    if (profileError) {
      console.error("[admin/users] Profile insert error:", profileError);
      return NextResponse.json({ error: "Failed to create user profile" }, { status: 500 });
    }
    
    // Audit log
    await supabase.rpc("log_audit", {
      p_action: "user_created",
      p_target_type: "user",
      p_target_id: authUser.user.id,
      p_target_identifier: emailLower,
      p_new_values: { email: emailLower, name, role },
      p_metadata: { created_by: user.id }
    });
    
    return NextResponse.json({ 
      user: profile,
      note: password ? "User created with provided password" : "User created without password - they will need a password reset",
    });
  } catch (error) {
    console.error("[admin/users] Create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
