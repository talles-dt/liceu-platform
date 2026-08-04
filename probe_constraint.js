const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/home/timon/Documents/liceu-underground/code/.env.local' });
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key, { auth: { persistSession: false } });

(async () => {
  // pg_get_constraintdef returns the CHECK clause text
  const { data, error } = await supabase.rpc('sql', { query: "SELECT pg_get_constraintdef((SELECT oid FROM pg_constraint WHERE conname='liceu_exercises_exercise_type_check')) AS def;" }).maybeSingle();
  if (error) {
    console.log('rpc sql not available:', error.message.split('\n')[0]);
    // Try a simpler approach: look at any existing non-case_analysis type by scanning all rows ever
    return;
  }
  console.log('CONSTRAINT DEF:', data?.def);
})();
