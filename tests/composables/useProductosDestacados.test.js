import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockRef = vi.hoisted(() => ({ actual: null }))

vi.mock('@/lib/supabase', async () => {
  const { crearSupabaseMock } = await import('../helpers/supabaseMock.js')
  mockRef.actual = crearSupabaseMock()
  return {
    supabase: mockRef.actual.supabase,
    BUCKET_IMAGENES: 'product-images',
    getPublicImageUrl: (p) => `https://cdn.test/${p}`,
  }
})

const storageMock = vi.hoisted(() => ({
  uploadImage: vi.fn(),
  deleteImage: vi.fn(),
}))

vi.mock('@/composables/useStorage', () => ({
  useStorage: () => storageMock,
}))

import { useProductosDestacados } from '@/composables/useProductosDestacados'

/** Devuelve los pasos de un builder como { metodo, arg } para aserciones legibles. */
function pasosDe(builder) {
  return builder.pasos.map((p) => ({ metodo: p.metodo, arg: p.args[0] }))
}

const datosBase = {
  nombre: '  Queso Palmito  ',
  descripcion: '',
  precio_referencia: '2500',
  unidad: 'kg',
  temporada: '',
  disponible: true,
  foto_url: '',
  fotoFile: null,
}

describe('useProductosDestacados', () => {
  beforeEach(() => {
    mockRef.actual.reiniciar()
    storageMock.uploadImage.mockReset().mockResolvedValue('productos/nueva.webp')
    storageMock.deleteImage.mockReset().mockResolvedValue(undefined)
  })

  describe('fetchProductos', () => {
    it('filtra por productor_id y ordena por nombre', async () => {
      mockRef.actual.responder('productos_destacados', { data: [{ id: 'pd1' }], error: null })
      const { fetchProductos, productos } = useProductosDestacados()
      await fetchProductos('prod-1')

      const [consulta] = mockRef.actual.consultasDe('productos_destacados')
      expect(consulta.eq).toHaveBeenCalledWith('productor_id', 'prod-1')
      expect(pasosDe(consulta)).toContainEqual({ metodo: 'order', arg: 'nombre' })
      expect(productos.value).toEqual([{ id: 'pd1' }])
    })

    it('sin id no consulta y deja la lista vacía', async () => {
      const { fetchProductos, productos } = useProductosDestacados()
      await fetchProductos(null)
      expect(mockRef.actual.consultasDe('productos_destacados')).toHaveLength(0)
      expect(productos.value).toEqual([])
    })

    it('expone el error de Supabase y deja la lista vacía', async () => {
      mockRef.actual.responder('productos_destacados', { data: null, error: { message: 'boom' } })
      const { fetchProductos, error, productos } = useProductosDestacados()
      await fetchProductos('prod-1')
      expect(error.value).toBe('boom')
      expect(productos.value).toEqual([])
    })
  })

  describe('crearProducto', () => {
    it('recorta el nombre, convierte el precio a número y los opcionales vacíos a null', async () => {
      mockRef.actual.responder('productos_destacados', { data: { id: 'pd1' }, error: null })
      const { crearProducto } = useProductosDestacados()
      await crearProducto('prod-1', { ...datosBase })

      const [consulta] = mockRef.actual.consultasDe('productos_destacados')
      expect(consulta.insert).toHaveBeenCalledWith({
        productor_id: 'prod-1',
        nombre: 'Queso Palmito',
        descripcion: null,
        precio_referencia: 2500,
        unidad: 'kg',
        temporada: null,
        disponible: true,
        foto_url: null,
      })
    })

    it('un precio vacío o no numérico se guarda como null', async () => {
      mockRef.actual.responder('productos_destacados', { data: { id: 'pd1' }, error: null })
      mockRef.actual.responder('productos_destacados', { data: { id: 'pd2' }, error: null })
      const { crearProducto } = useProductosDestacados()
      await crearProducto('prod-1', { ...datosBase, precio_referencia: '' })
      await crearProducto('prod-1', { ...datosBase, precio_referencia: 'gratis' })

      const consultas = mockRef.actual.consultasDe('productos_destacados')
      expect(consultas[0].insert.mock.calls[0][0].precio_referencia).toBeNull()
      expect(consultas[1].insert.mock.calls[0][0].precio_referencia).toBeNull()
    })

    it('sube la foto a la carpeta productos antes de insertar', async () => {
      mockRef.actual.responder('productos_destacados', { data: { id: 'pd1' }, error: null })
      const archivo = new File(['x'], 'q.webp', { type: 'image/webp' })
      const { crearProducto } = useProductosDestacados()
      await crearProducto('prod-1', { ...datosBase, fotoFile: archivo })

      expect(storageMock.uploadImage).toHaveBeenCalledWith(archivo, 'productos')
      const [consulta] = mockRef.actual.consultasDe('productos_destacados')
      expect(consulta.insert.mock.calls[0][0].foto_url).toBe('productos/nueva.webp')
    })

    it('borra la foto recién subida si el insert falla', async () => {
      mockRef.actual.responder('productos_destacados', { data: null, error: { message: 'no' } })
      const { crearProducto, error } = useProductosDestacados()
      const creado = await crearProducto('prod-1', {
        ...datosBase,
        fotoFile: new File(['x'], 'q.webp', { type: 'image/webp' }),
      })

      expect(creado).toBeNull()
      expect(error.value).toBe('no')
      expect(storageMock.deleteImage).toHaveBeenCalledWith('productos/nueva.webp')
    })
  })

  describe('actualizarProducto', () => {
    it('sube la nueva y borra la anterior tras un update exitoso', async () => {
      mockRef.actual.responder('productos_destacados', { data: { foto_url: 'productos/vieja.webp' }, error: null })
      mockRef.actual.responder('productos_destacados', { data: { id: 'pd1' }, error: null })
      const { actualizarProducto } = useProductosDestacados()
      await actualizarProducto('pd1', {
        ...datosBase,
        fotoFile: new File(['x'], 'q.webp', { type: 'image/webp' }),
      })

      expect(storageMock.uploadImage).toHaveBeenCalledWith(expect.any(File), 'productos')
      expect(storageMock.deleteImage).toHaveBeenCalledWith('productos/vieja.webp')
    })

    it('si el update falla, borra la foto nueva y conserva la anterior', async () => {
      mockRef.actual.responder('productos_destacados', { data: { foto_url: 'productos/vieja.webp' }, error: null })
      mockRef.actual.responder('productos_destacados', { data: null, error: { message: 'falló' } })
      const { actualizarProducto } = useProductosDestacados()
      const resultado = await actualizarProducto('pd1', {
        ...datosBase,
        fotoFile: new File(['x'], 'q.webp', { type: 'image/webp' }),
      })

      expect(resultado).toBeNull()
      expect(storageMock.deleteImage).toHaveBeenCalledWith('productos/nueva.webp')
      expect(storageMock.deleteImage).not.toHaveBeenCalledWith('productos/vieja.webp')
    })
  })

  describe('eliminarProducto', () => {
    it('borra la foto y quita el producto de la lista', async () => {
      mockRef.actual.responder('productos_destacados', { data: { foto_url: 'productos/v.webp' }, error: null })
      mockRef.actual.responder('productos_destacados', { data: null, error: null })
      const { eliminarProducto, productos } = useProductosDestacados()
      productos.value = [{ id: 'pd1' }, { id: 'pd2' }]

      const ok = await eliminarProducto('pd1')
      expect(ok).toBe(true)
      expect(storageMock.deleteImage).toHaveBeenCalledWith('productos/v.webp')
      expect(productos.value).toEqual([{ id: 'pd2' }])
    })

    it('devuelve false y no toca la foto si el delete falla', async () => {
      mockRef.actual.responder('productos_destacados', { data: { foto_url: 'productos/v.webp' }, error: null })
      mockRef.actual.responder('productos_destacados', { data: null, error: { message: 'no' } })
      const { eliminarProducto, productos } = useProductosDestacados()
      productos.value = [{ id: 'pd1' }]

      const ok = await eliminarProducto('pd1')
      expect(ok).toBe(false)
      expect(storageMock.deleteImage).not.toHaveBeenCalled()
      expect(productos.value).toEqual([{ id: 'pd1' }])
    })
  })
})
