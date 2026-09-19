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

import { useStorage } from '@/composables/useStorage'

describe('useStorage', () => {
  beforeEach(() => {
    mockRef.actual.reiniciar()
  })

  describe('uploadImage', () => {
    it('sube a productores/<nombre único>.<ext> y devuelve la ruta', async () => {
      const archivo = new File(['x'], 'foto.webp', { type: 'image/webp' })
      const { uploadImage } = useStorage()
      const ruta = await uploadImage(archivo)

      expect(ruta).toMatch(/^productores\/\d+-[a-z0-9]+\.webp$/)
      expect(mockRef.actual.supabase.storage.from).toHaveBeenCalledWith('product-images')
      expect(mockRef.actual.storage.upload).toHaveBeenCalledWith(
        ruta,
        archivo,
        expect.objectContaining({ upsert: false, contentType: 'image/webp' })
      )
    })

    it('usa la extensión en minúsculas', async () => {
      const archivo = new File(['x'], 'FOTO.JPG', { type: 'image/jpeg' })
      const { uploadImage } = useStorage()
      const ruta = await uploadImage(archivo)
      expect(ruta.endsWith('.jpg')).toBe(true)
    })

    it('usa la extensión del tipo MIME aunque el nombre no tenga punto', async () => {
      const archivo = new File(['x'], 'IMG1234', { type: 'image/jpeg' })
      const { uploadImage } = useStorage()
      const ruta = await uploadImage(archivo)
      expect(ruta.endsWith('.jpg')).toBe(true)
    })

    it('cae a "bin" si el tipo es desconocido y el nombre no tiene extensión', async () => {
      const archivo = new File(['x'], 'archivo', { type: 'application/octet-stream' })
      const { uploadImage } = useStorage()
      const ruta = await uploadImage(archivo)
      expect(ruta.endsWith('.bin')).toBe(true)
    })

    it('lanza el error de Supabase si la subida falla', async () => {
      mockRef.actual.storage.upload.mockResolvedValueOnce({ data: null, error: new Error('cuota excedida') })
      const { uploadImage } = useStorage()
      await expect(uploadImage(new File(['x'], 'a.png', { type: 'image/png' }))).rejects.toThrow('cuota excedida')
    })
  })

  describe('deleteImage', () => {
    it('elimina la ruta indicada del bucket', async () => {
      const { deleteImage } = useStorage()
      await deleteImage('productores/abc.webp')
      expect(mockRef.actual.storage.remove).toHaveBeenCalledWith(['productores/abc.webp'])
    })

    it('no hace nada si la ruta está vacía', async () => {
      const { deleteImage } = useStorage()
      await deleteImage('')
      await deleteImage(null)
      expect(mockRef.actual.storage.remove).not.toHaveBeenCalled()
    })

    it('no lanza si Supabase devuelve error', async () => {
      mockRef.actual.storage.remove.mockResolvedValueOnce({ data: null, error: new Error('no existe') })
      const { deleteImage } = useStorage()
      await expect(deleteImage('productores/x.webp')).resolves.toBeUndefined()
    })
  })
})
