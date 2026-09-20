/**
 * Generación de enlaces de contacto por WhatsApp (wa.me).
 */
import { normalizarTelefono } from './telefono'

/**
 * Genera un enlace de WhatsApp con un mensaje predefinido en español.
 *
 * @param {string|null|undefined} telefono - Teléfono en cualquier formato aceptado por normalizarTelefono
 * @param {string} nombreNegocio - Nombre del negocio/productor
 * @returns {string} URL completa lista para abrir, o '' si el teléfono no es válido
 */
export function generarEnlaceWhatsApp(telefono, nombreNegocio) {
  const normalizado = normalizarTelefono(telefono)
  if (!normalizado) return ''

  const mensaje = encodeURIComponent(
    `Hola, encontré su negocio ${nombreNegocio} en el Directorio MIPYMES Guanacaste ` +
    `y me gustaría consultar sobre sus productos.`
  )

  return `https://wa.me/${normalizado}?text=${mensaje}`
}
