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
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;
    
    const supabase = createSupabaseAdminClient();
    
    let query = supabase
      .from("partnerships")
      .select(`
        *,
        partnership_members (count),
        users!partnerships_created_by_fkey (name, email)
      `, { count: "exact" });
    
    if (status) query = query.eq("status", status);
    
    query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);
    
    const { data, error, count } = await query;
    
    if (error) throw error;
    
    // Add computed fields
    const partnershipsWithCounts = data?.map(p => ({
      ...p,
      member_count: p.partnership_members?.[0]?.count || 0,
      created_by_name: p.users?.name,
      created_by_email: p.users?.email
    })) || [];
    
    return NextResponse.json({
      partnerships: partnershipsWithCounts,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error("[admin/partnerships] Error:", error);
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
      name, 
      slug, 
      description, 
      contact_email, 
      contact_name, 
      partner_type, 
      modules, 
      courses, 
      max_seats, 
      access_grant_type = "partnership",
      settings = {}
    } = body;
    
    if (!name || !slug || !contact_email || !partner_type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    const supabase = createSupabaseAdminClient();
    
    // Check slug uniqueness
    const { data: existing } = await supabase
      .from("partnerships")
      .select("id")
      .eq("slug", slug)
      .single();
    
    if (existing) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }
    
    const { data: partnership, error } = await supabase
      .from("partnerships")
      .insert({
        name,
        slug,
        description,
        contact_email,
        contact_name,
        partner_type,
        modules: modules || null,
        courses: courses || null,
        max_seats,
        access_grant_type,
        settings,
        created_by: user.id,
        status: "pending"
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Audit log
    await supabase.rpc("log_audit", {
      p_action: "partnership_created",
      p_target_type: "partnership",
      p_target_id: partnership.id,
      p_target_identifier: slug,
      p_new_values: partnership,
      p_metadata: { created_by: user.id }
    });
    
    return NextResponse.json({ partnership });
  } catch (error) {
    console.error("[admin/partnerships] Create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}