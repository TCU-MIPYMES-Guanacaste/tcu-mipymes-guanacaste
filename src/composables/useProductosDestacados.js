/**
 * Composable para los productos destacados de un productor.
 *
 * Mismo patrón que useProductores.js: estado reactivo, un envoltorio
 * `ejecutar` para loading/error y manejo de fotos sin dejar huérfanas
 * (sube antes de escribir, borra la anterior solo tras el éxito y borra
 * la nueva si la escritura falla).
 */
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useStorage } from '@/composables/useStorage'

// Carpeta propia dentro del mismo bucket que las fotos de productores
const CARPETA_PRODUCTOS = 'productos'

// Campos de texto opcionales: si llegan vacíos se guardan como NULL
const CAMPOS_OPCIONALES = ['descripcion', 'unidad', 'temporada', 'foto_url']

/**
 * Convierte el precio del formulario (texto) a número o NULL.
 * Un precio en blanco o no numérico se guarda como NULL: es un dato
 * orientativo y opcional, no debe bloquear el alta del producto.
 */
function normalizarPrecio(valor) {
  if (valor === '' || valor === null || valor === undefined) return null
  const numero = Number(valor)
  return Number.isFinite(numero) ? numero : null
}

/** Separa los campos del producto (limpios) del archivo de foto pendiente. */
function prepararDatos(data) {
  const { fotoFile = null, ...campos } = data
  const limpios = {}

  for (const [clave, valor] of Object.entries(campos)) {
    limpios[clave] = typeof valor === 'string' ? valor.trim() : valor
  }

  for (const clave of CAMPOS_OPCIONALES) {
    if (limpios[clave] === '') limpios[clave] = null
  }

  limpios.precio_referencia = normalizarPrecio(limpios.precio_referencia)
  limpios.disponible = limpios.disponible !== false

  return { campos: limpios, fotoFile }
}

export function useProductosDestacados() {
  const productos = ref([])
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
      console.error('[useProductosDestacados]', err)
      return valorSiFalla
    } finally {
      loading.value = false
    }
  }

  /** Lee solo la ruta de la foto actual de un producto. */
  async function obtenerFotoActual(id) {
    const { data, error: selectError } = await supabase
      .from('productos_destacados')
      .select('foto_url')
      .eq('id', id)
      .single()
    if (selectError) throw selectError
    return data?.foto_url ?? null
  }

  /**
   * Lista los productos de un productor, en orden alfabético.
   * @param {string} productorId
   * @returns {Promise<void>} El resultado queda en `productos`.
   */
  async function fetchProductos(productorId) {
    if (!productorId) {
      productos.value = []
      return
    }

    productos.value = await ejecutar(async () => {
      const { data, error: fetchError } = await supabase
        .from('productos_destacados')
        .select('*')
        .eq('productor_id', productorId)
        .order('nombre', { ascending: true })
      if (fetchError) throw fetchError
      return data ?? []
    }, [])
  }

  /**
   * Crea un producto. Si viene `fotoFile`, la sube primero.
   * @returns {Promise<Object|null>} Registro creado o null si falló
   */
  function crearProducto(productorId, datos) {
    return ejecutar(async () => {
      const { campos, fotoFile } = prepararDatos(datos)
      campos.productor_id = productorId

      let fotoSubida = null
      if (fotoFile) {
        fotoSubida = await uploadImage(fotoFile, CARPETA_PRODUCTOS)
        campos.foto_url = fotoSubida
      }

      const { data: nuevo, error: insertError } = await supabase
        .from('productos_destacados')
        .insert(campos)
        .select()
        .single()

      if (insertError) {
        // No dejar la foto huérfana si el registro no se creó
        if (fotoSubida) await deleteImage(fotoSubida)
        throw insertError
      }

      return nuevo
    }, null)
  }

  /**
   * Actualiza un producto. Sube la foto nueva si viene `fotoFile` y borra
   * la anterior solo si el update tuvo éxito y la ruta cambió.
   * @returns {Promise<Object|null>}
   */
  function actualizarProducto(id, datos) {
    return ejecutar(async () => {
      const { campos, fotoFile } = prepararDatos(datos)
      delete campos.productor_id
      const fotoAnterior = await obtenerFotoActual(id)

      let fotoNueva = null
      if (fotoFile) {
        fotoNueva = await uploadImage(fotoFile, CARPETA_PRODUCTOS)
        campos.foto_url = fotoNueva
      }

      const { data: actualizado, error: updateError } = await supabase
        .from('productos_destacados')
        .update(campos)
        .eq('id', id)
        .select()
        .single()

      if (updateError) {
        // El registro no cambió: la foto nueva quedaría huérfana
        if (fotoNueva) await deleteImage(fotoNueva)
        throw updateError
      }

      // El registro ya apunta a la foto nueva: la anterior sobra
      if (fotoAnterior && fotoAnterior !== campos.foto_url) {
        await deleteImage(fotoAnterior)
      }

      return actualizado
    }, null)
  }

  /**
   * Elimina un producto y su foto.
   * @returns {Promise<boolean>}
   */
  function eliminarProducto(id) {
    return ejecutar(async () => {
      const foto = await obtenerFotoActual(id)

      const { data, error: deleteError } = await supabase
        .from('productos_destacados')
        .delete()
        .eq('id', id)
        .select()
      if (deleteError) throw deleteError
      if (!data || data.length === 0) {
        throw new Error('No se pudo eliminar: el producto ya no existe o no tiene permiso.')
      }

      await deleteImage(foto)

      productos.value = productos.value.filter((p) => p.id !== id)
      return true
    }, false)
  }

  return {
    productos,
    loading,
    error,
    fetchProductos,
    crearProducto,
    actualizarProducto,
    eliminarProducto,
  }
}
