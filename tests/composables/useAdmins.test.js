import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockRef = vi.hoisted(() => ({ actual: null }))

vi.mock('@/lib/supabase', async () => {
  const { crearSupabaseMock } = await import('../helpers/supabaseMock.js')
  mockRef.actual = crearSupabaseMock()
  return { supabase: mockRef.actual.supabase }
})

import { useAdmins } from '@/composables/useAdmins'

describe('useAdmins', () => {
  beforeEach(() => {
    mockRef.actual.reiniciar()
  })

  describe('fetchAdmins', () => {
    it('trae nombre, rol y fecha, ordenados por nombre', async () => {
      mockRef.actual.responder('admin_profiles', {
        data: [{ id: 'u1', nombre_completo: 'Ana', rol: 'superadmin', created_at: '2026-01-01' }],
        error: null,
      })
      const { fetchAdmins, admins } = useAdmins()
      await fetchAdmins()

      const [consulta] = mockRef.actual.consultasDe('admin_profiles')
      expect(consulta.select).toHaveBeenCalledWith('id, nombre_completo, rol, created_at')
      expect(consulta.order).toHaveBeenCalledWith('nombre_completo', { ascending: true })
      expect(admins.value).toHaveLength(1)
    })

    it('expone el error y deja la lista vacía', async () => {
      mockRef.actual.responder('admin_profiles', { data: null, error: { message: 'denegado' } })
      const { fetchAdmins, admins, error } = useAdmins()
      await fetchAdmins()

      expect(error.value).toBe('denegado')
      expect(admins.value).toEqual([])
    })
  })

  describe('invitarAdmin', () => {
    it('invoca la Edge Function con el correo en minúsculas, el nombre y el rol', async () => {
      mockRef.actual.functions.invoke.mockResolvedValueOnce({
        data: { ok: true, id: 'u9', nombre_completo: 'Luis', rol: 'editor' },
        error: null,
      })
      const { invitarAdmin } = useAdmins()
      const ok = await invitarAdmin('  Luis@UCR.ac.cr ', '  Luis  ', 'editor')

      expect(ok).toBe(true)
      expect(mockRef.actual.functions.invoke).toHaveBeenCalledWith('invitar-admin', {
        body: { email: 'luis@ucr.ac.cr', nombre: 'Luis', rol: 'editor' },
      })
    })

    it('usa el mensaje del cuerpo de error devuelto por la función', async () => {
      mockRef.actual.functions.invoke.mockResolvedValueOnce({
        data: null,
        error: {
          message: 'Edge Function returned a non-2xx status code',
          context: { json: async () => ({ error: 'Ese correo ya tiene una cuenta.' }) },
        },
      })
      const { invitarAdmin, error } = useAdmins()
      const ok = await invitarAdmin('luis@ucr.ac.cr', 'Luis', 'editor')

      expect(ok).toBe(false)
      expect(error.value).toBe('Ese correo ya tiene una cuenta.')
    })

    it('cae al mensaje genérico si el cuerpo del error no es JSON', async () => {
      mockRef.actual.functions.invoke.mockResolvedValueOnce({
        data: null,
        error: {
          message: 'Failed to send a request to the Edge Function',
          context: { json: async () => { throw new Error('no es JSON') } },
        },
      })
      const { invitarAdmin, error } = useAdmins()
      const ok = await invitarAdmin('luis@ucr.ac.cr', 'Luis', 'editor')

      expect(ok).toBe(false)
      expect(error.value).toBe('Failed to send a request to the Edge Function')
    })

    it('rechaza correo o nombre vacíos sin invocar la función', async () => {
      const { invitarAdmin, error } = useAdmins()

      expect(await invitarAdmin('', 'Luis', 'editor')).toBe(false)
      expect(error.value).toBe('El correo es obligatorio.')

      expect(await invitarAdmin('luis@ucr.ac.cr', '  ', 'editor')).toBe(false)
      expect(error.value).toBe('El nombre es obligatorio.')

      expect(mockRef.actual.functions.invoke).not.toHaveBeenCalled()
    })
  })

  describe('eliminarAdmin', () => {
    it('borra por id y quita la fila de la lista', async () => {
      mockRef.actual.responder('admin_profiles', { data: [{ id: 'u1' }], error: null })
      const { eliminarAdmin, admins } = useAdmins()
      admins.value = [{ id: 'u1' }, { id: 'u2' }]

      const ok = await eliminarAdmin('u1')

      expect(ok).toBe(true)
      const [consulta] = mockRef.actual.consultasDe('admin_profiles')
      expect(consulta.delete).toHaveBeenCalled()
      expect(consulta.eq).toHaveBeenCalledWith('id', 'u1')
      expect(admins.value).toEqual([{ id: 'u2' }])
    })

    it('devuelve false y conserva la lista si el delete falla', async () => {
      mockRef.actual.responder('admin_profiles', { data: null, error: { message: 'denegado' } })
      const { eliminarAdmin, admins, error } = useAdmins()
      admins.value = [{ id: 'u1' }]

      const ok = await eliminarAdmin('u1')

      expect(ok).toBe(false)
      expect(error.value).toBe('denegado')
      expect(admins.value).toEqual([{ id: 'u1' }])
    })

    it('devuelve false y conserva la lista si RLS filtra la fila (0 filas borradas)', async () => {
      mockRef.actual.responder('admin_profiles', { data: [], error: null })
      const { eliminarAdmin, admins, error } = useAdmins()
      admins.value = [{ id: 'u1' }]

      const ok = await eliminarAdmin('u1')

      expect(ok).toBe(false)
      expect(error.value).toBe('No se pudo eliminar: el administrador ya no existe o no tiene permiso.')
      expect(admins.value).toEqual([{ id: 'u1' }])
    })
  })
})
