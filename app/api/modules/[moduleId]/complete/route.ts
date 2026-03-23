import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabaseServer";
import { completeModuleForUser } from "@/lib/progression";
import { isUuidV4 } from "@/lib/validation";

type Context = {
  params: Promise<{
    moduleId: string;
  }>;
};

export async function POST(_request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { moduleId } = await params;
  if (!isUuidV4(moduleId)) {
    return NextResponse.json({ error: "Invalid moduleId" }, { status: 400 });
  }

  const result = await completeModuleForUser(user.id, moduleId);

  if (!result) {
    return NextResponse.json(
      { error: "Module is not yet eligible for completion" },
      { status: 400 },
    );
  }

  return NextResponse.json(result);
}
