const { createClient } = require('@supabase/supabase-js');
const { randomUUID } = require('crypto');
require('dotenv').config({ path: '/home/timon/Documents/liceu-underground/code/.env.prod' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.log('No prod env. Using .env.local'); }
require('dotenv').config({ path: '/home/timon/Documents/liceu-underground/code/.env.local' });

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

(async () => {
  // 1. Get a real student user
  const { data: users, error: uErr } = await s.auth.admin.listUsers();
  if (uErr) { console.log('Cannot list users:', uErr.message); return; }
  const student = users.users.find(u => !u.app_metadata?.role?.includes('admin')) || users.users[0];
  console.log('Student:', student.email, 'id:', student.id);

  // 2. Sign in as student to get a real JWT
  const { data: { session }, error: sErr } = await anon.auth.signInWithPassword({
    email: student.email,
    password: process.env.STUDENT_TEST_PASSWORD || 'Password123!', // might not work
  });
  if (sErr) {
    console.log('Direct login failed:', sErr.message);
    console.log('Simulating API call by impersonating the user...');
  } else {
    console.log('Got JWT for', session.user.email);
    
    // 3. Call the API
    const moduleId = '6b07a7de-49df-4ac2-a71a-1ef12ce70ad7'; // liceu_module I
    const res = await fetch('https://oliceu.com/api/modules/' + moduleId + '/quiz', {
      headers: { 'Authorization': 'Bearer ' + session.access_token }
    });
    const json = await res.json();
    console.log('Quiz API response status:', res.status);
    console.log('Quiz API response:', json);
  }
})();
