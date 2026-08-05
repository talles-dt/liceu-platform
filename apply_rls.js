const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const sa = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

(async () => {
  // Apply RLS policies for quiz tables
  const sql = `
    ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "quizzes_public_read" ON public.quizzes;
    CREATE POLICY "quizzes_public_read" ON public.quizzes
      FOR ALL
      USING (auth.uid() IS NOT NULL);

    ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "quiz_questions_public_read" ON public.quiz_questions;
    CREATE POLICY "quiz_questions_public_read" ON public.quiz_questions
      FOR ALL
      USING (auth.uid() IS NOT NULL);
  `;

  // Use the supabase client to execute raw SQL via the rpc function
  // Actually, we need to use the REST API or SQL editor
  // Let's try using the supabase-js with a raw SQL function
  
  const resp = await fetch(process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/rpc', {
    method: 'POST',
    headers: {
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': 'Bearer ' + process.env.SUPABASE_SERVICE_ROLE_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
  });
  console.log('RPC test:', resp.status, await resp.text());
})();
