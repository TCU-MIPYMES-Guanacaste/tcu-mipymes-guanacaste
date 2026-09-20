import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockRef = vi.hoisted(() => ({ actual: null }))

vi.mock('@/lib/supabase', async () => {
  const { crearSupabaseMock } = await import('../helpers/supabaseMock.js')
  mockRef.actual = crearSupabaseMock()
  return { supabase: mockRef.actual.supabase }
})

import { guardiaAutenticacion } from '@/router/guard'

/** Construye un objeto "to" mínimo como el que entrega Vue Router. */
function ruta({ name, fullPath, requiresAuth = false, title }) {
  return {
    name,
    fullPath,
    meta: { title },
    matched: [{ meta: { requiresAuth } }, { meta: {} }],
  }
}

function conSesion(activa) {
  mockRef.actual.auth.getSession.mockResolvedValueOnce({
    data: { session: activa ? { user: { id: 'u1' } } : null },
    error: null,
  })
}

describe('guardiaAutenticacion', () => {
  beforeEach(() => {
    mockRef.actual.reiniciar()
    document.title = ''
  })

  it('sin sesión, una ruta protegida redirige a login con redirect', async () => {
    conSesion(false)
    const destino = await guardiaAutenticacion(
      ruta({ name: 'producer-create', fullPath: '/admin/productores/nuevo', requiresAuth: true })
    )
    expect(destino).toEqual({ name: 'login', query: { redirect: '/admin/productores/nuevo' } })
  })

  it('una ruta hija hereda requiresAuth del padre (meta en matched[0])', async () => {
    conSesion(false)
    const to = {
      name: 'producer-edit',
      fullPath: '/admin/productores/1/editar',
      meta: {},
      matched: [{ meta: { requiresAuth: true } }, { meta: { title: 'Editar' } }],
    }
    const destino = await guardiaAutenticacion(to)
    expect(destino).toMatchObject({ name: 'login' })
  })

  it('con sesión, una ruta protegida se permite', async () => {
    conSesion(true)
    const destino = await guardiaAutenticacion(
      ruta({ name: 'admin-dashboard', fullPath: '/admin', requiresAuth: true })
    )
    expect(destino).toBe(true)
  })

  it('con sesión, /login redirige al panel', async () => {
    conSesion(true)
    const destino = await guardiaAutenticacion(ruta({ name: 'login', fullPath: '/login' }))
    expect(destino).toEqual({ name: 'admin-dashboard' })
  })

  it('con sesión, /restablecer-contrasena NO redirige', async () => {
    conSesion(true)
    const destino = await guardiaAutenticacion(
      ruta({ name: 'reset-password', fullPath: '/restablecer-contrasena' })
    )
    expect(destino).toBe(true)
  })

  it('sin sesión, una ruta pública se permite', async () => {
    conSesion(false)
    const destino = await guardiaAutenticacion(ruta({ name: 'home', fullPath: '/' }))
    expect(destino).toBe(true)
  })

  it('actualiza document.title con meta.title', async () => {
    conSesion(false)
    await guardiaAutenticacion(ruta({ name: 'home', fullPath: '/', title: 'Inicio' }))
    expect(document.title).toBe('Inicio')
  })

  describe('requiresSuperadmin', () => {
    /** Ruta admin protegida que además exige superadmin. */
    function rutaSuperadmin() {
      return {
        name: 'admins',
        fullPath: '/admin/administradores',
        meta: {},
        matched: [
          { meta: { requiresAuth: true } },
          { meta: { title: 'Administradores', requiresSuperadmin: true } },
        ],
      }
    }

    it('con sesión de superadmin, permite el paso', async () => {
      conSesion(true)
      mockRef.actual.responder('admin_profiles', { data: { rol: 'superadmin' }, error: null })

      const destino = await guardiaAutenticacion(rutaSuperadmin())

      const [consulta] = mockRef.actual.consultasDe('admin_profiles')
      expect(consulta.eq).toHaveBeenCalledWith('id', 'u1')
      expect(destino).toBe(true)
    })

    it('con sesión de editor, redirige al panel', async () => {
      conSesion(true)
      mockRef.actual.responder('admin_profiles', { data: { rol: 'editor' }, error: null })

      const destino = await guardiaAutenticacion(rutaSuperadmin())
      expect(destino).toEqual({ name: 'admin-dashboard' })
    })

    it('si la consulta del rol falla, redirige al panel (no se asume el permiso)', async () => {
      conSesion(true)
      mockRef.actual.responder('admin_profiles', { data: null, error: { message: 'denegado' } })

      const destino = await guardiaAutenticacion(rutaSuperadmin())
      expect(destino).toEqual({ name: 'admin-dashboard' })
    })

    it('sin sesión, una ruta de superadmin manda a login, no al panel', async () => {
      conSesion(false)
      const destino = await guardiaAutenticacion(rutaSuperadmin())
      expect(destino).toMatchObject({ name: 'login' })
      expect(mockRef.actual.consultasDe('admin_profiles')).toHaveLength(0)
    })
  })
})
