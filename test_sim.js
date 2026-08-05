const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

(async () => {
  // List users to find a student email
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  const student = authUsers.users.find(u => u.app_metadata?.role === 'user' || !u.app_metadata?.role);
  if (!student) { console.log('No student users found'); return; }
  console.log('Testing with student:', student.email);
  
  // We can't login without password, so just test the API logic simulation
  const moduleId = '6b07a7de-49df-4ac2-a71a-1ef12ce70ad7';
  console.log('Module I liceu_modules id:', moduleId);
  
  // Bridge simulation
  const { data: lmod } = await supabase.from('liceu_modules').select('order_index').eq('id', moduleId).maybeSingle();
  const { data: mod } = await supabase.from('modules').select('id').eq('order_index', lmod.order_index - 1).maybeSingle();
  const { data: quiz } = await supabase.from('quizzes').select('id').eq('module_id', mod.id).maybeSingle();
  const { data: qs, count } = await supabase.from('quiz_questions').select('*', { count: 'exact' }).eq('quiz_id', quiz.id);
  
  console.log('Quiz id:', quiz.id);
  console.log('Questions:', count);
  console.log('First question:', qs[0].question.slice(0, 80));
  console.log('Options:', JSON.stringify(qs[0].options).slice(0, 100));
})();
