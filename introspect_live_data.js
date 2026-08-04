const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/home/timon/Documents/liceu-underground/code/.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key, { auth: { persistSession: false } });

(async () => {
  const { data: modules, error: me } = await supabase
    .from('liceu_modules').select('id, code, title, order_index, is_active').order('order_index');
  if (me) { console.log('MODULES ERROR', me.message); return; }
  console.log('MODULES:', JSON.stringify(modules, null, 2));

  const { data: lessons, error: le } = await supabase
    .from('liceu_lessons').select('id, module_id, code, title, order_index, is_published').order('order_index');
  if (le) { console.log('LESSONS ERROR', le.message); return; }
  console.log('\nLESSONS COUNT:', lessons.length);
  for (const l of lessons) {
    console.log(`${l.order_index}\t${l.code}\t${l.module_id}\t${l.title}`);
  }
})();
