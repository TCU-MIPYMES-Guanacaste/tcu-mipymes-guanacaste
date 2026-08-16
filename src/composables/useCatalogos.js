/**
 * Composable para datos de catálogos (tablas de referencia).
 *
 * Provee acceso reactivo a los cantones y categorías de productos,
 * usados en filtros y formularios de la aplicación.
 */
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

export function useCatalogos() {
  // Estado reactivo para cantones y categorías
  const cantones = ref([])
  const categorias = ref([])
  const loading = ref(false)
  const error = ref(null)

  /**
   * Obtener todos los cantones de Guanacaste.
   * Ordenados alfabéticamente por nombre.
   */
  async function fetchCantones() {
    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await supabase
        .from('cantones')
        .select('id, nombre')
        .order('nombre', { ascending: true })

      if (fetchError) throw fetchError

      cantones.value = data ?? []
    } catch (err) {
      error.value = err.message || 'Error al obtener los cantones'
      console.error('[useCatalogos] Error en fetchCantones:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Obtener todas las categorías de productos disponibles.
   * Ordenadas alfabéticamente por nombre.
   */
  async function fetchCategorias() {
    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await supabase
        .from('categorias')
        .select('id, nombre')
        .order('nombre', { ascending: true })

      if (fetchError) throw fetchError

      categorias.value = data ?? []
    } catch (err) {
      error.value = err.message || 'Error al obtener las categorías'
      console.error('[useCatalogos] Error en fetchCategorias:', err)
    } finally {
      loading.value = false
    }
  }

  return {
    // Estado reactivo
    cantones,
    categorias,
    loading,
    error,

    // Métodos
    fetchCantones,
    fetchCategorias,
  }
}
