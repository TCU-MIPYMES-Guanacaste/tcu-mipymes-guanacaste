/**
 * Guardia de navegación global.
 *
 * Separado del router para poder probarlo sin instanciar Vue Router
 * ni cargar las vistas.
 */
import { supabase } from '@/lib/supabase'

/**
 * Consulta el rol del usuario directamente contra Supabase.
 *
 * No usa useAuth() a propósito: el guardia debe poder probarse sin montar
 * Vue ni depender del orden de carga de los composables.
 *
 * @param {string} userId
 * @returns {Promise<boolean>} false ante cualquier fallo (no se asume el permiso)
 */
async function esSuperadmin(userId) {
  try {
    const { data, error } = await supabase
      .from('admin_profiles')
      .select('rol')
      .eq('id', userId)
      .maybeSingle()
    if (error) return false
    return data?.rol === 'superadmin'
  } catch {
    return false
  }
}

/**
 * @param {import('vue-router').RouteLocationNormalized} to
 * @returns {Promise<true | import('vue-router').RouteLocationRaw>}
 */
export async function guardiaAutenticacion(to) {
  // Título de la pestaña: usa el meta.title más específico (el último de matched)
  const titulo = [...to.matched].reverse().find((r) => r.meta?.title)?.meta.title ?? to.meta?.title
  if (titulo) document.title = titulo

  const { data: { session } } = await supabase.auth.getSession()
  const autenticado = !!session

  // requiresAuth puede estar en la ruta o en cualquiera de sus padres
  const requiereAuth = to.matched.some((r) => r.meta?.requiresAuth)

  if (requiereAuth && !autenticado) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  // requiresSuperadmin: segunda barrera del lado del cliente. La de verdad
  // son las políticas RLS de admin_profiles (migración 003); esto solo evita
  // mostrar una pantalla que no serviría de nada.
  const requiereSuperadmin = to.matched.some((r) => r.meta?.requiresSuperadmin)

  if (requiereSuperadmin && autenticado) {
    if (!(await esSuperadmin(session.user.id))) {
      return { name: 'admin-dashboard' }
    }
  }

  if (to.name === 'login' && autenticado) {
    return { name: 'admin-dashboard' }
  }

  return true
}
