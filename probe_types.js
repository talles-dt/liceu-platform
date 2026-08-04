const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/home/timon/Documents/liceu-underground/code/.env.local' });
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key, { auth: { persistSession: false } });
(async () => {
  const { data, error } = await supabase.rpc('get_constraint_def', {}).maybeSingle?.() || {};
  // Fallback: read constraint via information_schema check_clauses (may be restricted)
  // Instead, try inserting one row of each candidate type to discover allowed
  const candidates = ['ativacao_pratica','ativacao','exercicio_pratico','exercicio','producao','analise_de_caso','identificacao','producao_textual','multipla_escolha','dissertativo'];
  for (const t of candidates) {
    const { error } = await supabase.from('liceu_exercises').insert({
      lesson_id: '32099302-155a-45d7-b5b4-62bfeeea8e6a',
      exercise_type: t, title: 'probe', prompt_markdown: 'probe', is_published: false
    }).select('id').maybeSingle();
    console.log(t, '->', error ? 'REJECTED: ' + error.message.split('\n')[0] : 'OK (probe inserted, will delete)');
    if (!error) {
      // delete probe
      await supabase.from('liceu_exercises').delete().eq('title','probe').eq('exercise_type', t);
    }
  }
})();
