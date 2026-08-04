const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/home/timon/Documents/liceu-underground/code/.env.local' });
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key, { auth: { persistSession: false } });

(async () => {
  // lessons 1-37 only (source-backed). 38-43 are Pronuntiatio, skip.
  const { data: lessons, error } = await supabase
    .from('liceu_lessons').select('id, code').in('code', Array.from({length:37}, (_,i)=>i+1));
  if (error) { console.log('ERR', error.message); return; }
  const ids = lessons.map(l => l.id);

  const result = { lessons: {} };
  for (const l of lessons) {
    result.lessons[l.code] = { id: l.id, theoretical_content: [], exercises: [], flashcards: [] };
  }
  const { data: tc } = await supabase.from('liceu_theoretical_content').select('id, lesson_id').in('lesson_id', ids);
  const { data: ex } = await supabase.from('liceu_exercises').select('id, lesson_id').in('lesson_id', ids);
  const { data: fc } = await supabase.from('liceu_flashcards').select('id, lesson_id').in('lesson_id', ids);
  for (const r of (tc||[])) { const code = lessons.find(l=>l.id===r.lesson_id)?.code; if (code) result.lessons[code].theoretical_content.push(r.id); }
  for (const r of (ex||[])) { const code = lessons.find(l=>l.id===r.lesson_id)?.code; if (code) result.lessons[code].exercises.push(r.id); }
  for (const r of (fc||[])) { const code = lessons.find(l=>l.id===r.lesson_id)?.code; if (code) result.lessons[code].flashcards.push(r.id); }

  const counts = { tc: (tc||[]).length, ex: (ex||[]).length, fc: (fc||[]).length };
  console.log('EXISTING CHILD ROWS FOR LESSONS 1-37:', JSON.stringify(counts));
  require('fs').writeFileSync('/tmp/live_child_ids.json', JSON.stringify(result, null, 2));
  console.log('wrote /tmp/live_child_ids.json');
})();
