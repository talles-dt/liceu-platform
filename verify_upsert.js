const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/home/timon/Documents/liceu-underground/code/.env.local' });
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key, { auth: { persistSession: false } });

(async () => {
  const { data: lessons } = await supabase.from('liceu_lessons').select('id, code, title').order('code');
  let totalC=0, totalE=0, totalF=0, missing=[];
  for (const l of lessons) {
    const { count: c } = await supabase.from('liceu_theoretical_content').select('*', { count:'exact', head:true }).eq('lesson_id', l.id);
    const { count: e } = await supabase.from('liceu_exercises').select('*', { count:'exact', head:true }).eq('lesson_id', l.id);
    const { count: f } = await supabase.from('liceu_flashcards').select('*', { count:'exact', head:true }).eq('lesson_id', l.id);
    const code = Number(l.code);
    if (code <= 37) {
      totalC+=c; totalE+=e; totalF+=f;
      if (c !== 1) missing.push(`L${code}: content=${c}`);
    }
  }
  console.log('SUMMARY (lessons 1-37):');
  console.log('  theoretical_content rows:', totalC, '(expect 37)');
  console.log('  exercises rows:', totalE, '(expect 157)');
  console.log('  flashcards rows:', totalF, '(expect 289)');
  console.log('  lessons missing content:', missing.length ? missing.join(', ') : 'none');

  // Verify 38-43 untouched: should still have only their original case_analysis exercise
  const { data: p } = await supabase.from('liceu_lessons').select('id, code').in('code', [38,39,40,41,42,43]);
  const pids = (p||[]).map(x=>x.id);
  const { count: pe } = await supabase.from('liceu_exercises').select('*', { count:'exact', head:true }).in('lesson_id', pids);
  const { count: pf } = await supabase.from('liceu_flashcards').select('*', { count:'exact', head:true }).in('lesson_id', pids);
  const { count: pc } = await supabase.from('liceu_theoretical_content').select('*', { count:'exact', head:true }).in('lesson_id', pids);
  console.log('\nPronuntiatio (38-43, untouched): content=' + pc + ', exercises=' + pe + ', flashcards=' + pf);
})();
