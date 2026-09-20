import { describe, it, expect } from 'vitest'
import { sanitizarBusqueda } from '@/utils/busqueda'

describe('sanitizarBusqueda', () => {
  it('elimina caracteres con significado en filtros PostgREST', () => {
    expect(sanitizarBusqueda('queso,miel')).toBe('queso miel')
    expect(sanitizarBusqueda('finca (norte)')).toBe('finca norte')
    expect(sanitizarBusqueda('100%')).toBe('100')
    expect(sanitizarBusqueda('a_b')).toBe('a b')
  })

  it('elimina el asterisco', () => {
    expect(sanitizarBusqueda('que*so')).toBe('que so')
  })

  it('colapsa espacios múltiples y recorta extremos', () => {
    expect(sanitizarBusqueda('  queso    fresco  ')).toBe('queso fresco')
  })

  it('recorta a 100 caracteres', () => {
    const largo = 'a'.repeat(150)
    expect(sanitizarBusqueda(largo)).toHaveLength(100)
  })

  it('devuelve cadena vacía para vacío, null o no-string', () => {
    expect(sanitizarBusqueda('')).toBe('')
    expect(sanitizarBusqueda('   ')).toBe('')
    expect(sanitizarBusqueda(null)).toBe('')
    expect(sanitizarBusqueda(42)).toBe('')
  })

  it('conserva acentos y ñ', () => {
    expect(sanitizarBusqueda('Doña Ñeca café')).toBe('Doña Ñeca café')
  })
})
