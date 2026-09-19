/**
 * Composable de la métrica de contactos por WhatsApp.
 *
 * - registrarContacto: lo llama el botón de WhatsApp (público). Nunca falla
 *   hacia afuera: un problema al registrar no debe impedir el contacto.
 * - fetchResumenContactos: lo usa el panel admin para los KPIs.
 */
import { supabase } from '@/lib/supabase'

export function useContactos() {
  /**
   * Registra un clic de contacto. Fire-and-forget.
   * @param {string|null|undefined} productorId
   */
  async function registrarContacto(productorId) {
    if (!productorId) return

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
