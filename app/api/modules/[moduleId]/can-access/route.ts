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
  const uuidV4Regex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidV4Regex.test(moduleId)) {
    return NextResponse.json({ error: "Invalid moduleId" }, { status: 400 });
  }

  const canAccess = await canAccessModuleForUser(user.id, moduleId);

  return NextResponse.json({ moduleId, canAccess });
}
