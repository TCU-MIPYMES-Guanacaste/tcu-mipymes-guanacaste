/**
 * Edge Function: invitar-admin
 *
 * Da de alta a un administrador nuevo: crea su cuenta en Supabase Auth
 * (invitación por correo) y lo agrega a la lista blanca admin_profiles.
 *
 * Corre en Deno, fuera del bundle de Vue. Se escribe en JavaScript plano
 * por consistencia con el resto del proyecto (sin TypeScript).
 *
 * Seguridad: aunque la interfaz solo se la ofrece a un superadmin, esta
 * función vuelve a verificarlo con el JWT de quien llama. La Service Role
 * Key solo existe aquí dentro; nunca llega al navegador.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CABECERAS_CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

/** Respuesta JSON con las cabeceras CORS ya puestas. */
function responder(cuerpo, estado = 200) {
  return new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { ...CABECERAS_CORS, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CABECERAS_CORS })
  }

  if (req.method !== 'POST') {
    return responder({ error: 'Método no permitido.' }, 405)
  }

  try {
    const url = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!url || !serviceRoleKey) {
      return responder({ error: 'La función no está configurada correctamente.' }, 500)
    }

    // Cliente con privilegios: salta RLS y puede usar auth.admin.
    const admin = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // --- 1. Identificar a quien llama ---
    const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '').trim()
    if (!token) {
      return responder({ error: 'Falta la sesión.' }, 401)
    }

    const { data: { user }, error: errorUsuario } = await admin.auth.getUser(token)
    if (errorUsuario || !user) {
      return responder({ error: 'Sesión inválida o vencida.' }, 401)
    }

    // --- 2. Confirmar que es superadmin (defensa en profundidad) ---
    const { data: perfil, error: errorPerfil } = await admin
      .from('admin_profiles')
      .select('rol')
      .eq('id', user.id)
      .maybeSingle()

    if (errorPerfil || perfil?.rol !== 'superadmin') {
      return responder({ error: 'Solo un superadministrador puede invitar.' }, 403)
    }

    // --- 3. Leer y validar el cuerpo ---
    let cuerpo
    try {
      cuerpo = await req.json()
    } catch {
      return responder({ error: 'El cuerpo de la petición no es JSON válido.' }, 400)
    }

    const email = String(cuerpo?.email ?? '').trim().toLowerCase()
    const nombre = String(cuerpo?.nombre ?? '').trim()

    if (cuerpo?.rol !== undefined && cuerpo.rol !== 'superadmin' && cuerpo.rol !== 'editor') {
      return responder({ error: "El rol debe ser 'superadmin' o 'editor'." }, 400)
    }
    const rol = cuerpo?.rol === 'superadmin' ? 'superadmin' : 'editor'

    if (!email.includes('@')) {
      return responder({ error: 'El correo no es válido.' }, 400)
    }
    if (!nombre) {
      return responder({ error: 'El nombre es obligatorio.' }, 400)
    }

    // --- 4. Crear la cuenta y enviar la invitación ---
    const { data: invitacion, error: errorInvitacion } =
      await admin.auth.admin.inviteUserByEmail(email)

    if (errorInvitacion || !invitacion?.user) {
      const mensaje = (errorInvitacion?.message ?? '').toLowerCase()
      if (mensaje.includes('already') && mensaje.includes('registered')) {
        return responder(
          {
            error:
              "Ese correo ya tiene una cuenta de Supabase Auth (probablemente un administrador " +
              "revocado antes). Vea 'Problemas frecuentes' en el README para reactivarlo sin crear " +
              'una cuenta nueva.',
          },
          409
        )
      }
      console.error('[invitar-admin] inviteUserByEmail:', errorInvitacion?.message)
      return responder(
        { error: 'No se pudo enviar la invitación. Revise la configuración de correo del proyecto.' },
        502
      )
    }

    // --- 5. Alta en la lista blanca ---
    const { error: errorAlta } = await admin
      .from('admin_profiles')
      .insert({ id: invitacion.user.id, nombre_completo: nombre, rol })

    if (errorAlta) {
      console.error('[invitar-admin] insert admin_profiles:', errorAlta.message)
      return responder(
        { error: 'La invitación se envió, pero no se pudo registrar el perfil. Avise al equipo técnico.' },
        500
      )
    }

    return responder({ ok: true, id: invitacion.user.id, nombre_completo: nombre, rol }, 200)
  } catch (err) {
    console.error('[invitar-admin] error inesperado:', err)
    return responder({ error: 'Ocurrió un error inesperado. Intente de nuevo más tarde.' }, 500)
  }
})
