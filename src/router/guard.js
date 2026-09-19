/**
 * Guardia de navegación global.
 *
 * Separado del router para poder probarlo sin instanciar Vue Router
 * ni cargar las vistas.
 */
import { supabase } from '@/lib/supabase'

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

  if (to.name === 'login' && autenticado) {
    return { name: 'admin-dashboard' }
  }

  return true
}
