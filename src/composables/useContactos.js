/**
 * Composable de la métrica de contactos por WhatsApp.
 *
 * - registrarContacto: lo llama el botón de WhatsApp (público). Nunca falla
 *   hacia afuera: un problema al registrar no debe impedir el contacto.
 * - fetchResumenContactos: lo usa el panel admin para los KPIs.
 */
import { supabase } from '@/lib/supabase'

// Ventana anti-doble-clic del contador (no afecta al enlace de WhatsApp)
const VENTANA_DEBOUNCE_MS = 60_000
const PREFIJO_MARCA = 'contacto_ultimo_'

/**
 * ¿Se registró este productor hace menos de la ventana?
 *
 * localStorage puede lanzar (modo privado, cuota, políticas del navegador).
 * Ante cualquier duda se devuelve false: es preferible contar un clic de más
 * que perder la métrica por completo.
 */
function registradoHacePoco(productorId) {
  try {
    const marca = window.localStorage.getItem(`${PREFIJO_MARCA}${productorId}`)
    if (!marca) return false
    return Date.now() - Number(marca) < VENTANA_DEBOUNCE_MS
  } catch {
    return false
  }
}

/** Guarda la marca de tiempo del último intento. Nunca lanza. */
function marcarIntento(productorId) {
  try {
    window.localStorage.setItem(`${PREFIJO_MARCA}${productorId}`, String(Date.now()))
  } catch {
    // Sin almacenamiento no hay debounce, pero el contacto se registra igual
  }
}

export function useContactos() {
  /**
   * Registra un clic de contacto. Fire-and-forget.
   *
   * Si ya se registró este productor hace menos de un minuto, se omite la
   * llamada al RPC. El enlace de WhatsApp se abre igual: quien llama
   * (WhatsAppButton) no espera a esta función ni mira su resultado.
   *
   * @param {string|null|undefined} productorId
   */
  async function registrarContacto(productorId) {
    if (!productorId) return

    if (registradoHacePoco(productorId)) {
      marcarIntento(productorId)
      return
    }

    marcarIntento(productorId)

    try {
      const { error } = await supabase.rpc('registrar_contacto', { p_productor_id: productorId })
      if (error) console.warn('[useContactos] No se registró el contacto:', error.message)
    } catch (err) {
      console.warn('[useContactos] No se registró el contacto:', err?.message)
    }
  }

  /**
   * Resumen de contactos por productor (solo admins; RLS lo garantiza).
   * @returns {Promise<{ porProductor: Map<string, Object>, total: number, ultimos30Dias: number }>}
   */
  async function fetchResumenContactos() {
    const { data, error } = await supabase
      .from('resumen_contactos_whatsapp')
      .select('productor_id, total, ultimos_30_dias')

    if (error) throw error

    const porProductor = new Map()
    let total = 0
    let ultimos30Dias = 0

    for (const fila of data ?? []) {
      porProductor.set(fila.productor_id, fila)
      total += fila.total
      ultimos30Dias += fila.ultimos_30_dias
    }

    return { porProductor, total, ultimos30Dias }
  }

  return { registrarContacto, fetchResumenContactos }
}
