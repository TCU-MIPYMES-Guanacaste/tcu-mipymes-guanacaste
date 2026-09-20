import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockRef = vi.hoisted(() => ({ actual: null }))

vi.mock('@/lib/supabase', async () => {
  const { crearSupabaseMock } = await import('../helpers/supabaseMock.js')
  mockRef.actual = crearSupabaseMock()
  return { supabase: mockRef.actual.supabase, getPublicImageUrl: (p) => `https://cdn.test/${p}` }
})

import { useAuth, authReady } from '@/composables/useAuth'

const usuario = { id: 'u-1', email: 'admin@ucr.ac.cr' }

describe('useAuth', () => {
  beforeEach(async () => {
    await authReady
    mockRef.actual.reiniciar()
    useAuth().currentUser.value = null
  })

  it('registra el listener de sesión una sola vez al importar', () => {
    // El listener se registró al cargar el módulo (antes de reiniciar),
    // así que aquí no debe volver a registrarse aunque se llame useAuth() varias veces.
    useAuth()
    useAuth()
    expect(mockRef.actual.auth.onAuthStateChange).not.toHaveBeenCalled()
  })

  it('login guarda el usuario y limpia el error', async () => {
    mockRef.actual.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: usuario, session: {} },
      error: null,
    })
    const { login, currentUser, isAuthenticated, error } = useAuth()
    await login('admin@ucr.ac.cr', 'secreto')
    expect(currentUser.value).toEqual(usuario)
    expect(isAuthenticated.value).toBe(true)
    expect(error.value).toBeNull()
  })

  it('login traduce "Invalid login credentials" al español y relanza', async () => {
    mockRef.actual.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' },
    })
    const { login, error, currentUser } = useAuth()
    await expect(login('x@y.z', 'mal')).rejects.toBeTruthy()
    expect(error.value).toBe('Correo o contraseña incorrectos.')
    expect(currentUser.value).toBeNull()
  })

  it('logout limpia el usuario', async () => {
    const { logout, currentUser } = useAuth()
    currentUser.value = usuario
    await logout()
    expect(mockRef.actual.auth.signOut).toHaveBeenCalledTimes(1)
    expect(currentUser.value).toBeNull()
  })

  it('resetPassword usa la ruta /restablecer-contrasena del origen actual', async () => {
    const { resetPassword } = useAuth()
    await resetPassword('admin@ucr.ac.cr')
    expect(mockRef.actual.auth.resetPasswordForEmail).toHaveBeenCalledWith(
      'admin@ucr.ac.cr',
      { redirectTo: `${window.location.origin}/restablecer-contrasena` }
    )
  })

  it('updatePassword llama updateUser con la nueva contraseña', async () => {
    const { updatePassword } = useAuth()
    await updatePassword('nueva-clave-123')
    expect(mockRef.actual.auth.updateUser).toHaveBeenCalledWith({ password: 'nueva-clave-123' })
  })

  it('updatePassword expone el error traducido si la clave es débil', async () => {
    mockRef.actual.auth.updateUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Password should be at least 6 characters' },
    })
    const { updatePassword, error } = useAuth()
    await expect(updatePassword('123')).rejects.toBeTruthy()
    expect(error.value).toBe('La contraseña debe tener al menos 8 caracteres.')
  })

  describe('rol de administrador', () => {
    it('login carga el rol y esSuperadmin es true para un superadmin', async () => {
      mockRef.actual.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: usuario, session: {} },
        error: null,
      })
      mockRef.actual.responder('admin_profiles', { data: { rol: 'superadmin' }, error: null })

      const { login, adminRol, esSuperadmin } = useAuth()
      await login('admin@ucr.ac.cr', 'secreto')

      const [consulta] = mockRef.actual.consultasDe('admin_profiles')
      expect(consulta.eq).toHaveBeenCalledWith('id', 'u-1')
      expect(adminRol.value).toBe('superadmin')
      expect(esSuperadmin.value).toBe(true)
    })

    it('un editor deja esSuperadmin en false', async () => {
      mockRef.actual.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: usuario, session: {} },
        error: null,
      })
      mockRef.actual.responder('admin_profiles', { data: { rol: 'editor' }, error: null })

      const { login, adminRol, esSuperadmin } = useAuth()
      await login('editor@ucr.ac.cr', 'secreto')

      expect(adminRol.value).toBe('editor')
      expect(esSuperadmin.value).toBe(false)
    })

    it('si la consulta del rol falla, adminRol queda en null sin lanzar', async () => {
      mockRef.actual.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: usuario, session: {} },
        error: null,
      })
      mockRef.actual.responder('admin_profiles', { data: null, error: { message: 'denegado' } })

      const { login, adminRol, esSuperadmin, currentUser } = useAuth()
      await expect(login('admin@ucr.ac.cr', 'secreto')).resolves.toBeTruthy()

      expect(currentUser.value).toEqual(usuario)
      expect(adminRol.value).toBeNull()
      expect(esSuperadmin.value).toBe(false)
    })

    it('logout limpia el rol', async () => {
      mockRef.actual.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: usuario, session: {} },
        error: null,
      })
      mockRef.actual.responder('admin_profiles', { data: { rol: 'superadmin' }, error: null })

      const { login, logout, adminRol } = useAuth()
      await login('admin@ucr.ac.cr', 'secreto')
      expect(adminRol.value).toBe('superadmin')

      await logout()
      expect(adminRol.value).toBeNull()
    })
  })
})
