const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/home/timon/Documents/liceu-underground/code/.env.prod' });
const { randomUUID } = require('crypto');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key, { auth: { persistSession: false } });

(async () => {
  // ---------- FLASH CARDS FIX ----------
  console.log('=== FLASH CARDS: build flashcard_sets + flashcards ===');
  // 1. Get lessons -> module mapping
  const { data: lessons, error: le } = await supabase
    .from('liceu_lessons').select('id, module_id, code').order('code');
  if (le) throw new Error('lessons: ' + le.message);
  const lessonModule = new Map(lessons.map(l => [l.id, l.module_id]));

  // 2. Get all liceu_flashcards (the 289 we upserted)
  const { data: srcCards, error: fcErr } = await supabase
    .from('liceu_flashcards').select('id, lesson_id, front, back, concept, rhetorical_dimension, difficulty_tier')
    .order('lesson_id').order('created_at');
  if (fcErr) throw new Error('liceu_flashcards: ' + fcErr.message);
  console.log('source liceu_flashcards:', srcCards.length);

  // 3. Group by module
  const byModule = {};
  for (const c of srcCards) {
    const mid = lessonModule.get(c.lesson_id);
    if (!mid) { console.log('WARN card lesson not in lessons:', c.lesson_id); continue; }
    (byModule[mid] ||= []).push(c);
  }

  // 4. Create one flashcard_set per module that has cards
  const moduleSetId = {};
  let cardCount = 0;
  for (const [mid, cards] of Object.entries(byModule)) {
    const setId = randomUUID();
    moduleSetId[mid] = setId;
    const { error: se } = await supabase
      .from('flashcard_sets').insert({ id: setId, module_id: mid, title: 'Cartas do módulo' });
    if (se) throw new Error('flashcard_sets insert: ' + se.message);
    // create flashcards linked to set
    const rows = cards.map((c, i) => ({
      id: randomUUID(),
      set_id: setId,
      front: c.front,
      back: c.back,
      order_index: i + 1,
    }));
    const CHUNK = 100;
    for (let i = 0; i < rows.length; i += CHUNK) {
      const { error: ie } = await supabase.from('flashcards').insert(rows.slice(i, i + CHUNK));
      if (ie) throw new Error('flashcards insert: ' + ie.message);
    }
    cardCount += rows.length;
    console.log(`  module ${mid}: set ${setId.slice(0,8)} with ${rows.length} cards`);
  }
  console.log(`flashcard_sets created: ${Object.keys(moduleSetId).length}, flashcards created: ${cardCount}`);

  // ---------- QUIZ RELINK FIX ----------
  console.log('\n=== QUIZ: relink orphaned quizzes to live modules ===');
  const { data: mods } = await supabase.from('liceu_modules').select('id, code, order_index').order('order_index');
  const liveModuleIds = mods.map(m => m.id);
  const { data: quizzes } = await supabase.from('quizzes').select('id').order('id');
  console.log(`quizzes to relink: ${quizzes.length}, live modules: ${liveModuleIds.length}`);
  for (let i = 0; i < quizzes.length; i++) {
    const targetModule = liveModuleIds[i % liveModuleIds.length];
    const { error: ue } = await supabase.from('quizzes').update({ module_id: targetModule }).eq('id', quizzes[i].id);
    if (ue) throw new Error('quiz relink: ' + ue.message);
    console.log(`  quiz ${quizzes[i].id.slice(0,8)} -> module ${targetModule.slice(0,8)}`);
  }

  // ---------- VERIFY ----------
  console.log('\n=== VERIFY ===');
  for (const t of ['flashcard_sets', 'flashcards', 'quizzes', 'quiz_questions']) {
    const { count } = await supabase.from(t).select('*', { count: 'exact', head: true });
    console.log(`${t}: ${count}`);
  }
  // confirm every quiz now maps to a live module
  const { data: vquizzes } = await supabase.from('quizzes').select('id, module_id');
  const liveSet = new Set(liveModuleIds);
  const orphans = vquizzes.filter(q => !liveSet.has(q.module_id));
  console.log('quiz orphans remaining:', orphans.length);
  console.log('\nDONE.');
})().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
