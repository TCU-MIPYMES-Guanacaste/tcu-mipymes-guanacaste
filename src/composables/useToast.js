/**
 * Composable de notificaciones (toasts).
 *
 * Mantiene una cola global de mensajes breves de éxito o error que
 * AppToast.vue renderiza. Cualquier vista o composable puede llamar
 * mostrarExito()/mostrarError() sin preocuparse de dónde se muestran.
 */
import { ref } from 'vue'

// Estado compartido (singleton) fuera de la función
const toasts = ref([])
let contadorIds = 0

const DURACION_EXITO_MS = 4000
const DURACION_ERROR_MS = 6000

/**
 * Agrega un toast a la cola y programa su cierre automático.
 *
 * @param {'exito'|'error'} tipo
 * @param {string} mensaje
 * @param {number} duracionMs
 * @returns {number} id del toast
 */
function agregar(tipo, mensaje, duracionMs) {
  const id = ++contadorIds
  toasts.value.push({ id, tipo, mensaje })
  setTimeout(() => cerrar(id), duracionMs)
  return id
}

/** Quita un toast de la cola por id. */
function cerrar(id) {
  toasts.value = toasts.value.filter((t) => t.id !== id)
}

export function useToast() {
  return {
    toasts,
    mostrarExito: (mensaje) => agregar('exito', mensaje, DURACION_EXITO_MS),
    mostrarError: (mensaje) => agregar('error', mensaje, DURACION_ERROR_MS),
    cerrar,
  }
}
