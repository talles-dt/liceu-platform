import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabaseServer";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

type Context = { params: Promise<{ moduleId: string }> };

type DbCard = {
  id: string;
  front: string;
  back: string;
  order_index: number;
};

type DbProgress = {
  card_id: string;
  easiness: number;
  interval_days: number;
  repetitions: number;
  next_review: string;
};

/**
 * GET /api/modules/[moduleId]/flashcards
 * Returns a random flashcard set for the module, with the user's SM-2 state
 * merged in. If no sets exist, returns 404.
 */
export async function GET(_req: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { moduleId } = await params;
  const supabase = await createSupabaseServerClient();

  // Pick a random set for this module
  const { data: sets } = await supabase
    .from("flashcard_sets")
    .select("id, title")
    .eq("module_id", moduleId);

  if (!sets || sets.length === 0) {
    return NextResponse.json({ error: "No flashcard sets for this module" }, { status: 404 });
  }

  const randomSet = sets[Math.floor(Math.random() * sets.length)] as {
    id: string;
    title: string;
  };

  // Load cards for this set
  const { data: cards } = await supabase
    .from("flashcards")
    .select("id, front, back, order_index")
    .eq("set_id", randomSet.id)
    .order("order_index", { ascending: true });

  const typedCards = (cards as DbCard[]) ?? [];

  if (typedCards.length === 0) {
    return NextResponse.json({ error: "Set has no cards" }, { status: 404 });
  }

  // Load the user's SM-2 state for these cards
  const cardIds = typedCards.map((c) => c.id);
  const { data: progressRows } = await supabase
    .from("flashcard_progress")
    .select("card_id, easiness, interval_days, repetitions, next_review")
    .eq("user_id", user.id)
    .in("card_id", cardIds);

  const progressByCard = new Map(
    ((progressRows as DbProgress[]) ?? []).map((p) => [p.card_id, p]),
  );

  const result = typedCards.map((c) => {
    const p = progressByCard.get(c.id);
    return {
      id: c.id,
      front: c.front,
      back: c.back,
      easiness: p?.easiness ?? 2.5,
      intervalDays: p?.interval_days ?? 1,
      repetitions: p?.repetitions ?? 0,
      nextReview: p?.next_review ?? new Date().toISOString(),
    };
  });

  return NextResponse.json({ setId: randomSet.id, title: randomSet.title, cards: result });
}
