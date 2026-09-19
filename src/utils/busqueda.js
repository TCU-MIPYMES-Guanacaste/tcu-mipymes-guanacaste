/**
 * Limpieza del texto de búsqueda antes de enviarlo a Supabase.
 *
 * Los filtros `.or()` de PostgREST usan coma, paréntesis y los comodines
 * % y _ como sintaxis. Si el usuario los escribe, la consulta falla o
 * devuelve resultados inesperados, así que se reemplazan por espacios.
 * También se quita `*`, comodín equivalente a `%` en algunos buscadores
 * que los usuarios podrían escribir por costumbre.
 */

const LONGITUD_MAXIMA = 100

/**
 * @param {string|null|undefined} texto
 * @returns {string} Texto limpio, sin caracteres reservados, máximo 100 caracteres
 */
export function sanitizarBusqueda(texto) {
  if (typeof texto !== 'string') return ''

  return texto
    .replace(/[,()%_*]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, LONGITUD_MAXIMA)
    .trim()
}
