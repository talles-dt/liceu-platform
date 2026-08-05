const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/home/timon/Documents/liceu-underground/code/.env.prod' });
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key, { auth: { persistSession: false } });

(async () => {
  // Simulate the exact API logic for module I (Fundamentos)
  const moduleId = '6b07a7de-49df-4ac2-a71a-1ef12ce70ad7'; // liceu_module I id

  // Bridge: liceu_modules -> modules
  const { data: lmod } = await supabase
    .from("liceu_modules")
    .select("order_index")
    .eq("id", moduleId)
    .maybeSingle();
  if (!lmod) { console.log('Module not found'); return; }

  const { data: mod } = await supabase
    .from("modules")
    .select("id")
    .eq("order_index", lmod.order_index - 1)
    .maybeSingle();
  if (!mod) { console.log('No modules row'); return; }
  console.log('Bridge: liceu_module', moduleId, '-> modules', mod.id);

  // Flashcards
  const { data: sets } = await supabase
    .from("flashcard_sets")
    .select("id, title")
    .eq("module_id", mod.id);
  if (!sets || !sets.length) { console.log('No flashcard sets'); return; }
  const randomSet = sets[0];
  const { data: cards } = await supabase
    .from("flashcards")
    .select("id, front, back, order_index")
    .eq("set_id", randomSet.id)
    .order("order_index");
  console.log('Flashcards:', cards.length, 'cards in set', randomSet.title);
  console.log('  Sample front:', cards[0].front.slice(0,60));

  // Quiz
  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id")
    .eq("module_id", mod.id)
    .maybeSingle();
  if (!quiz) { console.log('No quiz'); return; }
  const { data: qs } = await supabase
    .from("quiz_questions")
    .select("id, question")
    .eq("quiz_id", quiz.id);
  console.log('Quiz:', qs.length, 'questions');
  console.log('  Q1:', qs[0].question.slice(0,60));
})();
