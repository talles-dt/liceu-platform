const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/home/timon/Documents/liceu-underground/code/.env.local' });
const fs = require('fs');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key, { auth: { persistSession: false } });
const STAGING = '/tmp/staging';

const ex = JSON.parse(fs.readFileSync(`${STAGING}/liceu_exercises.json`, 'utf8'));
const fc = JSON.parse(fs.readFileSync(`${STAGING}/liceu_flashcards.json`, 'utf8'));

async function insertBatch(table, rows, dropFields = []) {
  const CHUNK = 100;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK).map(r => {
      const c = { ...r };
      for (const f of dropFields) delete c[f];
      return c;
    });
    const { error } = await supabase.from(table).insert(slice);
    if (error) throw new Error(`INSERT ${table} (offset ${i}): ${error.message}`);
    inserted += slice.length;
  }
  console.log(`INSERTED ${inserted} into ${table}`);
}

(async () => {
  try {
    console.log('=== INSERT EXERCISES + FLASHCARDS (old rows already deleted) ===');
    await insertBatch('liceu_exercises', ex);
    await insertBatch('liceu_flashcards', fc);
    console.log('\n=== VERIFY ===');
    for (const t of ['liceu_theoretical_content', 'liceu_exercises', 'liceu_flashcards']) {
      const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
      if (error) { console.log(`${t} count error: ${error.message}`); continue; }
      console.log(`${t} TOTAL ROWS NOW: ${count}`);
    }
    const l1 = '32099302-155a-45d7-b5b4-62bfeeea8e6a';
    const { data: c1 } = await supabase.from('liceu_theoretical_content').select('id, word_count').eq('lesson_id', l1);
    const { data: e1 } = await supabase.from('liceu_exercises').select('id').eq('lesson_id', l1);
    const { data: f1 } = await supabase.from('liceu_flashcards').select('id').eq('lesson_id', l1);
    console.log(`\nLesson 1: content=${c1?.length}, exercises=${e1?.length}, flashcards=${f1?.length}`);
    console.log('\nUPSERT COMPLETE.');
  } catch (e) {
    console.error('\nFAILED:', e.message);
    process.exit(1);
  }
})();
