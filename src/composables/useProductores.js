/**
 * Composable para operaciones CRUD de productores.
 *
 * Maneja la consulta, creación, actualización y eliminación de productores,
 * así como la subida de imágenes al almacenamiento de Supabase.
 */
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

export function useProductores() {
  // Estado reactivo
  const productores = ref([])
  const loading = ref(false)
  const error = ref(null)

  /**
   * Obtener la lista de productores con filtros opcionales.
   * Solo retorna productores activos para la vista pública.
   *
   * @param {Object} filters - Filtros opcionales
   * @param {number} filters.canton_id - Filtrar por cantón
   * @param {number} filters.categoria_id - Filtrar por categoría
   * @param {string} filters.search - Texto de búsqueda (busca en nombre_negocio)
   * @param {boolean} filters.onlyActive - Solo productores activos (por defecto: true)
   */
  async function fetchProductores(filters = {}) {
    loading.value = true
    error.value = null

    try {
      // Consulta base con relaciones
      let query = supabase
        .from('productores')
        .select(`
          *,
          canton:cantones(id, nombre),
          categorias:productor_categorias(
            categoria:categorias(id, nombre)
          )
        `)

      // Filtrar solo productores activos (por defecto para la vista pública)
      const onlyActive = filters.onlyActive !== undefined ? filters.onlyActive : true
      if (onlyActive) {
        query = query.eq('activo', true)
      }

      // Filtrar por cantón si se proporcionó
      if (filters.canton_id) {
        query = query.eq('canton_id', filters.canton_id)
      }

      // Filtrar por categoría a través de la tabla intermedia
      if (filters.categoria_id) {
        const { data: catRelations, error: catError } = await supabase
          .from('productor_categorias')
          .select('productor_id')
          .eq('categoria_id', filters.categoria_id)

        if (catError) throw catError

        const producerIds = catRelations?.map((r) => r.productor_id) || []

        // Si ningún productor tiene esta categoría, retornamos vacío de inmediato
        if (producerIds.length === 0) {
          productores.value = []
          return
        }

        query = query.in('id', producerIds)
      }

      // Búsqueda por texto en el nombre del negocio (case-insensitive)
      if (filters.search) {
        query = query.ilike('nombre_negocio', `%${filters.search}%`)
      }

      // Ordenar por nombre del negocio
      query = query.order('nombre_negocio', { ascending: true })

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      productores.value = data ?? []
    } catch (err) {
      error.value = err.message || 'Error al obtener los productores'
      console.error('[useProductores] Error en fetchProductores:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Obtener un productor por su ID con todas sus relaciones.
   *
   * @param {string|number} id - ID del productor
   * @returns {Object|null} Datos del productor o null si no se encontró
   */
  async function fetchProductorById(id) {
    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await supabase
        .from('productores')
        .select(`
          *,
          canton:cantones(id, nombre),
          categorias:productor_categorias(
            categoria:categorias(id, nombre)
          )
        `)
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      return data
    } catch (err) {
      error.value = err.message || 'Error al obtener el productor'
      console.error('[useProductores] Error en fetchProductorById:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Crear un nuevo productor con sus asociaciones de categorías.
   *
   * @param {Object} data - Datos del productor
   * @param {Array<number>} data.categoria_ids - IDs de las categorías a asociar
   * @returns {Object|null} Productor creado o null si hubo error
   */
  async function createProductor(data) {
    loading.value = true
    error.value = null

    try {
      // Separar los IDs de categorías del resto de los datos
      const { categoria_ids = [], ...productorData } = data

      // Insertar el productor
      const { data: newProductor, error: insertError } = await supabase
        .from('productores')
        .insert(productorData)
        .select()
        .single()

      if (insertError) throw insertError

      // Insertar las asociaciones de categorías si existen
      if (categoria_ids.length > 0) {
        const categoriasInsert = categoria_ids.map((catId) => ({
          productor_id: newProductor.id,
          categoria_id: catId,
        }))

        const { error: catError } = await supabase
          .from('productor_categorias')
          .insert(categoriasInsert)

        if (catError) throw catError
      }

      return newProductor
    } catch (err) {
      error.value = err.message || 'Error al crear el productor'
      console.error('[useProductores] Error en createProductor:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Actualizar un productor existente y re-asociar sus categorías.
   *
   * @param {string|number} id - ID del productor a actualizar
   * @param {Object} data - Datos actualizados
   * @param {Array<number>} data.categoria_ids - Nuevos IDs de categorías
   * @returns {Object|null} Productor actualizado o null si hubo error
   */
  async function updateProductor(id, data) {
    loading.value = true
    error.value = null

    try {
      // Separar los IDs de categorías del resto de los datos
      const { categoria_ids = [], ...productorData } = data

      // Actualizar los datos del productor
      const { data: updated, error: updateError } = await supabase
        .from('productores')
        .update(productorData)
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      // Re-asociar categorías: eliminar las existentes y crear las nuevas
      const { error: deleteError } = await supabase
        .from('productor_categorias')
        .delete()
        .eq('productor_id', id)

      if (deleteError) throw deleteError

      if (categoria_ids.length > 0) {
        const categoriasInsert = categoria_ids.map((catId) => ({
          productor_id: id,
          categoria_id: catId,
        }))

        const { error: catError } = await supabase
          .from('productor_categorias')
          .insert(categoriasInsert)

        if (catError) throw catError
      }

      return updated
    } catch (err) {
      error.value = err.message || 'Error al actualizar el productor'
      console.error('[useProductores] Error en updateProductor:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Eliminar un productor por su ID.
   *
   * @param {string|number} id - ID del productor a eliminar
   * @returns {boolean} true si se eliminó correctamente
   */
  async function deleteProductor(id) {
    loading.value = true
    error.value = null

    try {
      // Las asociaciones de categorías se eliminan automáticamente por CASCADE
      const { error: deleteError } = await supabase
        .from('productores')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      // Actualizar la lista local removiendo el productor eliminado
      productores.value = productores.value.filter((p) => p.id !== id)

      return true
    } catch (err) {
      error.value = err.message || 'Error al eliminar el productor'
      console.error('[useProductores] Error en deleteProductor:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Subir una imagen al bucket 'product-images' de Supabase Storage.
   *
   * @param {File} file - Archivo de imagen a subir
   * @returns {string|null} Ruta del archivo subido o null si hubo error
   */
  async function uploadImage(file) {
    loading.value = true
    error.value = null

    try {
      // Generar un nombre único para evitar colisiones
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `productores/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      return filePath
    } catch (err) {
      error.value = err.message || 'Error al subir la imagen'
      console.error('[useProductores] Error en uploadImage:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    // Estado reactivo
    productores,
    loading,
    error,

    // Métodos
    fetchProductores,
    fetchProductorById,
    createProductor,
    updateProductor,
    deleteProductor,
    uploadImage,
  }
}
