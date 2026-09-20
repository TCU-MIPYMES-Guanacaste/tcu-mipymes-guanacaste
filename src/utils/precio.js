/**
 * Formato de precios de referencia de los productos destacados.
 *
 * Módulo puro: no toca Supabase ni el DOM.
 */

const FORMATO_CR = new Intl.NumberFormat('es-CR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

/**
 * Da formato a un precio de referencia en colones.
 *
 * @param {number|string|null|undefined} monto
 * @param {string} [unidad] - Unidad de venta (kg, litro, unidad...)
 * @returns {string} '₡2500 / kg', '₡2500' o '' si no hay un monto válido
 */
export function formatearPrecio(monto, unidad = '') {
  if (monto === null || monto === undefined || monto === '') return ''

  const numero = Number(monto)
  if (!Number.isFinite(numero)) return ''

  const texto = `₡${FORMATO_CR.format(numero)}`
  return unidad ? `${texto} / ${unidad}` : texto
}
