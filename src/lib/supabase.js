/**
 * Cliente de Supabase y funciones auxiliares.
 *
 * Este módulo inicializa la conexión con Supabase usando las variables
 * de entorno de Vite y exporta utilidades compartidas por toda la app.
 */
import { createClient } from '@supabase/supabase-js'

// Variables de entorno inyectadas por Vite en tiempo de compilación
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validar que las variables de entorno estén configuradas
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[Supabase] Las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY son requeridas. ' +
    'Consulta el archivo .env.example para más información.'
  )
}

// Instancia del cliente de Supabase (singleton)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Obtiene la URL pública de una imagen almacenada en el bucket 'product-images'.
 *
 * @param {string} path - Ruta relativa del archivo dentro del bucket
 * @returns {string} URL pública de la imagen
 */
export function getPublicImageUrl(path) {
  if (!path) return ''

  const { data } = supabase.storage
    .from('product-images')
    .getPublicUrl(path)

  return data?.publicUrl ?? ''
}

/**
 * Genera un enlace de WhatsApp (wa.me) con un mensaje predefinido en español.
 *
 * @param {string} phone - Número de teléfono con código de país (ej: '50688881234')
 * @param {string} producerName - Nombre del negocio/productor
 * @returns {string} URL completa de WhatsApp lista para abrir
 */
export function generateWhatsAppLink(phone, producerName) {
  // Limpiar el número de teléfono (remover espacios, guiones, paréntesis)
  const cleanPhone = phone.replace(/[\s\-()]/g, '')

  // Mensaje predefinido para el contacto inicial
  const message = encodeURIComponent(
    `Hola, encontré su negocio ${producerName} en el Directorio MIPYMES Guanacaste ` +
    `y me gustaría consultar sobre sus productos.`
  )

  return `https://wa.me/${cleanPhone}?text=${message}`
}
