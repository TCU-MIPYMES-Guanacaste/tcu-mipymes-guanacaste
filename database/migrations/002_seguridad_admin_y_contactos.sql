-- ============================================================================
-- MIGRACIÓN 002: Seguridad de administradores y métrica de contactos
-- Proyecto: Directorio B2B - MiPymes Guanacaste (TCU)
-- Fecha: 2026-09-15
--
-- Qué hace:
--   1. Lista blanca: solo usuarios presentes en admin_profiles pueden escribir.
--   2. Productores inactivos dejan de ser visibles para el público vía API.
--   3. Políticas reales de Storage para el bucket product-images.
--   4. Tabla contactos_whatsapp + RPC registrar_contacto + vista resumen.
--   5. Normaliza los teléfonos existentes al formato 506XXXXXXXX.
--
-- Es idempotente: se puede ejecutar más de una vez sin romper nada.
-- ============================================================================


-- ============================================================================
-- 1. FUNCIÓN es_admin()
-- SECURITY DEFINER evita la recursión de RLS al consultar admin_profiles
-- desde sus propias políticas.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.es_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_profiles WHERE id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.es_admin() FROM public;
GRANT EXECUTE ON FUNCTION public.es_admin() TO anon, authenticated;

COMMENT ON FUNCTION public.es_admin() IS
  'Devuelve true si el usuario autenticado está en la lista blanca admin_profiles.';


-- ============================================================================
-- 2. POLÍTICAS DE ESCRITURA: de "cualquier autenticado" a "solo admins"
-- ============================================================================

-- ---- 2.1 cantones ----
DROP POLICY IF EXISTS "cantones_escritura_admin"      ON public.cantones;
DROP POLICY IF EXISTS "cantones_actualizacion_admin"  ON public.cantones;
DROP POLICY IF EXISTS "cantones_eliminacion_admin"    ON public.cantones;

CREATE POLICY "cantones_escritura_admin"     ON public.cantones FOR INSERT TO authenticated WITH CHECK (public.es_admin());
CREATE POLICY "cantones_actualizacion_admin" ON public.cantones FOR UPDATE TO authenticated USING (public.es_admin()) WITH CHECK (public.es_admin());
CREATE POLICY "cantones_eliminacion_admin"   ON public.cantones FOR DELETE TO authenticated USING (public.es_admin());

-- ---- 2.2 categorias ----
DROP POLICY IF EXISTS "categorias_escritura_admin"      ON public.categorias;
DROP POLICY IF EXISTS "categorias_actualizacion_admin"  ON public.categorias;
DROP POLICY IF EXISTS "categorias_eliminacion_admin"    ON public.categorias;

CREATE POLICY "categorias_escritura_admin"     ON public.categorias FOR INSERT TO authenticated WITH CHECK (public.es_admin());
CREATE POLICY "categorias_actualizacion_admin" ON public.categorias FOR UPDATE TO authenticated USING (public.es_admin()) WITH CHECK (public.es_admin());
CREATE POLICY "categorias_eliminacion_admin"   ON public.categorias FOR DELETE TO authenticated USING (public.es_admin());

-- ---- 2.3 productores (también cambia la lectura: inactivos solo para admins) ----
DROP POLICY IF EXISTS "productores_lectura_publica"      ON public.productores;
DROP POLICY IF EXISTS "productores_escritura_admin"      ON public.productores;
DROP POLICY IF EXISTS "productores_actualizacion_admin"  ON public.productores;
DROP POLICY IF EXISTS "productores_eliminacion_admin"    ON public.productores;

CREATE POLICY "productores_lectura_publica"     ON public.productores FOR SELECT USING (activo = true OR public.es_admin());
CREATE POLICY "productores_escritura_admin"     ON public.productores FOR INSERT TO authenticated WITH CHECK (public.es_admin());
CREATE POLICY "productores_actualizacion_admin" ON public.productores FOR UPDATE TO authenticated USING (public.es_admin()) WITH CHECK (public.es_admin());
CREATE POLICY "productores_eliminacion_admin"   ON public.productores FOR DELETE TO authenticated USING (public.es_admin());

-- ---- 2.4 productor_categorias ----
DROP POLICY IF EXISTS "productor_cat_escritura_admin"      ON public.productor_categorias;
DROP POLICY IF EXISTS "productor_cat_actualizacion_admin"  ON public.productor_categorias;
DROP POLICY IF EXISTS "productor_cat_eliminacion_admin"    ON public.productor_categorias;

CREATE POLICY "productor_cat_escritura_admin"     ON public.productor_categorias FOR INSERT TO authenticated WITH CHECK (public.es_admin());
CREATE POLICY "productor_cat_actualizacion_admin" ON public.productor_categorias FOR UPDATE TO authenticated USING (public.es_admin()) WITH CHECK (public.es_admin());
CREATE POLICY "productor_cat_eliminacion_admin"   ON public.productor_categorias FOR DELETE TO authenticated USING (public.es_admin());

-- ---- 2.5 productos_destacados ----
DROP POLICY IF EXISTS "productos_dest_escritura_admin"      ON public.productos_destacados;
DROP POLICY IF EXISTS "productos_dest_actualizacion_admin"  ON public.productos_destacados;
DROP POLICY IF EXISTS "productos_dest_eliminacion_admin"    ON public.productos_destacados;

CREATE POLICY "productos_dest_escritura_admin"     ON public.productos_destacados FOR INSERT TO authenticated WITH CHECK (public.es_admin());
CREATE POLICY "productos_dest_actualizacion_admin" ON public.productos_destacados FOR UPDATE TO authenticated USING (public.es_admin()) WITH CHECK (public.es_admin());
CREATE POLICY "productos_dest_eliminacion_admin"   ON public.productos_destacados FOR DELETE TO authenticated USING (public.es_admin());

-- ---- 2.6 admin_profiles ----
DROP POLICY IF EXISTS "admin_profiles_lectura_auth"        ON public.admin_profiles;
DROP POLICY IF EXISTS "admin_profiles_escritura_auth"      ON public.admin_profiles;
DROP POLICY IF EXISTS "admin_profiles_actualizacion_auth"  ON public.admin_profiles;
DROP POLICY IF EXISTS "admin_profiles_eliminacion_auth"    ON public.admin_profiles;

DROP POLICY IF EXISTS "admin_profiles_lectura"       ON public.admin_profiles;
DROP POLICY IF EXISTS "admin_profiles_escritura"     ON public.admin_profiles;
DROP POLICY IF EXISTS "admin_profiles_actualizacion" ON public.admin_profiles;
DROP POLICY IF EXISTS "admin_profiles_eliminacion"   ON public.admin_profiles;

CREATE POLICY "admin_profiles_lectura"       ON public.admin_profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.es_admin());
CREATE POLICY "admin_profiles_escritura"     ON public.admin_profiles FOR INSERT TO authenticated WITH CHECK (public.es_admin());
CREATE POLICY "admin_profiles_actualizacion" ON public.admin_profiles FOR UPDATE TO authenticated USING (public.es_admin()) WITH CHECK (public.es_admin());
CREATE POLICY "admin_profiles_eliminacion"   ON public.admin_profiles FOR DELETE TO authenticated USING (public.es_admin());


-- ============================================================================
-- 3. POLÍTICAS DE STORAGE (bucket product-images)
-- En la migración 001 estaban solo como comentario. Aquí se crean de verdad.
-- Requisito: el bucket 'product-images' debe existir y ser público (ver README).
-- ============================================================================
DROP POLICY IF EXISTS "imagenes_lectura_publica"       ON storage.objects;
DROP POLICY IF EXISTS "imagenes_subida_admin"          ON storage.objects;
DROP POLICY IF EXISTS "imagenes_actualizacion_admin"   ON storage.objects;
DROP POLICY IF EXISTS "imagenes_eliminacion_admin"     ON storage.objects;

CREATE POLICY "imagenes_lectura_publica"     ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "imagenes_subida_admin"        ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images' AND public.es_admin());
CREATE POLICY "imagenes_actualizacion_admin" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'product-images' AND public.es_admin());
CREATE POLICY "imagenes_eliminacion_admin"   ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'product-images' AND public.es_admin());


-- ============================================================================
-- 4. MÉTRICA DE CONTACTOS POR WHATSAPP
-- ============================================================================

-- ---- 4.1 Tabla (sin ningún dato identificable del visitante) ----
CREATE TABLE IF NOT EXISTS public.contactos_whatsapp (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    productor_id UUID        NOT NULL REFERENCES public.productores(id) ON DELETE CASCADE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.contactos_whatsapp IS
  'Un registro por cada clic en "Contactar por WhatsApp". No guarda datos del visitante.';

CREATE INDEX IF NOT EXISTS idx_contactos_productor ON public.contactos_whatsapp(productor_id);
CREATE INDEX IF NOT EXISTS idx_contactos_created   ON public.contactos_whatsapp(created_at);

ALTER TABLE public.contactos_whatsapp ENABLE ROW LEVEL SECURITY;

-- Solo admins leen. Nadie inserta directo (se usa el RPC de abajo).
DROP POLICY IF EXISTS "contactos_lectura_admin" ON public.contactos_whatsapp;
CREATE POLICY "contactos_lectura_admin" ON public.contactos_whatsapp FOR SELECT TO authenticated USING (public.es_admin());

-- ---- 4.2 RPC para registrar un contacto (anónimo) ----
CREATE OR REPLACE FUNCTION public.registrar_contacto(p_productor_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Solo se registra si el productor existe y está visible al público
  IF EXISTS (
    SELECT 1 FROM public.productores
    WHERE id = p_productor_id AND activo = true
  ) THEN
    INSERT INTO public.contactos_whatsapp (productor_id) VALUES (p_productor_id);
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.registrar_contacto(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.registrar_contacto(uuid) TO anon, authenticated;

COMMENT ON FUNCTION public.registrar_contacto(uuid) IS
  'Registra un clic de contacto por WhatsApp. Llamable por visitantes anónimos.';

-- ---- 4.3 Vista de resumen para el panel admin ----
-- security_invoker hace que la vista respete el RLS de la tabla: solo admins ven datos.
CREATE OR REPLACE VIEW public.resumen_contactos_whatsapp
WITH (security_invoker = true) AS
SELECT
  productor_id,
  COUNT(*)::int                                                              AS total,
  COUNT(*) FILTER (WHERE created_at >= now() - interval '30 days')::int      AS ultimos_30_dias
FROM public.contactos_whatsapp
GROUP BY productor_id;

REVOKE ALL ON public.resumen_contactos_whatsapp FROM anon;
GRANT SELECT ON public.resumen_contactos_whatsapp TO authenticated;

COMMENT ON VIEW public.resumen_contactos_whatsapp IS
  'Total de contactos por productor (histórico y últimos 30 días). Solo admins.';


-- ============================================================================
-- 5. NORMALIZAR TELÉFONOS EXISTENTES AL FORMATO 506XXXXXXXX
-- Los que no tengan 8 ni 11 dígitos quedan solo con sus dígitos; el
-- formulario los marcará como inválidos al editar y no tendrán botón de WhatsApp.
-- ============================================================================
UPDATE public.productores
SET telefono = CASE
  WHEN length(regexp_replace(telefono, '\D', '', 'g')) = 8
    THEN '506' || regexp_replace(telefono, '\D', '', 'g')
  ELSE regexp_replace(telefono, '\D', '', 'g')
END
WHERE telefono ~ '\D' OR telefono ~ '^\d{8}$';
-- Idempotente: solo toca filas con caracteres no numéricos o con 8 dígitos;
-- un número ya normalizado (11 dígitos) no cumple ninguna condición y no se reescribe.


-- ============================================================================
-- FIN DE LA MIGRACIÓN 002
--
-- PASOS MANUALES PENDIENTES (ver README):
--   • Authentication → Providers → Email → desactivar "Allow new users to sign up".
--   • Authentication → URL Configuration → Site URL y Redirect URLs.
--   • Insertar el primer administrador en admin_profiles.
-- ============================================================================
