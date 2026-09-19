/**
 * Utilidades para teléfonos de Costa Rica.
 *
 * Formato normalizado: 11 dígitos, código de país 506 seguido de los
 * 8 dígitos locales (ej: '50688884444'). Es el formato que exige wa.me.
 */

const CODIGO_PAIS = '506'

/**
 * Normaliza un teléfono al formato '506XXXXXXXX'.
 *
 * @param {string|null|undefined} texto - Teléfono tal como lo escribió el usuario
 * @returns {string|null} Teléfono normalizado, o null si no es válido
 */
export function normalizarTelefono(texto) {
  if (typeof texto !== 'string') return null

  const digitos = texto.replace(/\D/g, '')

  if (digitos.length === 8) {
    return `${CODIGO_PAIS}${digitos}`
  }

  if (digitos.length === 11 && digitos.startsWith(CODIGO_PAIS)) {
    return digitos
  }

  return null
}

/**
 * Indica si el texto corresponde a un teléfono costarricense válido.
 *
 * @param {string|null|undefined} texto
 * @returns {boolean}
 */
export function esTelefonoValido(texto) {
  return normalizarTelefono(texto) !== null
}

/**
 * Formatea un teléfono para mostrarlo en pantalla: '8888-4444'.
 * Si el valor no es válido, lo devuelve sin cambios (o '' si es null).
 *
 * @param {string|null|undefined} valor
 * @returns {string}
 */
export function formatearTelefono(valor) {
  const normalizado = normalizarTelefono(valor)
  if (!normalizado) return valor ?? ''

  const local = normalizado.slice(CODIGO_PAIS.length)
  return `${local.slice(0, 4)}-${local.slice(4)}`
}
