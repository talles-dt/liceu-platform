const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/home/timon/Documents/liceu-underground/code/.env.local' });
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key, { auth: { persistSession: false } });

(async () => {
  // Try a direct Postgres query via the PostgREST rpc wrapper using a function
  // If no function exists, fall back to reading the actual existing rows' distinct types.
  const { data, error } = await supabase
    .from('liceu_exercises')
    .select('exercise_type')
    .limit(500);
  if (error) { console.log('select error', error.message); }
  const distinct = [...new Set((data || []).map(r => r.exercise_type))];
  console.log('DISTINCT exercise_type currently in DB:', distinct);

  // Also check the curated seed we already inserted in 20260729 — it had 'producao'.
  // But probe rejected 'producao' — maybe because is_published false? No, constraint is on type only.
  // Let's re-probe 'producao' alone with full minimal row.
  const { error: e2 } = await supabase.from('liceu_exercises').insert({
    lesson_id: '32099302-155a-45d7-b5b4-62bfeeea8e6a',
    exercise_type: 'producao',
    title: 'probe2',
    prompt_markdown: 'probe2',
    is_published: true
  }).select('id').maybeSingle();
  console.log('producao probe2:', e2 ? e2.message.split('\n')[0] : 'OK');
  if (!e2) await supabase.from('liceu_exercises').delete().eq('title','probe2');
})();
