/**
 * Composable de autenticación.
 *
 * El estado del usuario es un singleton a nivel de módulo: la sesión
 * inicial y el listener de cambios se registran UNA sola vez al importar
 * este archivo, no en cada componente que llame useAuth().
 */
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

// --- Estado compartido ---
const currentUser = ref(null)

/**
 * Promesa que resuelve cuando se conoce la sesión inicial.
 * Útil para vistas que necesitan saber si hay sesión antes de renderizar.
 */
export const authReady = supabase.auth
  .getSession()
  .then(({ data: { session } }) => {
    currentUser.value = session?.user ?? null
    return currentUser.value
  })
  .catch(() => {
    currentUser.value = null
    return null
  })

// Mantener el estado sincronizado con login, logout y refresco de token
supabase.auth.onAuthStateChange((_event, session) => {
  currentUser.value = session?.user ?? null
})

/**
 * Traduce los mensajes de error más comunes de Supabase Auth al español.
 *
 * @param {string|undefined} mensaje
 * @returns {string}
 */
function traducirErrorAuth(mensaje = '') {
  const m = mensaje.toLowerCase()
  if (m.includes('invalid login credentials')) return 'Correo o contraseña incorrectos.'
  if (m.includes('email not confirmed')) return 'El correo aún no ha sido confirmado.'
  if (m.includes('password should be at least')) return 'La contraseña debe tener al menos 8 caracteres.'
  if (m.includes('rate limit') || m.includes('too many requests')) return 'Demasiados intentos. Espere unos minutos e intente de nuevo.'
  if (m.includes('same password')) return 'La nueva contraseña debe ser distinta a la anterior.'
  return mensaje || 'Ocurrió un error de autenticación.'
}

export function useAuth() {
  const loading = ref(false)
  const error = ref(null)

  const isAuthenticated = computed(() => !!currentUser.value)

  /**
   * Ejecuta una operación de auth manejando loading/error de forma uniforme.
   * Relanza el error para que la vista pueda decidir qué hacer.
   */
  async function ejecutar(operacion) {
    loading.value = true
    error.value = null
    try {
      return await operacion()
    } catch (err) {
      error.value = traducirErrorAuth(err?.message)
      throw err
    } finally {
      loading.value = false
    }
  }

  /** Iniciar sesión con correo y contraseña. */
  function login(email, password) {
    return ejecutar(async () => {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) throw authError
      currentUser.value = data.user
      return data
    })
  }

  /** Cerrar la sesión actual. */
  function logout() {
    return ejecutar(async () => {
      const { error: authError } = await supabase.auth.signOut()
      if (authError) throw authError
      currentUser.value = null
    })
  }

  /**
   * Enviar correo de recuperación de contraseña.
   * El enlace del correo lleva a /restablecer-contrasena.
   */
  function resetPassword(email) {
    return ejecutar(async () => {
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/restablecer-contrasena`,
      })
      if (authError) throw authError
    })
  }

  /** Cambiar la contraseña del usuario con sesión activa. */
  function updatePassword(nuevaContrasena) {
    return ejecutar(async () => {
      const { error: authError } = await supabase.auth.updateUser({ password: nuevaContrasena })
      if (authError) throw authError
    })
  }

  return {
    currentUser,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    resetPassword,
    updatePassword,
  }
}
