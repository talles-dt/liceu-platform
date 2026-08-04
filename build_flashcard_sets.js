const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/home/timon/Documents/liceu-underground/code/.env.prod' });
const { randomUUID } = require('crypto');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key, { auth: { persistSession: false } });

(async () => {
  console.log('=== BUILD flashcard_sets + flashcards keyed to `modules` table ===');

  // 1. Build bridge: liceu_module.order_index -> modules.id
  const { data: lmods } = await supabase.from('liceu_modules').select('id, order_index').order('order_index');
  const { data: mods } = await supabase.from('modules').select('id, order_index').order('order_index');
  const modByOrder = new Map((mods||[]).map(m => [m.order_index, m.id]));
  const lmodToMod = {};
  for (const lm of (lmods||[])) {
    const targetOrder = lm.order_index - 1; // liceu_modules 1-6 -> modules 0-5
    lmodToMod[lm.id] = modByOrder.get(targetOrder);
  }
  console.log('bridge liceu_module -> modules:', JSON.stringify(Object.values(lmodToMod).filter(Boolean).length), 'mapped');

  // 2. lessons -> liceu_module
  const { data: lessons } = await supabase.from('liceu_lessons').select('id, module_id').order('code');
  const lessonModule = new Map((lessons||[]).map(l => [l.id, l.module_id]));

  // 3. source flashcards
  const { data: srcCards, error: fcErr } = await supabase
    .from('liceu_flashcards').select('id, lesson_id, front, back')
    .order('lesson_id').order('created_at');
  if (fcErr) throw new Error('liceu_flashcards: ' + fcErr.message);
  console.log('source liceu_flashcards:', srcCards.length);

  // 4. group by `modules` id
  const byMod = {};
  for (const c of srcCards) {
    const lmid = lessonModule.get(c.lesson_id);
    const mid = lmid ? lmodToMod[lmid] : null;
    if (!mid) { console.log('WARN no modules id for lesson', c.lesson_id); continue; }
    (byMod[mid] ||= []).push(c);
  }

  // 5. create sets + cards
  let total = 0;
  for (const [mid, cards] of Object.entries(byMod)) {
    const setId = randomUUID();
    const { error: se } = await supabase.from('flashcard_sets').insert({ id: setId, module_id: mid, title: 'Cartas do módulo' });
    if (se) throw new Error('flashcard_sets insert: ' + se.message);
    const rows = cards.map((c, i) => ({ id: randomUUID(), set_id: setId, front: c.front, back: c.back, order_index: i + 1 }));
    const CHUNK = 100;
    for (let i = 0; i < rows.length; i += CHUNK) {
      const { error: ie } = await supabase.from('flashcards').insert(rows.slice(i, i + CHUNK));
      if (ie) throw new Error('flashcards insert: ' + ie.message);
    }
    total += rows.length;
    console.log(`  modules ${mid.slice(0,8)}: set ${setId.slice(0,8)} -> ${rows.length} cards`);
  }
  console.log('flashcards created:', total);

  console.log('\n=== VERIFY ===');
  for (const t of ['flashcard_sets', 'flashcards']) {
    const { count } = await supabase.from(t).select('*', { count: 'exact', head: true });
    console.log(`${t}: ${count}`);
  }
  console.log('DONE.');
})().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
