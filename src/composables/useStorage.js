/**
 * Composable de almacenamiento de imágenes en Supabase Storage.
 *
 * Única responsabilidad: subir y eliminar archivos del bucket de imágenes.
 * La compresión ocurre antes, en ImageUploader.vue.
 */
import { supabase, BUCKET_IMAGENES } from '@/lib/supabase'

const CARPETA_PRODUCTORES = 'productores'

export function useStorage() {
  /**
   * Sube una imagen con un nombre único y devuelve su ruta relativa.
   *
   * @param {File} file
   * @returns {Promise<string>} Ruta dentro del bucket (ej: 'productores/1700000000-ab12cd.webp')
   * @throws Error de Supabase si la subida falla
   */
  async function uploadImage(file) {
    const extension = (file.name.split('.').pop() || 'webp').toLowerCase()
    const nombreUnico = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extension}`
    const ruta = `${CARPETA_PRODUCTORES}/${nombreUnico}`

    const { error } = await supabase.storage
      .from(BUCKET_IMAGENES)
      .upload(ruta, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      })

    if (error) throw error

    return ruta
  }

  /**
   * Elimina una imagen del bucket. Nunca lanza: un fallo al borrar una
   * foto no debe impedir borrar o actualizar el productor.
   *
   * @param {string|null|undefined} ruta
   */
  async function deleteImage(ruta) {
    if (!ruta) return

    const { error } = await supabase.storage.from(BUCKET_IMAGENES).remove([ruta])

    if (error) {
      console.warn('[useStorage] No se pudo eliminar la imagen:', ruta, error.message)
    }
  }

  return { uploadImage, deleteImage }
}
