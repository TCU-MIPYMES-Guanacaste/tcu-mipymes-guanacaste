import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockRef = vi.hoisted(() => ({ actual: null }))

vi.mock('@/lib/supabase', async () => {
  const { crearSupabaseMock } = await import('../helpers/supabaseMock.js')
  mockRef.actual = crearSupabaseMock()
  return { supabase: mockRef.actual.supabase }
})

import { useContactos } from '@/composables/useContactos'

describe('useContactos', () => {
  beforeEach(() => {
    mockRef.actual.reiniciar()
    localStorage.clear()
  })

  describe('registrarContacto', () => {
    it('llama al RPC registrar_contacto con el id del productor', async () => {
      const { registrarContacto } = useContactos()
      await registrarContacto('prod-1')
      expect(mockRef.actual.supabase.rpc).toHaveBeenCalledWith('registrar_contacto', {
        p_productor_id: 'prod-1',
      })
    })

    it('no hace nada sin id', async () => {
      const { registrarContacto } = useContactos()
      await registrarContacto(null)
      await registrarContacto('')
      expect(mockRef.actual.supabase.rpc).not.toHaveBeenCalled()
    })

    it('nunca lanza aunque el RPC falle', async () => {
      mockRef.actual.supabase.rpc.mockRejectedValueOnce(new Error('sin red'))
      const { registrarContacto } = useContactos()
      await expect(registrarContacto('prod-1')).resolves.toBeUndefined()
    })

    it('nunca lanza aunque el RPC devuelva error', async () => {
      mockRef.actual.supabase.rpc.mockResolvedValueOnce({ data: null, error: { message: 'x' } })
      const { registrarContacto } = useContactos()
      await expect(registrarContacto('prod-1')).resolves.toBeUndefined()
    })

    it('omite el RPC si ya se registró ese productor hace menos de 60 s', async () => {
      const { registrarContacto } = useContactos()

      await registrarContacto('prod-1')
      expect(mockRef.actual.supabase.rpc).toHaveBeenCalledTimes(1)

      await registrarContacto('prod-1')
      expect(mockRef.actual.supabase.rpc).toHaveBeenCalledTimes(1)
    })

    it('el debounce es por productor: otro id sí registra', async () => {
      const { registrarContacto } = useContactos()

      await registrarContacto('prod-1')
      await registrarContacto('prod-2')

      expect(mockRef.actual.supabase.rpc).toHaveBeenCalledTimes(2)
      expect(mockRef.actual.supabase.rpc).toHaveBeenLastCalledWith('registrar_contacto', {
        p_productor_id: 'prod-2',
      })
    })

    it('vuelve a registrar cuando la marca anterior tiene más de 60 s', async () => {
      localStorage.setItem('contacto_ultimo_prod-1', String(Date.now() - 61_000))

      const { registrarContacto } = useContactos()
      await registrarContacto('prod-1')

      expect(mockRef.actual.supabase.rpc).toHaveBeenCalledTimes(1)
    })

    it('registra igual si localStorage no está disponible', async () => {
      const original = Object.getOwnPropertyDescriptor(window, 'localStorage')
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        get() {
          throw new Error('acceso denegado')
        },
      })

      try {
        const { registrarContacto } = useContactos()
        await expect(registrarContacto('prod-1')).resolves.toBeUndefined()
        expect(mockRef.actual.supabase.rpc).toHaveBeenCalledTimes(1)
      } finally {
        Object.defineProperty(window, 'localStorage', original)
      }
    })
  })

  describe('fetchResumenContactos', () => {
    it('agrupa por productor y calcula totales', async () => {
      mockRef.actual.responder('resumen_contactos_whatsapp', {
        data: [
          { productor_id: 'a', total: 5, ultimos_30_dias: 2 },
          { productor_id: 'b', total: 3, ultimos_30_dias: 3 },
        ],
        error: null,
      })
      const { fetchResumenContactos } = useContactos()
      const resumen = await fetchResumenContactos()

      expect(resumen.total).toBe(8)
      expect(resumen.ultimos30Dias).toBe(5)
      expect(resumen.porProductor.get('a')).toEqual({ productor_id: 'a', total: 5, ultimos_30_dias: 2 })
      expect(resumen.porProductor.has('zzz')).toBe(false)
    })

    it('devuelve ceros si no hay filas', async () => {
      mockRef.actual.responder('resumen_contactos_whatsapp', { data: [], error: null })
      const { fetchResumenContactos } = useContactos()
      const resumen = await fetchResumenContactos()
      expect(resumen.total).toBe(0)
      expect(resumen.ultimos30Dias).toBe(0)
      expect(resumen.porProductor.size).toBe(0)
    })

    it('lanza si Supabase devuelve error', async () => {
      mockRef.actual.responder('resumen_contactos_whatsapp', { data: null, error: { message: 'denegado' } })
      const { fetchResumenContactos } = useContactos()
      await expect(fetchResumenContactos()).rejects.toMatchObject({ message: 'denegado' })
    })
  })
})
