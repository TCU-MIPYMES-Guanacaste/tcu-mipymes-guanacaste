/**
 * Color de acento por categoría de alimento.
 *
 * Cada categoría real de la base de datos tiene un color propio dentro
 * de la paleta cálida del sitio (ninguno saturado/chillón). Una
 * categoría no contemplada (ej. si el TCU agrega una nueva) usa el
 * color de marca por defecto.
 */
export const CATEGORIA_COLORES = {
  'Frutas y Verduras':      { bg: '#3F6B37', texto: '#EAF3E4' },
  'Lácteos':                { bg: '#C79A3E', texto: '#3A2A0F' },
  'Carnes y Embutidos':     { bg: '#7A3226', texto: '#F5E3DC' },
  'Granos y Cereales':      { bg: '#8A7B3E', texto: '#FBF6E4' },
  'Miel y Derivados':       { bg: '#B9791E', texto: '#FFF2DC' },
  'Productos Artesanales':  { bg: '#9C5A3C', texto: '#F8EAE1' },
  'Condimentos y Especias': { bg: '#B5451F', texto: '#FCE8DD' },
  'Bebidas':                { bg: '#3C6B63', texto: '#E7F3EF' },
  'Panadería y Repostería': { bg: '#6B4226', texto: '#F3E6D8' },
}

const COLOR_POR_DEFECTO = { bg: '#8C3B26', texto: '#F7E9DF' }

/**
 * @param {string} nombreCategoria
 * @returns {{bg: string, texto: string}}
 */
export function colorDeCategoria(nombreCategoria) {
  return CATEGORIA_COLORES[nombreCategoria] ?? COLOR_POR_DEFECTO
}
