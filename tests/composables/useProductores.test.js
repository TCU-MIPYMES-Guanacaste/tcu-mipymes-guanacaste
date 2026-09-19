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

import { useProductores } from '@/composables/useProductores'

/** Devuelve los pasos de un builder como "metodo(arg0)" para aserciones legibles. */
function pasosDe(builder) {
  return builder.pasos.map((p) => ({ metodo: p.metodo, arg: p.args[0] }))
}

const datosBase = {
  nombre_negocio: '  Finca La Cosecha  ',
  nombre_contacto: 'Ana',
  telefono: '8888-4444',
  email: '',
  descripcion: '',
  canton_id: 'canton-1',
  direccion_detalle: '',
  foto_url: '',
  activo: true,
  categoria_ids: ['cat-1', 'cat-2'],
  fotoFile: null,
}

describe('useProductores', () => {
  beforeEach(() => {
    mockRef.actual.reiniciar()
    storageMock.uploadImage.mockReset().mockResolvedValue('productores/nueva.webp')
    storageMock.deleteImage.mockReset().mockResolvedValue(undefined)
  })

  describe('fetchProductores', () => {
    it('por defecto filtra activos y ordena por nombre', async () => {
      mockRef.actual.responder('productores', { data: [{ id: 'p1' }], error: null })
      const { fetchProductores, productores } = useProductores()
      await fetchProductores()

      const [consulta] = mockRef.actual.consultasDe('productores')
      expect(pasosDe(consulta)).toContainEqual({ metodo: 'eq', arg: 'activo' })
      expect(pasosDe(consulta)).toContainEqual({ metodo: 'order', arg: 'nombre_negocio' })
      expect(productores.value).toEqual([{ id: 'p1' }])
    })

    it('con onlyActive=false no filtra por activo', async () => {
      const { fetchProductores } = useProductores()
      await fetchProductores({ onlyActive: false })
      const [consulta] = mockRef.actual.consultasDe('productores')
      expect(consulta.eq).not.toHaveBeenCalledWith('activo', true)
    })

    it('la búsqueda usa .or sobre nombre_negocio y descripcion con texto sanitizado', async () => {
      const { fetchProductores } = useProductores()
      await fetchProductores({ search: 'queso, (fresco)' })
      const [consulta] = mockRef.actual.consultasDe('productores')
      expect(consulta.or).toHaveBeenCalledWith(
        'nombre_negocio.ilike.%queso fresco%,descripcion.ilike.%queso fresco%'
      )
    })

    it('una búsqueda vacía o solo con símbolos no aplica .or', async () => {
      const { fetchProductores } = useProductores()
      await fetchProductores({ search: '  ,,()  ' })
      const [consulta] = mockRef.actual.consultasDe('productores')
      expect(consulta.or).not.toHaveBeenCalled()
    })

    it('filtra por cantón', async () => {
      const { fetchProductores } = useProductores()
      await fetchProductores({ canton_id: 'canton-9' })
      const [consulta] = mockRef.actual.consultasDe('productores')
      expect(consulta.eq).toHaveBeenCalledWith('canton_id', 'canton-9')
    })

    it('expone el error de Supabase', async () => {
      mockRef.actual.responder('productores', { data: null, error: { message: 'boom' } })
      const { fetchProductores, error, productores } = useProductores()
      await fetchProductores()
      expect(error.value).toBe('boom')
      expect(productores.value).toEqual([])
    })
  })

  describe('createProductor', () => {
    it('limpia strings, convierte vacíos a null y normaliza el teléfono', async () => {
      mockRef.actual.responder('productores', { data: { id: 'nuevo' }, error: null })
      const { createProductor } = useProductores()
      await createProductor(datosBase)

      const [insercion] = mockRef.actual.consultasDe('productores')
      expect(insercion.insert).toHaveBeenCalledWith({
        nombre_negocio: 'Finca La Cosecha',
        nombre_contacto: 'Ana',
        telefono: '50688884444',
        email: null,
        descripcion: null,
        canton_id: 'canton-1',
        direccion_detalle: null,
        foto_url: null,
        activo: true,
      })
    })

    it('inserta las categorías asociadas', async () => {
      mockRef.actual.responder('productores', { data: { id: 'nuevo' }, error: null })
      const { createProductor } = useProductores()
      await createProductor(datosBase)

      const [relaciones] = mockRef.actual.consultasDe('productor_categorias')
      expect(relaciones.insert).toHaveBeenCalledWith([
        { productor_id: 'nuevo', categoria_id: 'cat-1' },
        { productor_id: 'nuevo', categoria_id: 'cat-2' },
      ])
    })

    it('sube la foto antes de insertar y guarda su ruta', async () => {
      mockRef.actual.responder('productores', { data: { id: 'nuevo' }, error: null })
      const archivo = new File(['x'], 'f.webp', { type: 'image/webp' })
      const { createProductor } = useProductores()
      await createProductor({ ...datosBase, fotoFile: archivo })

      expect(storageMock.uploadImage).toHaveBeenCalledWith(archivo)
      const [insercion] = mockRef.actual.consultasDe('productores')
      expect(insercion.insert.mock.calls[0][0].foto_url).toBe('productores/nueva.webp')
    })

    it('si el insert falla después de subir la foto, la borra y devuelve null', async () => {
      mockRef.actual.responder('productores', { data: null, error: { message: 'falló' } })
      const { createProductor, error } = useProductores()
      const resultado = await createProductor({ ...datosBase, fotoFile: new File(['x'], 'f.webp') })

      expect(resultado).toBeNull()
      expect(error.value).toBe('falló')
      expect(storageMock.deleteImage).toHaveBeenCalledWith('productores/nueva.webp')
    })
  })

  describe('updateProductor', () => {
    it('borra la foto anterior si cambió', async () => {
      mockRef.actual.responder('productores', { data: { foto_url: 'productores/vieja.webp' }, error: null }) // select foto_url
      mockRef.actual.responder('productores', { data: { id: 'p1' }, error: null })                          // update
      const { updateProductor } = useProductores()
      await updateProductor('p1', { ...datosBase, fotoFile: new File(['x'], 'n.webp') })

      expect(storageMock.uploadImage).toHaveBeenCalled()
      expect(storageMock.deleteImage).toHaveBeenCalledWith('productores/vieja.webp')
    })

    it('no borra la foto si es la misma', async () => {
      mockRef.actual.responder('productores', { data: { foto_url: 'productores/misma.webp' }, error: null })
      mockRef.actual.responder('productores', { data: { id: 'p1' }, error: null })
      const { updateProductor } = useProductores()
      await updateProductor('p1', { ...datosBase, foto_url: 'productores/misma.webp', fotoFile: null })

      expect(storageMock.uploadImage).not.toHaveBeenCalled()
      expect(storageMock.deleteImage).not.toHaveBeenCalled()
    })

    it('borra la foto anterior si el usuario la quitó sin poner otra', async () => {
      mockRef.actual.responder('productores', { data: { foto_url: 'productores/vieja.webp' }, error: null })
      mockRef.actual.responder('productores', { data: { id: 'p1' }, error: null })
      const { updateProductor } = useProductores()
      await updateProductor('p1', { ...datosBase, foto_url: '', fotoFile: null })

      expect(storageMock.deleteImage).toHaveBeenCalledWith('productores/vieja.webp')
      const [, actualizacion] = mockRef.actual.consultasDe('productores')
      expect(actualizacion.update.mock.calls[0][0].foto_url).toBeNull()
    })

    it('reemplaza las categorías (delete + insert)', async () => {
      mockRef.actual.responder('productores', { data: { foto_url: null }, error: null })
      mockRef.actual.responder('productores', { data: { id: 'p1' }, error: null })
      const { updateProductor } = useProductores()
      await updateProductor('p1', datosBase)

      const [borrado, insercion] = mockRef.actual.consultasDe('productor_categorias')
      expect(borrado.delete).toHaveBeenCalled()
      expect(borrado.eq).toHaveBeenCalledWith('productor_id', 'p1')
      expect(insercion.insert).toHaveBeenCalledWith([
        { productor_id: 'p1', categoria_id: 'cat-1' },
        { productor_id: 'p1', categoria_id: 'cat-2' },
      ])
    })

    it('si el update falla después de subir la foto nueva, la borra y no toca la anterior', async () => {
      mockRef.actual.responder('productores', { data: { foto_url: 'productores/vieja.webp' }, error: null })
      mockRef.actual.responder('productores', { data: null, error: { message: 'falló' } })
      const { updateProductor, error } = useProductores()
      const resultado = await updateProductor('p1', { ...datosBase, fotoFile: new File(['x'], 'n.webp') })

      expect(resultado).toBeNull()
      expect(error.value).toBe('falló')
      expect(storageMock.deleteImage).toHaveBeenCalledWith('productores/nueva.webp')
      expect(storageMock.deleteImage).not.toHaveBeenCalledWith('productores/vieja.webp')
    })

    it('si fallan las categorías después del update, la foto anterior ya fue borrada', async () => {
      mockRef.actual.responder('productores', { data: { foto_url: 'productores/vieja.webp' }, error: null })
      mockRef.actual.responder('productores', { data: { id: 'p1' }, error: null })
      mockRef.actual.responder('productor_categorias', { data: null, error: { message: 'cat falló' } })
      const { updateProductor, error } = useProductores()
      const resultado = await updateProductor('p1', { ...datosBase, fotoFile: new File(['x'], 'n.webp') })

      expect(resultado).toBeNull()
      expect(error.value).toBe('cat falló')
      expect(storageMock.deleteImage).toHaveBeenCalledWith('productores/vieja.webp')
      expect(storageMock.deleteImage).not.toHaveBeenCalledWith('productores/nueva.webp')
    })
  })

  describe('deleteProductor', () => {
    it('borra el registro y luego su foto', async () => {
      mockRef.actual.responder('productores', { data: { foto_url: 'productores/x.webp' }, error: null })
      mockRef.actual.responder('productores', { data: null, error: null })
      const { deleteProductor } = useProductores()
      const ok = await deleteProductor('p1')

      expect(ok).toBe(true)
      expect(storageMock.deleteImage).toHaveBeenCalledWith('productores/x.webp')
    })

    it('quita el productor de la lista local', async () => {
      mockRef.actual.responder('productores', { data: { foto_url: null }, error: null })
      mockRef.actual.responder('productores', { data: null, error: null })
      const { deleteProductor, productores } = useProductores()
      productores.value = [{ id: 'p1' }, { id: 'p2' }]
      await deleteProductor('p1')
      expect(productores.value).toEqual([{ id: 'p2' }])
    })

    it('devuelve false y no toca la foto si el delete falla', async () => {
      mockRef.actual.responder('productores', { data: { foto_url: 'productores/x.webp' }, error: null })
      mockRef.actual.responder('productores', { data: null, error: { message: 'no' } })
      const { deleteProductor, error } = useProductores()
      const ok = await deleteProductor('p1')

      expect(ok).toBe(false)
      expect(error.value).toBe('no')
      expect(storageMock.deleteImage).not.toHaveBeenCalled()
    })
  })
})
