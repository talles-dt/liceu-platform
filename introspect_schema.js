const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/home/timon/Documents/liceu-underground/code/.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key, { auth: { persistSession: false } });

const tables = ['liceu_modules', 'liceu_lessons', 'liceu_theoretical_content', 'liceu_exercises', 'liceu_flashcards'];

(async () => {
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('*').limit(1);
    if (error) {
      console.log(`\n### ${t} -> ERROR: ${error.message}`);
      continue;
    }
    console.log(`\n### ${t}`);
    if (data && data.length > 0) {
      console.log('  columns:', Object.keys(data[0]).join(', '));
    } else {
      console.log('  (table empty — cannot infer columns from data)');
    }
  }
})();
