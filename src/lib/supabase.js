/**
 * Cliente de Supabase y funciones auxiliares.
 *
 * Inicializa la conexión con Supabase usando las variables de entorno
 * de Vite. Si faltan, lanza un error claro en vez de seguir con un
 * cliente roto (que solo produciría una pantalla en blanco).
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[Supabase] Faltan las variables VITE_SUPABASE_URL y/o VITE_SUPABASE_ANON_KEY. ' +
    'Copie el archivo .env.example a .env y complete los valores de su proyecto.'
  )
}

/** Nombre del bucket público de imágenes en Supabase Storage. */
export const BUCKET_IMAGENES = 'product-images'

/** Instancia única del cliente de Supabase. */
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Obtiene la URL pública de una imagen almacenada en el bucket de imágenes.
 *
 * @param {string} path - Ruta relativa dentro del bucket (ej: 'productores/123.webp')
 * @returns {string} URL pública, o '' si no hay ruta
 */
export function getPublicImageUrl(path) {
  if (!path) return ''

  const { data } = supabase.storage.from(BUCKET_IMAGENES).getPublicUrl(path)
  return data?.publicUrl ?? ''
}
