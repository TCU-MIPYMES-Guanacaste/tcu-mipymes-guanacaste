-- ============================================================================
-- MIGRACIÓN 003: Roles diferenciados y cierre de la escalada de privilegios
-- Proyecto: Directorio B2B - MiPymes Guanacaste (TCU)
-- Fecha: 2026-09-19
--
-- Qué hace:
--   1. Agrega la función es_superadmin().
--   2. Restringe INSERT/UPDATE/DELETE de admin_profiles a superadmins.
--      Antes bastaba con es_admin(), así que cualquier administrador podía
--      cambiar el rol de cualquier fila (incluida la propia) y ascenderse.
--      La lectura (SELECT) no cambia.
--   3. Avisa si el proyecto quedara sin ningún superadmin.
--   4. Corrige la lectura pública de productos_destacados: antes cualquiera
--      podía leer TODOS los productos (USING (true)), sin filtrar por
--      disponibilidad ni por si el productor dueño seguía activo. Ahora
--      exige disponible = true y productor activo, igual que productores.
--
-- No cambia las políticas de productores, categorias, cantones,
-- productor_categorias, contactos_whatsapp ni storage.objects:
-- categorías y cantones siguen siendo gestionables por cualquier admin.
--
-- Es idempotente: se puede ejecutar más de una vez sin romper nada.
-- ============================================================================


-- ============================================================================
-- 1. FUNCIÓN es_superadmin()
-- SECURITY DEFINER evita la recursión de RLS al consultar admin_profiles
-- desde sus propias políticas (igual que es_admin()).
-- ============================================================================
CREATE OR REPLACE FUNCTION public.es_superadmin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_profiles WHERE id = auth.uid() AND rol = 'superadmin'
  );
$$;

REVOKE ALL ON FUNCTION public.es_superadmin() FROM public;
GRANT EXECUTE ON FUNCTION public.es_superadmin() TO anon, authenticated;

COMMENT ON FUNCTION public.es_superadmin() IS
  'Devuelve true si el usuario autenticado es superadmin en admin_profiles.';


-- ============================================================================
-- 2. admin_profiles: INSERT, UPDATE y DELETE pasan a requerir superadmin
-- (antes: cualquier admin vía es_admin()). SELECT no cambia.
-- ============================================================================
DROP POLICY IF EXISTS "admin_profiles_escritura"     ON public.admin_profiles;
DROP POLICY IF EXISTS "admin_profiles_actualizacion" ON public.admin_profiles;
DROP POLICY IF EXISTS "admin_profiles_eliminacion"   ON public.admin_profiles;

CREATE POLICY "admin_profiles_escritura"     ON public.admin_profiles FOR INSERT TO authenticated WITH CHECK (public.es_superadmin());
CREATE POLICY "admin_profiles_actualizacion" ON public.admin_profiles FOR UPDATE TO authenticated USING (public.es_superadmin()) WITH CHECK (public.es_superadmin());
CREATE POLICY "admin_profiles_eliminacion"   ON public.admin_profiles FOR DELETE TO authenticated USING (public.es_superadmin());


-- ============================================================================
-- 3. RED DE SEGURIDAD
-- Si no hay ningún superadmin, nadie podrá gestionar administradores desde
-- la aplicación (solo quedaría el SQL Editor con la service role key).
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.admin_profiles WHERE rol = 'superadmin') THEN
    RAISE WARNING 'No hay ningún superadmin en admin_profiles. Asigne el rol con: UPDATE public.admin_profiles SET rol = ''superadmin'' WHERE id = ''UUID-DEL-ADMIN'';';
  END IF;
END $$;


-- ============================================================================
-- 4. productos_destacados: el público solo ve productos disponibles de
--    productores activos (antes: USING (true), sin filtro alguno).
-- Coherente con la política ya existente de productores (migración 002).
-- ============================================================================
DROP POLICY IF EXISTS "productos_dest_lectura_publica" ON public.productos_destacados;

CREATE POLICY "productos_dest_lectura_publica" ON public.productos_destacados FOR SELECT
  USING (
    public.es_admin()
    OR (
      disponible = true
      AND EXISTS (
        SELECT 1 FROM public.productores p
        WHERE p.id = productor_id AND p.activo = true
      )
    )
  );


-- ============================================================================
-- FIN DE LA MIGRACIÓN 003
--
-- VERIFICACIÓN (ejecutar aparte, en el SQL Editor):
--   SELECT policyname, cmd, qual, with_check FROM pg_policies
--   WHERE schemaname = 'public' AND tablename = 'admin_profiles';
--   -- Las tres de escritura deben mencionar es_superadmin(); la de SELECT, es_admin().
--
--   SELECT nombre_completo, rol FROM public.admin_profiles ORDER BY rol;
--   -- Debe haber al menos un 'superadmin'.
--
-- PASOS MANUALES PENDIENTES (ver README):
--   • Configurar el envío de correo del proyecto (SMTP) para las invitaciones.
--   • Desplegar la Edge Function invitar-admin.
-- ============================================================================
