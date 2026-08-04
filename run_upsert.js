const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/home/timon/Documents/liceu-underground/code/.env.local' });
const fs = require('fs');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key, { auth: { persistSession: false } });

const STAGING = '/tmp/staging';
const tc = JSON.parse(fs.readFileSync(`${STAGING}/liceu_theoretical_content.json`, 'utf8'));
const ex = JSON.parse(fs.readFileSync(`${STAGING}/liceu_exercises.json`, 'utf8'));
const fc = JSON.parse(fs.readFileSync(`${STAGING}/liceu_flashcards.json`, 'utf8'));
const del = JSON.parse(fs.readFileSync(`${STAGING}/delete_manifest.json`, 'utf8'));

async function deleteByIds(table, ids) {
  if (!ids.length) return;
  const { error } = await supabase.from(table).delete().in('id', ids);
  if (error) throw new Error(`DELETE ${table}: ${error.message}`);
  console.log(`DELETED ${ids.length} from ${table}`);
}

async function insertBatch(table, rows) {
  // Insert in chunks of 100 to stay safe
  const CHUNK = 100;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK).map(r => {
      const { word_count, ...rest } = r; // word_count is generated
      return rest;
    });
    const { error } = await supabase.from(table).insert(slice);
    if (error) throw new Error(`INSERT ${table} (offset ${i}): ${error.message}`);
    inserted += slice.length;
  }
  console.log(`INSERTED ${inserted} into ${table}`);
}

(async () => {
  try {
    console.log('=== PHASE 1: DELETE EXISTING BAD ROWS (lessons 1-37 only) ===');
    await deleteByIds('liceu_theoretical_content', del.liceu_theoretical_content);
    await deleteByIds('liceu_exercises', del.liceu_exercises);
    await deleteByIds('liceu_flashcards', del.liceu_flashcards);

    console.log('\n=== PHASE 2: INSERT STAGED CONTENT ===');
    await insertBatch('liceu_theoretical_content', tc);
    await insertBatch('liceu_exercises', ex);
    await insertBatch('liceu_flashcards', fc);

    console.log('\n=== PHASE 3: VERIFY ===');
    for (const t of ['liceu_theoretical_content', 'liceu_exercises', 'liceu_flashcards']) {
      const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
      if (error) { console.log(`${t} count error: ${error.message}`); continue; }
      console.log(`${t} TOTAL ROWS NOW: ${count}`);
    }
    // Spot-check lesson 1
    const l1 = tc[0].lesson_id;
    const { data: c1 } = await supabase.from('liceu_theoretical_content').select('id, word_count').eq('lesson_id', l1);
    const { data: e1 } = await supabase.from('liceu_exercises').select('id').eq('lesson_id', l1);
    const { data: f1 } = await supabase.from('liceu_flashcards').select('id').eq('lesson_id', l1);
    console.log(`\nLesson 1 (${l1}): content=${c1?.length}, exercises=${e1?.length}, flashcards=${f1?.length}`);
    console.log('\nUPSERT COMPLETE.');
  } catch (e) {
    console.error('\nUPSERT FAILED:', e.message);
    process.exit(1);
  }
})();
