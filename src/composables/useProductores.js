/**
 * Composable para operaciones CRUD de productores.
 *
 * Consulta, crea, actualiza y elimina productores junto con sus categorías
 * y su foto. La subida/borrado físico de la foto lo hace useStorage.
 */
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useStorage } from '@/composables/useStorage'
import { normalizarTelefono } from '@/utils/telefono'
import { sanitizarBusqueda } from '@/utils/busqueda'

// Columnas y relaciones que se traen siempre al leer productores
const SELECT_PRODUCTOR = `
  *,
  canton:cantones(id, nombre),
  categorias:productor_categorias(
    categoria:categorias(id, nombre)
  )
`

// Campos de texto opcionales: si llegan vacíos se guardan como NULL
const CAMPOS_OPCIONALES = ['email', 'descripcion', 'direccion_detalle', 'foto_url']

/**
 * Separa los datos del formulario en: campos del productor (limpios),
 * ids de categorías y archivo de foto pendiente de subir.
 */
function prepararDatos(data) {
  const { categoria_ids = [], fotoFile = null, ...campos } = data
  const limpios = {}

  for (const [clave, valor] of Object.entries(campos)) {
    limpios[clave] = typeof valor === 'string' ? valor.trim() : valor
  }

  for (const clave of CAMPOS_OPCIONALES) {
    if (limpios[clave] === '') limpios[clave] = null
  }

  if (limpios.canton_id === '') limpios.canton_id = null

  if (limpios.telefono) {
    limpios.telefono = normalizarTelefono(limpios.telefono) ?? limpios.telefono
  }

  return { campos: limpios, categoria_ids, fotoFile }
}

export function useProductores() {
  const productores = ref([])
  const loading = ref(false)
  const error = ref(null)

  const { uploadImage, deleteImage } = useStorage()

  /** Envuelve una operación con loading/error; devuelve `valorSiFalla` si lanza. */
  async function ejecutar(operacion, valorSiFalla) {
    loading.value = true
    error.value = null
    try {
      return await operacion()
    } catch (err) {
      error.value = err?.message || 'Ocurrió un error inesperado'
      console.error('[useProductores]', err)
      return valorSiFalla
    } finally {
      loading.value = false
    }
  }

  /** Reemplaza las categorías de un productor por la lista indicada. */
  async function guardarCategorias(productorId, categoriaIds, { reemplazar }) {
    if (reemplazar) {
      const { error: deleteError } = await supabase
        .from('productor_categorias')
        .delete()
        .eq('productor_id', productorId)
      if (deleteError) throw deleteError
    }

    if (categoriaIds.length === 0) return

    const filas = categoriaIds.map((categoriaId) => ({
      productor_id: productorId,
      categoria_id: categoriaId,
    }))
    const { error: insertError } = await supabase.from('productor_categorias').insert(filas)
    if (insertError) throw insertError
  }

  /** Lee solo la ruta de la foto actual de un productor. */
  async function obtenerFotoActual(id) {
    const { data } = await supabase.from('productores').select('foto_url').eq('id', id).single()
    return data?.foto_url ?? null
  }

  /**
   * Lista productores con filtros opcionales.
   *
   * @param {Object} filters
   * @param {string} [filters.search]       - Texto a buscar en nombre y descripción
   * @param {string} [filters.canton_id]
   * @param {string} [filters.categoria_id]
   * @param {boolean} [filters.onlyActive]  - Solo activos (por defecto true)
   */
  async function fetchProductores(filters = {}) {
    const resultado = await ejecutar(async () => {
      const onlyActive = filters.onlyActive !== undefined ? filters.onlyActive : true

      // Filtro de categoría: Opción B (dos consultas). El spike de Opción A
      // (una sola consulta con !inner) no pudo ejecutarse porque el proyecto
      // de Supabase real está inaccesible.
      let query = supabase.from('productores').select(SELECT_PRODUCTOR)

      if (filters.categoria_id) {
        const { data: relaciones, error: catError } = await supabase
          .from('productor_categorias')
          .select('productor_id')
          .eq('categoria_id', filters.categoria_id)
        if (catError) throw catError

        const ids = relaciones?.map((r) => r.productor_id) ?? []
        if (ids.length === 0) return []
        query = query.in('id', ids)
      }

      if (onlyActive) {
        query = query.eq('activo', true)
      }

      if (filters.canton_id) {
        query = query.eq('canton_id', filters.canton_id)
      }

      const texto = sanitizarBusqueda(filters.search)
      if (texto) {
        query = query.or(`nombre_negocio.ilike.%${texto}%,descripcion.ilike.%${texto}%`)
      }

      query = query.order('nombre_negocio', { ascending: true })

      const { data, error: fetchError } = await query
      if (fetchError) throw fetchError

      return data ?? []
    }, [])

    productores.value = resultado
  }

  /**
   * Obtiene un productor por id con sus relaciones.
   * @returns {Promise<Object|null>}
   */
  function fetchProductorById(id) {
    return ejecutar(async () => {
      const { data, error: fetchError } = await supabase
        .from('productores')
        .select(SELECT_PRODUCTOR)
        .eq('id', id)
        .single()
      if (fetchError) throw fetchError
      return data
    }, null)
  }

  /**
   * Crea un productor. Si viene `fotoFile`, la sube primero.
   * @returns {Promise<Object|null>} Registro creado o null si falló
   */
  function createProductor(data) {
    return ejecutar(async () => {
      const { campos, categoria_ids, fotoFile } = prepararDatos(data)

      let fotoSubida = null
      if (fotoFile) {
        fotoSubida = await uploadImage(fotoFile)
        campos.foto_url = fotoSubida
      }

      const { data: nuevo, error: insertError } = await supabase
        .from('productores')
        .insert(campos)
        .select()
        .single()

      if (insertError) {
        // No dejar la foto huérfana si el registro no se creó
        if (fotoSubida) await deleteImage(fotoSubida)
        throw insertError
      }

      await guardarCategorias(nuevo.id, categoria_ids, { reemplazar: false })

      return nuevo
    }, null)
  }

  /**
   * Actualiza un productor y re-asocia sus categorías.
   * Sube la foto nueva si viene `fotoFile` y borra la anterior si cambió.
   * @returns {Promise<Object|null>}
   */
  function updateProductor(id, data) {
    return ejecutar(async () => {
      const { campos, categoria_ids, fotoFile } = prepararDatos(data)
      const fotoAnterior = await obtenerFotoActual(id)

      if (fotoFile) {
        campos.foto_url = await uploadImage(fotoFile)
      }

      const { data: actualizado, error: updateError } = await supabase
        .from('productores')
        .update(campos)
        .eq('id', id)
        .select()
        .single()
      if (updateError) throw updateError

      await guardarCategorias(id, categoria_ids, { reemplazar: true })

      if (fotoAnterior && fotoAnterior !== campos.foto_url) {
        await deleteImage(fotoAnterior)
      }

      return actualizado
    }, null)
  }

  /**
   * Elimina un productor y su foto. Las categorías se borran por CASCADE.
   * @returns {Promise<boolean>}
   */
  function deleteProductor(id) {
    return ejecutar(async () => {
      const foto = await obtenerFotoActual(id)

      const { error: deleteError } = await supabase.from('productores').delete().eq('id', id)
      if (deleteError) throw deleteError

      await deleteImage(foto)

      productores.value = productores.value.filter((p) => p.id !== id)
      return true
    }, false)
  }

  return {
    productores,
    loading,
    error,
    fetchProductores,
    fetchProductorById,
    createProductor,
    updateProductor,
    deleteProductor,
  }
}
