const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

(async () => {
  // Try to apply SQL via the supabase REST API
  // First, check if we can call a function that exists
  const sa = createClient(url, key, { auth: { persistSession: false } });

  // Check what functions are available
  const { data: funcs, error: funcErr } = await sa.rpc('get_tables');
  console.log('get_tables:', funcs, funcErr?.message);
  
  // Try to use the supabase management API with the service role key
  const projectRef = url.match(/https:\/\/([a-z0-9-]+)\.supabase\.co/)[1];
  console.log('Project ref:', projectRef);
  
  // The management API requires SUPABASE_ACCESS_TOKEN, not service role key.
  // Let's check if the env has the access token under a different name
  const env = process.env;
  const tokenKeys = Object.keys(env).filter(k => k.toLowerCase().includes('token') || k.toLowerCase().includes('access') || k.toLowerCase().includes('supabase'));
  console.log('Supabase env vars:', tokenKeys);
})();
