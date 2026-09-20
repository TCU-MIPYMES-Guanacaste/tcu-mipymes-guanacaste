import { describe, it, expect } from 'vitest'
import {
  normalizarTelefono,
  esTelefonoValido,
  formatearTelefono,
} from '@/utils/telefono'

describe('normalizarTelefono', () => {
  it('antepone 506 a un número de 8 dígitos', () => {
    expect(normalizarTelefono('88884444')).toBe('50688884444')
  })

  it('acepta guion, espacios y paréntesis', () => {
    expect(normalizarTelefono('8888-4444')).toBe('50688884444')
    expect(normalizarTelefono('8888 4444')).toBe('50688884444')
    expect(normalizarTelefono('(8888) 4444')).toBe('50688884444')
  })

  it('acepta el código de país con y sin +', () => {
    expect(normalizarTelefono('+506 8888 4444')).toBe('50688884444')
    expect(normalizarTelefono('506 8888-4444')).toBe('50688884444')
    expect(normalizarTelefono('50688884444')).toBe('50688884444')
  })

  it('rechaza longitudes inválidas', () => {
    expect(normalizarTelefono('123')).toBeNull()
    expect(normalizarTelefono('1234567')).toBeNull()
    expect(normalizarTelefono('123456789')).toBeNull()
    expect(normalizarTelefono('1234567890123')).toBeNull()
  })

  it('rechaza 11 dígitos que no empiezan por 506', () => {
    expect(normalizarTelefono('12388884444')).toBeNull()
  })

  it('devuelve null para vacío, null y no-string', () => {
    expect(normalizarTelefono('')).toBeNull()
    expect(normalizarTelefono(null)).toBeNull()
    expect(normalizarTelefono(undefined)).toBeNull()
    expect(normalizarTelefono(88884444)).toBeNull()
  })
})

describe('esTelefonoValido', () => {
  it('es true solo cuando normaliza', () => {
    expect(esTelefonoValido('8888-4444')).toBe(true)
    expect(esTelefonoValido('+506 8888 4444')).toBe(true)
    expect(esTelefonoValido('123')).toBe(false)
    expect(esTelefonoValido('')).toBe(false)
  })
})

describe('formatearTelefono', () => {
  it('muestra el número local con guion', () => {
    expect(formatearTelefono('50688884444')).toBe('8888-4444')
  })

  it('formatea también entradas no normalizadas pero válidas', () => {
    expect(formatearTelefono('8888 4444')).toBe('8888-4444')
  })

  it('devuelve el valor sin cambios si no es válido', () => {
    expect(formatearTelefono('123')).toBe('123')
  })

  it('devuelve cadena vacía para null o undefined', () => {
    expect(formatearTelefono(null)).toBe('')
    expect(formatearTelefono(undefined)).toBe('')
  })
})
