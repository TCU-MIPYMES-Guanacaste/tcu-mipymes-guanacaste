import { describe, it, expect } from 'vitest'
import { generarEnlaceWhatsApp } from '@/utils/whatsapp'

describe('generarEnlaceWhatsApp', () => {
  it('genera el enlace wa.me con código de país 506', () => {
    const enlace = generarEnlaceWhatsApp('8888-4444', 'Finca La Cosecha')
    expect(enlace.startsWith('https://wa.me/50688884444?text=')).toBe(true)
  })

  it('incluye el nombre del negocio en el mensaje codificado', () => {
    const enlace = generarEnlaceWhatsApp('88884444', 'Finca La Cosecha')
    const url = new URL(enlace)
    const mensaje = url.searchParams.get('text')
    expect(mensaje).toContain('Finca La Cosecha')
    expect(mensaje).toContain('Directorio MIPYMES Guanacaste')
  })

  it('codifica caracteres especiales del nombre', () => {
    const enlace = generarEnlaceWhatsApp('88884444', 'Queso & Miel "Doña Ñeca"')
    const url = new URL(enlace)
    expect(url.searchParams.get('text')).toContain('Queso & Miel "Doña Ñeca"')
    // El & literal no debe romper la query string
    expect(url.searchParams.has('text')).toBe(true)
    expect([...url.searchParams.keys()]).toEqual(['text'])
  })

  it('devuelve cadena vacía si el teléfono no es válido', () => {
    expect(generarEnlaceWhatsApp('123', 'Negocio')).toBe('')
    expect(generarEnlaceWhatsApp('', 'Negocio')).toBe('')
    expect(generarEnlaceWhatsApp(null, 'Negocio')).toBe('')
  })
})
