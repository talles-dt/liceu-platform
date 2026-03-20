import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabaseServer";
import { canAccessModuleForUser } from "@/lib/progression";

type Context = {
  params: Promise<{
    moduleId: string;
  }>;
};

export async function GET(_request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { moduleId } = await params;
  const canAccess = await canAccessModuleForUser(user.id, moduleId);

  return NextResponse.json({ moduleId, canAccess });
}

