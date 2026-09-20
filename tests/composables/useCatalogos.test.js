import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockRef = vi.hoisted(() => ({ actual: null }))

vi.mock('@/lib/supabase', async () => {
  const { crearSupabaseMock } = await import('../helpers/supabaseMock.js')
  mockRef.actual = crearSupabaseMock()
  return { supabase: mockRef.actual.supabase }
})

import { useCatalogos } from '@/composables/useCatalogos'

describe('useCatalogos', () => {
  beforeEach(() => {
    mockRef.actual.reiniciar()
  })

  describe('crearCategoria', () => {
    it('inserta nombre e icono recortados y agrega la fila en orden alfabético', async () => {
      mockRef.actual.responder('categorias', { data: { id: 'c2', nombre: 'Lácteos', icono: '🧀' }, error: null })
      const { crearCategoria, categorias } = useCatalogos()
      categorias.value = [{ id: 'c1', nombre: 'Verduras', icono: '🥬' }]

      const creada = await crearCategoria('  Lácteos  ', ' 🧀 ')

      const [consulta] = mockRef.actual.consultasDe('categorias')
      expect(consulta.insert).toHaveBeenCalledWith({ nombre: 'Lácteos', icono: '🧀' })
      expect(creada).toEqual({ id: 'c2', nombre: 'Lácteos', icono: '🧀' })
      expect(categorias.value.map((c) => c.nombre)).toEqual(['Lácteos', 'Verduras'])
    })

    it('un icono vacío se guarda como el de respaldo (🏷️)', async () => {
      mockRef.actual.responder('categorias', { data: { id: 'c2', nombre: 'Miel', icono: '🏷️' }, error: null })
      const { crearCategoria } = useCatalogos()
      await crearCategoria('Miel', '')

      const [consulta] = mockRef.actual.consultasDe('categorias')
      expect(consulta.insert).toHaveBeenCalledWith({ nombre: 'Miel', icono: '🏷️' })
    })

    it('un nombre vacío no llega a Supabase y deja el error', async () => {
      const { crearCategoria, error } = useCatalogos()
      const creada = await crearCategoria('   ')

      expect(creada).toBeNull()
      expect(mockRef.actual.consultasDe('categorias')).toHaveLength(0)
      expect(error.value).toBe('El nombre de la categoría es obligatorio.')
    })

    it('expone el error de Supabase (por ejemplo, nombre duplicado)', async () => {
      mockRef.actual.responder('categorias', { data: null, error: { message: 'duplicate key value' } })
      const { crearCategoria, error } = useCatalogos()
      const creada = await crearCategoria('Miel')

      expect(creada).toBeNull()
      expect(error.value).toBe('duplicate key value')
    })
  })

  describe('renombrarCategoria', () => {
    it('actualiza nombre e icono por id y reemplaza la fila en la lista', async () => {
      mockRef.actual.responder('categorias', { data: { id: 'c1', nombre: 'Hortalizas', icono: '🥦' }, error: null })
      const { renombrarCategoria, categorias } = useCatalogos()
      categorias.value = [{ id: 'c1', nombre: 'Verduras', icono: '🥬' }]

      await renombrarCategoria('c1', '  Hortalizas ', ' 🥦 ')

      const [consulta] = mockRef.actual.consultasDe('categorias')
      expect(consulta.update).toHaveBeenCalledWith({ nombre: 'Hortalizas', icono: '🥦' })
      expect(consulta.eq).toHaveBeenCalledWith('id', 'c1')
      expect(categorias.value).toEqual([{ id: 'c1', nombre: 'Hortalizas', icono: '🥦' }])
    })

    it('un icono vacío se guarda como el de respaldo (🏷️)', async () => {
      mockRef.actual.responder('categorias', { data: { id: 'c1', nombre: 'Verduras', icono: '🏷️' }, error: null })
      const { renombrarCategoria } = useCatalogos()

      await renombrarCategoria('c1', 'Verduras', '')

      const [consulta] = mockRef.actual.consultasDe('categorias')
      expect(consulta.update).toHaveBeenCalledWith({ nombre: 'Verduras', icono: '🏷️' })
    })
  })

  describe('eliminarCategoria', () => {
    it('no elimina si hay productores usándola y explica cuántos', async () => {
      mockRef.actual.responder('productor_categorias', { data: null, count: 3, error: null })
      const { eliminarCategoria, error, categorias } = useCatalogos()
      categorias.value = [{ id: 'c1', nombre: 'Verduras' }]

      const ok = await eliminarCategoria('c1')

      expect(ok).toBe(false)
      expect(error.value).toBe('No se puede eliminar: 3 productores usan esta categoría.')
      expect(mockRef.actual.consultasDe('categorias')).toHaveLength(0)
      expect(categorias.value).toHaveLength(1)
    })

    it('elimina y quita la fila cuando no está en uso', async () => {
      mockRef.actual.responder('productor_categorias', { data: null, count: 0, error: null })
      mockRef.actual.responder('categorias', { data: [{ id: 'c1' }], error: null })
      const { eliminarCategoria, categorias } = useCatalogos()
      categorias.value = [{ id: 'c1', nombre: 'Verduras' }, { id: 'c2', nombre: 'Miel' }]

      const ok = await eliminarCategoria('c1')

      expect(ok).toBe(true)
      const [consulta] = mockRef.actual.consultasDe('categorias')
      expect(consulta.delete).toHaveBeenCalled()
      expect(consulta.eq).toHaveBeenCalledWith('id', 'c1')
      expect(categorias.value).toEqual([{ id: 'c2', nombre: 'Miel' }])
    })

    it('devuelve false y conserva la fila si RLS filtra el borrado (0 filas)', async () => {
      mockRef.actual.responder('productor_categorias', { data: null, count: 0, error: null })
      mockRef.actual.responder('categorias', { data: [], error: null })
      const { eliminarCategoria, categorias, error } = useCatalogos()
      categorias.value = [{ id: 'c1', nombre: 'Verduras' }]

      const ok = await eliminarCategoria('c1')

      expect(ok).toBe(false)
      expect(error.value).toBe('No se pudo eliminar: la categoría ya no existe o no tiene permiso.')
      expect(categorias.value).toEqual([{ id: 'c1', nombre: 'Verduras' }])
    })
  })

  describe('crearCanton', () => {
    it('inserta el nombre recortado y lo agrega en orden', async () => {
      mockRef.actual.responder('cantones', { data: { id: 'k2', nombre: 'Carrillo' }, error: null })
      const { crearCanton, cantones } = useCatalogos()
      cantones.value = [{ id: 'k1', nombre: 'Nicoya' }]

      await crearCanton('  Carrillo ')

      const [consulta] = mockRef.actual.consultasDe('cantones')
      expect(consulta.insert).toHaveBeenCalledWith({ nombre: 'Carrillo' })
      expect(cantones.value.map((c) => c.nombre)).toEqual(['Carrillo', 'Nicoya'])
    })

    it('un nombre vacío no llega a Supabase', async () => {
      const { crearCanton, error } = useCatalogos()
      const creado = await crearCanton('  ')
      expect(creado).toBeNull()
      expect(mockRef.actual.consultasDe('cantones')).toHaveLength(0)
      expect(error.value).toBe('El nombre del cantón es obligatorio.')
    })
  })

  describe('renombrarCanton', () => {
    it('actualiza por id y reemplaza la fila', async () => {
      mockRef.actual.responder('cantones', { data: { id: 'k1', nombre: 'Nicoya Centro' }, error: null })
      const { renombrarCanton, cantones } = useCatalogos()
      cantones.value = [{ id: 'k1', nombre: 'Nicoya' }]

      await renombrarCanton('k1', 'Nicoya Centro')

      const [consulta] = mockRef.actual.consultasDe('cantones')
      expect(consulta.update).toHaveBeenCalledWith({ nombre: 'Nicoya Centro' })
      expect(cantones.value).toEqual([{ id: 'k1', nombre: 'Nicoya Centro' }])
    })
  })

  describe('eliminarCanton', () => {
    it('no elimina si hay productores en ese cantón', async () => {
      mockRef.actual.responder('productores', { data: null, count: 2, error: null })
      const { eliminarCanton, error } = useCatalogos()

      const ok = await eliminarCanton('k1')

      expect(ok).toBe(false)
      expect(error.value).toBe('No se puede eliminar: 2 productores están en este cantón.')
      expect(mockRef.actual.consultasDe('cantones')).toHaveLength(0)
    })

    it('elimina y quita la fila cuando no está en uso', async () => {
      mockRef.actual.responder('productores', { data: null, count: 0, error: null })
      mockRef.actual.responder('cantones', { data: [{ id: 'k1' }], error: null })
      const { eliminarCanton, cantones } = useCatalogos()
      cantones.value = [{ id: 'k1', nombre: 'Nicoya' }]

      const ok = await eliminarCanton('k1')

      expect(ok).toBe(true)
      expect(cantones.value).toEqual([])
    })

    it('devuelve false y conserva la fila si RLS filtra el borrado (0 filas)', async () => {
      mockRef.actual.responder('productores', { data: null, count: 0, error: null })
      mockRef.actual.responder('cantones', { data: [], error: null })
      const { eliminarCanton, cantones, error } = useCatalogos()
      cantones.value = [{ id: 'k1', nombre: 'Nicoya' }]

      const ok = await eliminarCanton('k1')

      expect(ok).toBe(false)
      expect(error.value).toBe('No se pudo eliminar: el cantón ya no existe o no tiene permiso.')
      expect(cantones.value).toEqual([{ id: 'k1', nombre: 'Nicoya' }])
    })
  })
})
