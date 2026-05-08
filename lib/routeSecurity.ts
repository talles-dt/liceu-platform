import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { canAccessModuleForUser } from "@/lib/progression";
import { getUserAccessLevel } from "@/lib/access";

type LessonAccess = {
  lessonId: string;
  moduleId: string;
  courseId: string;
};

export function requireCronSecret(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Cron secret is not configured" }, { status: 500 });
  }

  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

export async function assertModuleAccess(userId: string, moduleId: string) {
  const canAccess = await canAccessModuleForUser(userId, moduleId);
  if (!canAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return null;
}

export async function resolveLessonAccess(
  userId: string,
  lessonId: string,
): Promise<{ access: LessonAccess; denial: null } | { access: null; denial: NextResponse }> {
  const supabase = await createSupabaseServerClient();
  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, module_id, modules(course_id)")
    .eq("id", lessonId)
    .maybeSingle<{
      id: string;
      module_id: string;
      modules: { course_id: string } | null;
    }>();

  if (!lesson?.modules?.course_id) {
    return {
      access: null,
      denial: NextResponse.json({ error: "Not found" }, { status: 404 }),
    };
  }

  const moduleDenial = await assertModuleAccess(userId, lesson.module_id);
  if (moduleDenial) return { access: null, denial: moduleDenial };

  const accessLevel = await getUserAccessLevel(userId, lesson.modules.course_id);
  if (accessLevel === "none") {
    return {
      access: null,
      denial: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return {
    access: {
      lessonId: lesson.id,
      moduleId: lesson.module_id,
      courseId: lesson.modules.course_id,
    },
    denial: null,
  };
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
