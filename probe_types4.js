const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/home/timon/Documents/liceu-underground/code/.env.local' });
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key, { auth: { persistSession: false } });
const LID = '32099302-155a-45d7-b5b4-62bfeeea8e6a';

(async () => {
  const candidates = ['case_analysis','identificacao','producao','simulacao','analise_de_caso','reflexao','redacao','multipla_escolha','pratica','dissertativo'];
  for (const t of candidates) {
    const { error } = await supabase.from('liceu_exercises').insert({
      lesson_id: LID, exercise_type: t, title: 'p_'+t, prompt_markdown: 'x', is_published: true
    }).select('id').maybeSingle();
    const ok = !error;
    console.log(t.padEnd(18), ok ? 'OK' : 'REJECTED');
    if (ok) await supabase.from('liceu_exercises').delete().eq('title','p_'+t);
  }
})();
