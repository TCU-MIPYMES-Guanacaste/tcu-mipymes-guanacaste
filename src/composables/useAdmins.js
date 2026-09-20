/**
 * Composable de gestión de administradores (solo superadmins).
 *
 * admin_profiles no guarda el correo — vive solo en auth.users, que
 * PostgREST no expone al cliente. Por eso la lista muestra nombre y rol;
 * el correo solo se usa al invitar.
 *
 * Eliminar un administrador revoca su acceso (borra la fila de la lista
 * blanca). Su cuenta de Supabase Auth no se elimina.
 */
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

const FUNCION_INVITAR = 'invitar-admin'

/**
 * Saca el mensaje en español del cuerpo de error de la Edge Function.
 * supabase-js entrega un error genérico y deja el cuerpo real en
 * `context`; si no se puede leer, se usa el mensaje genérico.
 *
 * @param {Object} fnError
 * @returns {Promise<string>}
 */
async function mensajeDeFuncion(fnError) {
  try {
    const cuerpo = await fnError?.context?.json?.()
    if (cuerpo?.error) return cuerpo.error
  } catch {
    // El cuerpo no era JSON (timeout, error de red, HTML de un proxy...)
  }
  return fnError?.message || 'No se pudo enviar la invitación.'
}

export function useAdmins() {
  const admins = ref([])
  const loading = ref(false)
  const error = ref(null)

  /** Envuelve una operación con loading/error; devuelve `valorSiFalla` si lanza. */
  async function ejecutar(operacion, valorSiFalla) {
    loading.value = true
    error.value = null
    try {
      return await operacion()
    } catch (err) {
      error.value = err?.message || 'Ocurrió un error inesperado'
      console.error('[useAdmins]', err)
      return valorSiFalla
    } finally {
      loading.value = false
    }
  }

  /**
   * Lista los administradores de la lista blanca.
   * @returns {Promise<void>} El resultado queda en `admins`.
   */
  async function fetchAdmins() {
    admins.value = await ejecutar(async () => {
      const { data, error: fetchError } = await supabase
        .from('admin_profiles')
        .select('id, nombre_completo, rol, created_at')
        .order('nombre_completo', { ascending: true })
      if (fetchError) throw fetchError
      return data ?? []
    }, [])
  }

  /**
   * Invita a un administrador nuevo a través de la Edge Function.
   * @param {string} email
   * @param {string} nombre
   * @param {'superadmin'|'editor'} rol
   * @returns {Promise<boolean>}
   */
  function invitarAdmin(email, nombre, rol) {
    return ejecutar(async () => {
      const correo = (email ?? '').trim().toLowerCase()
      const nombreLimpio = (nombre ?? '').trim()

      if (!correo) throw new Error('El correo es obligatorio.')
      if (!nombreLimpio) throw new Error('El nombre es obligatorio.')

      const { error: fnError } = await supabase.functions.invoke(FUNCION_INVITAR, {
        body: { email: correo, nombre: nombreLimpio, rol },
      })

      if (fnError) throw new Error(await mensajeDeFuncion(fnError))

      return true
    }, false)
  }

  /**
   * Revoca el acceso de un administrador (no borra su cuenta de Auth).
   * @returns {Promise<boolean>}
   */
  function eliminarAdmin(id) {
    return ejecutar(async () => {
      const { data, error: deleteError } = await supabase
        .from('admin_profiles')
        .delete()
        .eq('id', id)
        .select()
      if (deleteError) throw deleteError
      if (!data || data.length === 0) {
        throw new Error('No se pudo eliminar: el administrador ya no existe o no tiene permiso.')
      }

      admins.value = admins.value.filter((a) => a.id !== id)
      return true
    }, false)
  }

  return { admins, loading, error, fetchAdmins, invitarAdmin, eliminarAdmin }
}
