import { describe, it, expect } from 'vitest'
import { formatearPrecio } from '@/utils/precio'

// Intl.NumberFormat('es-CR') en esta versión de Node agrupa los miles desde
// 4 dígitos usando un espacio de no separación (U+00A0), no una coma. Estas
// pruebas reflejan lo que realmente devuelve el entorno (ver nota del brief).
const NBSP = ' '

describe('formatearPrecio', () => {
  it('devuelve el monto con símbolo de colón y separador de miles', () => {
    expect(formatearPrecio(2500)).toBe(`₡2${NBSP}500`)
  })

  it('agrega la unidad después de una barra', () => {
    expect(formatearPrecio(2500, 'kg')).toBe(`₡2${NBSP}500 / kg`)
  })

  it('acepta el monto como texto', () => {
    expect(formatearPrecio('1200', 'litro')).toBe(`₡1${NBSP}200 / litro`)
  })

  it('conserva los decimales cuando existen', () => {
    expect(formatearPrecio(1500.5)).toBe(`₡1${NBSP}500,5`)
  })

  it('devuelve cadena vacía si no hay monto', () => {
    expect(formatearPrecio(null)).toBe('')
    expect(formatearPrecio(undefined, 'kg')).toBe('')
    expect(formatearPrecio('')).toBe('')
  })

  it('devuelve cadena vacía si el monto no es numérico', () => {
    expect(formatearPrecio('gratis')).toBe('')
  })
})
