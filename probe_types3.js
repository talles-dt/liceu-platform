const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/home/timon/Documents/liceu-underground/code/.env.local' });
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key, { auth: { persistSession: false } });

(async () => {
  // Exercises for lessons 38-43 (module VI) — these are the real untouched rows
  const { data: lessons } = await supabase.from('liceu_lessons').select('id, code').in('code', [38,39,40,41,42,43]);
  const ids = (lessons||[]).map(l=>l.id);
  const { data, error } = await supabase.from('liceu_exercises').select('exercise_type, title').in('lesson_id', ids);
  if (error) { console.log('ERR', error.message); return; }
  const types = [...new Set((data||[]).map(r=>r.exercise_type))];
  console.log('ALLOWED exercise_type (from real Pronuntiatio rows):', types);
  console.log('sample rows:', (data||[]).slice(0,3).map(r=>`${r.exercise_type} | ${r.title}`));
})();
