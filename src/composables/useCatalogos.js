/**
 * Composable para datos de catálogos (tablas de referencia).
 *
 * Provee acceso reactivo a los cantones y categorías de productos,
 * usados en filtros y formularios de la aplicación.
 */
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

/** Ordena una lista de catálogo por nombre, como lo hace la consulta. */
function ordenarPorNombre(lista) {
  return [...lista].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
}

export function useCatalogos() {
  // Estado reactivo para cantones y categorías
  const cantones = ref([])
  const categorias = ref([])
  const loading = ref(false)
  const error = ref(null)

  /**
   * Envuelve una operación de escritura con loading/error.
   * Devuelve `valorSiFalla` si lanza, dejando el motivo en `error`.
   */
  async function ejecutar(operacion, valorSiFalla) {
    loading.value = true
    error.value = null
    try {
      return await operacion()
    } catch (err) {
      error.value = err?.message || 'Ocurrió un error inesperado'
      console.error('[useCatalogos]', err)
      return valorSiFalla
    } finally {
      loading.value = false
    }
  }

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
        .select('id, nombre, icono')
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

  /**
   * Crea una categoría. El ícono no se personaliza por categoría: la
   * interfaz siempre muestra uno estándar para "alimentos" (🌾).
   * @param {string} nombre
   * @returns {Promise<Object|null>}
   */
  function crearCategoria(nombre) {
    return ejecutar(async () => {
      const limpio = (nombre ?? '').trim()
      if (!limpio) throw new Error('El nombre de la categoría es obligatorio.')

      const { data, error: insertError } = await supabase
        .from('categorias')
        .insert({ nombre: limpio, icono: null })
        .select('id, nombre, icono')
        .single()
      if (insertError) throw insertError

      categorias.value = ordenarPorNombre([...categorias.value, data])
      return data
    }, null)
  }

  /**
   * Cambia el nombre de una categoría.
   * @returns {Promise<Object|null>}
   */
  function renombrarCategoria(id, nombre) {
    return ejecutar(async () => {
      const limpio = (nombre ?? '').trim()
      if (!limpio) throw new Error('El nombre de la categoría es obligatorio.')

      const { data, error: updateError } = await supabase
        .from('categorias')
        .update({ nombre: limpio })
        .eq('id', id)
        .select('id, nombre, icono')
        .single()
      if (updateError) throw updateError

      categorias.value = ordenarPorNombre(
        categorias.value.map((c) => (c.id === id ? data : c))
      )
      return data
    }, null)
  }

  /**
   * Elimina una categoría, salvo que algún productor la use.
   * Se comprueba antes para dar un mensaje entendible en vez del error
   * genérico de clave foránea de Postgres.
   * @returns {Promise<boolean>}
   */
  function eliminarCategoria(id) {
    return ejecutar(async () => {
      const { count, error: countError } = await supabase
        .from('productor_categorias')
        .select('productor_id', { count: 'exact', head: true })
        .eq('categoria_id', id)
      if (countError) throw countError

      const enUso = count ?? 0
      if (enUso > 0) {
        throw new Error(`No se puede eliminar: ${enUso} productores usan esta categoría.`)
      }

      const { data, error: deleteError } = await supabase
        .from('categorias')
        .delete()
        .eq('id', id)
        .select()
      if (deleteError) throw deleteError
      if (!data || data.length === 0) {
        throw new Error('No se pudo eliminar: la categoría ya no existe o no tiene permiso.')
      }

      categorias.value = categorias.value.filter((c) => c.id !== id)
      return true
    }, false)
  }

  /**
   * Crea un cantón.
   * @returns {Promise<Object|null>}
   */
  function crearCanton(nombre) {
    return ejecutar(async () => {
      const limpio = (nombre ?? '').trim()
      if (!limpio) throw new Error('El nombre del cantón es obligatorio.')

      const { data, error: insertError } = await supabase
        .from('cantones')
        .insert({ nombre: limpio })
        .select('id, nombre')
        .single()
      if (insertError) throw insertError

      cantones.value = ordenarPorNombre([...cantones.value, data])
      return data
    }, null)
  }

  /**
   * Cambia el nombre de un cantón.
   * @returns {Promise<Object|null>}
   */
  function renombrarCanton(id, nombre) {
    return ejecutar(async () => {
      const limpio = (nombre ?? '').trim()
      if (!limpio) throw new Error('El nombre del cantón es obligatorio.')

      const { data, error: updateError } = await supabase
        .from('cantones')
        .update({ nombre: limpio })
        .eq('id', id)
        .select('id, nombre')
        .single()
      if (updateError) throw updateError

      cantones.value = ordenarPorNombre(
        cantones.value.map((c) => (c.id === id ? data : c))
      )
      return data
    }, null)
  }

  /**
   * Elimina un cantón, salvo que algún productor esté asignado a él.
   * @returns {Promise<boolean>}
   */
  function eliminarCanton(id) {
    return ejecutar(async () => {
      const { count, error: countError } = await supabase
        .from('productores')
        .select('id', { count: 'exact', head: true })
        .eq('canton_id', id)
      if (countError) throw countError

      const enUso = count ?? 0
      if (enUso > 0) {
        throw new Error(`No se puede eliminar: ${enUso} productores están en este cantón.`)
      }

      const { data, error: deleteError } = await supabase
        .from('cantones')
        .delete()
        .eq('id', id)
        .select()
      if (deleteError) throw deleteError
      if (!data || data.length === 0) {
        throw new Error('No se pudo eliminar: el cantón ya no existe o no tiene permiso.')
      }

      cantones.value = cantones.value.filter((c) => c.id !== id)
      return true
    }, false)
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
    crearCategoria,
    renombrarCategoria,
    eliminarCategoria,
    crearCanton,
    renombrarCanton,
    eliminarCanton,
  }
}
