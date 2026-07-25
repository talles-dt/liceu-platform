import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { canAccessLiceuModuleForUser } from "@/lib/progression";

export type LessonAccess = {
  lessonId: string;
  moduleId: string;
};

export async function assertLiceuModuleAccess(
  userId: string,
  moduleId: string,
): Promise<NextResponse | null> {
  const canAccess = await canAccessLiceuModuleForUser(userId, moduleId);
  if (!canAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return null;
}

// Alias for backward compatibility
export const assertModuleAccess = assertLiceuModuleAccess;

export async function resolveLiceuLessonAccess(
  userId: string,
  lessonId: string,
): Promise<{ access: LessonAccess; denial: null } | { access: null; denial: NextResponse }> {
  const supabase = await createSupabaseServerClient();
  const { data: lesson } = await supabase
    .from("liceu_lessons")
    .select("id, module_id")
    .eq("id", lessonId)
    .maybeSingle<{
      id: string;
      module_id: string;
    }>();

  if (!lesson) {
    return {
      access: null,
      denial: NextResponse.json({ error: "Not found" }, { status: 404 }),
    };
  }

  const moduleDenial = await assertLiceuModuleAccess(userId, lesson.module_id);
  if (moduleDenial) return { access: null, denial: moduleDenial };

  return {
    access: {
      lessonId: lesson.id,
      moduleId: lesson.module_id,
    },
    denial: null,
  };
}

// Backward compatibility aliases
export const resolveLessonAccess = resolveLiceuLessonAccess;

export async function requireCronSecret(request: Request): Promise<NextResponse | null> {
  const authHeader = request.headers.get("authorization");
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, '"')
    .replace(/'/g, "'");
}