import { redirect } from "next/navigation";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabaseServer";

export default async function LessonPage(props: { params: Promise<{ moduleId: string; lessonId: string }> }) {
  const { moduleId, lessonId } = await props.params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createSupabaseServerClient();

  const { data: lesson, error } = await supabase
    .from("liceu_lessons")
    .select("id, title")
    .eq("id", lessonId)
    .eq("module_id", moduleId)
    .maybeSingle();

  if (error) {
    console.error("[lesson page] Supabase error:", error.message);
    return <div>Database error: {error.message}</div>;
  }

  if (!lesson) {
    return (
      <div className="p-8">
        <h1>Lesson not found</h1>
        <p>ID: {lessonId}</p>
        <p>Module: {moduleId}</p>
        <a href="/dashboard">Back to dashboard</a>
      </div>
    );
  }

  return (
    <div className="p-8">
      <a href="/dashboard">← Dashboard</a>
      <h1 className="text-2xl mt-4">{lesson.title}</h1>
      <p>ID: {lessonId}</p>
      <p>Module: {moduleId}</p>
    </div>
  );
}