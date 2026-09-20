import { describe, it, expect } from 'vitest'
import { CATEGORIA_COLORES, colorDeCategoria } from '@/utils/categoriaColor'

describe('CATEGORIA_COLORES', () => {
  it('cubre las nueve categorías de la base de datos', () => {
    expect(Object.keys(CATEGORIA_COLORES)).toHaveLength(9)
  })

  it('cada categoría define fondo y color de texto', () => {
    for (const [nombre, color] of Object.entries(CATEGORIA_COLORES)) {
      expect(color, `falta bg/texto en "${nombre}"`).toEqual({
        bg: expect.stringMatching(/^#[0-9A-Fa-f]{6}$/),
        texto: expect.stringMatching(/^#[0-9A-Fa-f]{6}$/),
      })
    }
  })
})

describe('colorDeCategoria', () => {
  it('devuelve el color propio de cada categoría conocida', () => {
    expect(colorDeCategoria('Frutas y Verduras')).toEqual({ bg: '#3F6B37', texto: '#EAF3E4' })
    expect(colorDeCategoria('Lácteos')).toEqual({ bg: '#C79A3E', texto: '#3A2A0F' })
    expect(colorDeCategoria('Carnes y Embutidos')).toEqual({ bg: '#7A3226', texto: '#F5E3DC' })
    expect(colorDeCategoria('Granos y Cereales')).toEqual({ bg: '#8A7B3E', texto: '#FBF6E4' })
    expect(colorDeCategoria('Miel y Derivados')).toEqual({ bg: '#B9791E', texto: '#FFF2DC' })
    expect(colorDeCategoria('Productos Artesanales')).toEqual({ bg: '#9C5A3C', texto: '#F8EAE1' })
    expect(colorDeCategoria('Condimentos y Especias')).toEqual({ bg: '#B5451F', texto: '#FCE8DD' })
    expect(colorDeCategoria('Bebidas')).toEqual({ bg: '#3C6B63', texto: '#E7F3EF' })
    expect(colorDeCategoria('Panadería y Repostería')).toEqual({ bg: '#6B4226', texto: '#F3E6D8' })
  })

  it('usa el color de marca por defecto para una categoría no contemplada', () => {
    expect(colorDeCategoria('Categoría Nueva del TCU')).toEqual({ bg: '#8C3B26', texto: '#F7E9DF' })
  })

  it('usa el color por defecto para vacío, null o undefined', () => {
    expect(colorDeCategoria('')).toEqual({ bg: '#8C3B26', texto: '#F7E9DF' })
    expect(colorDeCategoria(null)).toEqual({ bg: '#8C3B26', texto: '#F7E9DF' })
    expect(colorDeCategoria(undefined)).toEqual({ bg: '#8C3B26', texto: '#F7E9DF' })
  })

  it('distingue mayúsculas y acentos: "lacteos" sin tilde no es "Lácteos"', () => {
    expect(colorDeCategoria('lacteos')).toEqual({ bg: '#8C3B26', texto: '#F7E9DF' })
  })
})
