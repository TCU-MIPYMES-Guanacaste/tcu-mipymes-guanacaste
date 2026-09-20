/**
 * Simulador mínimo del cliente de Supabase para pruebas unitarias.
 *
 * - `supabase.from(tabla)` devuelve un "builder" encadenable que registra
 *   cada método llamado y, al hacer `await`, resuelve con la siguiente
 *   respuesta en cola para esa tabla (o { data: null, error: null }).
 * - `supabase.storage.from(bucket)` devuelve un objeto con upload/remove simulados.
 * - `supabase.auth` expone funciones simuladas con respuestas por defecto.
 * - `supabase.rpc` es una función simulada.
 * - `supabase.functions.invoke` es una función simulada (Edge Functions).
 */
import { vi } from 'vitest'

const METODOS_BUILDER = [
  'select', 'insert', 'update', 'delete',
  'eq', 'neq', 'in', 'or', 'ilike', 'order', 'limit', 'single', 'maybeSingle',
]

export function crearSupabaseMock() {
  let colas = {}
  let consultas = []

  const storage = {
    upload: vi.fn().mockResolvedValue({ data: null, error: null }),
    remove: vi.fn().mockResolvedValue({ data: null, error: null }),
    getPublicUrl: vi.fn((path) => ({ data: { publicUrl: `https://cdn.test/${path}` } })),
  }

  function crearBuilder(tabla) {
    const builder = { tabla, pasos: [] }
    for (const metodo of METODOS_BUILDER) {
      builder[metodo] = vi.fn((...args) => {
        builder.pasos.push({ metodo, args })
        return builder
      })
    }
    // Hace el builder "thenable" para poder usar await
    builder.then = (resolve, reject) => {
      const cola = colas[tabla] ?? []
      const respuesta = cola.length > 0 ? cola.shift() : { data: null, error: null }
      return Promise.resolve(respuesta).then(resolve, reject)
    }
    consultas.push(builder)
    return builder
  }

  const auth = {
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    signInWithPassword: vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    resetPasswordForEmail: vi.fn().mockResolvedValue({ data: {}, error: null }),
    updateUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
  }

  const functions = {
    invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
  }

  const supabase = {
    from: vi.fn((tabla) => crearBuilder(tabla)),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    storage: { from: vi.fn(() => storage) },
    functions,
    auth,
  }

  /** Encola una respuesta para la próxima consulta a `tabla`. */
  function responder(tabla, respuesta) {
    if (!colas[tabla]) colas[tabla] = []
    colas[tabla].push(respuesta)
  }

  /** Devuelve los builders creados para `tabla`, en orden. */
  function consultasDe(tabla) {
    return consultas.filter((c) => c.tabla === tabla)
  }

  /** Limpia colas e historial (llamar en beforeEach). */
  function reiniciar() {
    colas = {}
    consultas = []
    storage.upload.mockClear()
    storage.remove.mockClear()
    supabase.rpc.mockClear()
    supabase.from.mockClear()
    functions.invoke.mockClear()
    for (const fn of Object.values(auth)) fn.mockClear()
  }

  return { supabase, storage, auth, functions, responder, consultasDe, reiniciar }
}
