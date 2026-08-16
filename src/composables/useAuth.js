/**
 * Composable de autenticación.
 *
 * Provee el estado reactivo del usuario actual, métodos de inicio/cierre
 * de sesión, y un listener para cambios en el estado de autenticación.
 */
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'

// Estado compartido fuera de la función para que sea un singleton
const currentUser = ref(null)

export function useAuth() {
  // Estado de carga y errores
  const loading = ref(false)
  const error = ref(null)

  // Propiedad computada que indica si hay un usuario autenticado
  const isAuthenticated = computed(() => !!currentUser.value)

  /**
   * Iniciar sesión con correo electrónico y contraseña.
   *
   * @param {string} email - Correo electrónico del administrador
   * @param {string} password - Contraseña
   * @returns {Object} Datos del usuario autenticado
   */
  async function login(email, password) {
    loading.value = true
    error.value = null

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        throw authError
      }

      currentUser.value = data.user
      return data
    } catch (err) {
      error.value = err.message || 'Error al iniciar sesión'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Cerrar la sesión actual del usuario.
   */
  async function logout() {
    loading.value = true
    error.value = null

    try {
      const { error: authError } = await supabase.auth.signOut()

      if (authError) {
        throw authError
      }

      currentUser.value = null
    } catch (err) {
      error.value = err.message || 'Error al cerrar sesión'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Configurar el listener de cambios en el estado de autenticación.
   * Se ejecuta al montar el componente que utilice este composable.
   */
  onMounted(() => {
    // Obtener la sesión actual al montar
    supabase.auth.getSession().then(({ data: { session } }) => {
      currentUser.value = session?.user ?? null
    })

    // Escuchar cambios en el estado de autenticación (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        currentUser.value = session?.user ?? null
      }
    )

    // Nota: la suscripción se limpia automáticamente cuando el componente se desmonta
    // si se desea limpiar manualmente, usar subscription.unsubscribe() en onUnmounted
    return () => {
      subscription.unsubscribe()
    }
  })

  return {
    // Estado reactivo
    currentUser,
    loading,
    error,

    // Propiedad computada
    isAuthenticated,

    // Métodos
    login,
    logout,
  }
}
