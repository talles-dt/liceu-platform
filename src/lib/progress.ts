import { supabase } from './supabase'

// Verifica se pode acessar módulo
export async function canAccessModule(userId: string, moduleId: string) {
  const { data: module } = await supabase
    .from('modules')
    .select('order_index, course_id')
    .eq('id', moduleId)
    .single()

  if (!module) return false

  const { data: previousModule } = await supabase
    .from('modules')
    .select('id')
    .eq('course_id', module.course_id)
    .lt('order_index', module.order_index)
    .order('order_index', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!previousModule) return true

  const { data: progress } = await supabase
    .from('module_progress')
    .select('completed')
    .eq('user_id', userId)
    .eq('module_id', previousModule.id)
    .single()

  return progress?.completed === true
}

// Completar módulo
export async function completeModule(userId: string, moduleId: string) {
  const { data } = await supabase.rpc('check_module_completion', {
    p_user: userId,
    p_module: moduleId
  })

  if (!data) return false

  await supabase
    .from('module_progress')
    .update({ completed: true })
    .eq('user_id', userId)
    .eq('module_id', moduleId)

  return true
}
