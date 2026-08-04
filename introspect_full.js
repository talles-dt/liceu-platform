const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/home/timon/Documents/liceu-underground/code/.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key, { auth: { persistSession: false } });

(async () => {
  const { data: lessons, error: le } = await supabase
    .from('liceu_lessons').select('id, code, module_id, title, is_published').order('code');
  if (le) { console.log('LESSONS ERROR', le.message); return; }
  console.log('=== ALL LESSONS (by code) ===');
  for (const l of lessons) {
    console.log(`${String(l.code).padStart(2)} | ${l.id} | ${l.title}`);
  }

  // Existing content counts per table
  const tables = ['liceu_theoretical_content', 'liceu_exercises', 'liceu_flashcards'];
  for (const t of tables) {
    const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
    if (error) { console.log(`\n${t} ERROR ${error.message}`); continue; }
    console.log(`\n${t} TOTAL ROWS: ${count}`);
  }

  // Sample: for lesson code 1, what already exists?
  const l1 = lessons.find(l => l.code === 1);
  if (l1) {
    for (const t of tables) {
      const { data, error } = await supabase.from(t).select('id').eq('lesson_id', l1.id);
      console.log(`\nLesson code 1 (${l1.title}) -> ${t}: ${data ? data.length : 'ERR ' + (error&&error.message)} existing`);
    }
  }
})();
