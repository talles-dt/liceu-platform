import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabaseServer";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

type Context = { params: Promise<{ cardId: string }> };

/**
 * SM-2 algorithm.
 * grade: 0-5 (0=blackout, 3=correct with effort, 5=perfect)
 * Returns updated easiness, interval, repetitions, nextReview.
 */
function sm2(
  grade: number,
  easiness: number,
  intervalDays: number,
  repetitions: number,
): { easiness: number; intervalDays: number; repetitions: number; nextReview: Date } {
  let e = easiness;
  let n = repetitions;
  let i = intervalDays;

  if (grade >= 3) {
    if (n === 0) i = 1;
    else if (n === 1) i = 6;
    else i = Math.round(i * e);
    n += 1;
  } else {
    // Failed — reset
    n = 0;
    i = 1;
  }

  // Update easiness factor (EF)
  e = e + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
  if (e < 1.3) e = 1.3;

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + i);

  return { easiness: e, intervalDays: i, repetitions: n, nextReview };
}

export async function POST(req: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { cardId } = await params;
  const body = (await req.json().catch(() => ({}))) as { grade?: number };
  const grade = body.grade;

  if (grade === undefined || grade < 0 || grade > 5 || !Number.isInteger(grade)) {
    return NextResponse.json({ error: "grade must be integer 0–5" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  // Load current state
  const { data: existing } = await supabase
    .from("flashcard_progress")
    .select("easiness, interval_days, repetitions")
    .eq("user_id", user.id)
    .eq("card_id", cardId)
    .maybeSingle<{ easiness: number; interval_days: number; repetitions: number }>();

  const { easiness, intervalDays, repetitions, nextReview } = sm2(
    grade,
    existing?.easiness ?? 2.5,
    existing?.interval_days ?? 1,
    existing?.repetitions ?? 0,
  );

  await supabase.from("flashcard_progress").upsert(
    {
      user_id: user.id,
      card_id: cardId,
      easiness,
      interval_days: intervalDays,
      repetitions,
      next_review: nextReview.toISOString(),
    },
    { onConflict: "user_id,card_id" },
  );

  return NextResponse.json({ easiness, intervalDays, repetitions, nextReview });
}
