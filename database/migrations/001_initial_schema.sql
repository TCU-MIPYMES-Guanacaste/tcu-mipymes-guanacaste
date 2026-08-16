-- ============================================================================
-- MIGRACIÓN 001: Esquema Inicial
-- Proyecto: Directorio B2B - MiPymes Guanacaste (TCU)
-- Descripción: Conecta chefs con productores locales de alimentos en
--              la provincia de Guanacaste, Costa Rica.
-- Fecha: 2026-06-18
-- ============================================================================

-- ============================================================================
-- 1. EXTENSIONES NECESARIAS
-- ============================================================================

-- Generación de UUIDs (v4) para claves primarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- Actualización automática de columnas updated_at mediante triggers
CREATE EXTENSION IF NOT EXISTS moddatetime WITH SCHEMA extensions;


-- ============================================================================
-- 2. TABLAS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 2.1 Cantones (municipios de Guanacaste)
-- Cada cantón representa una zona geográfica donde operan los productores.
-- ----------------------------------------------------------------------------
CREATE TABLE cantones (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre     TEXT        NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL    DEFAULT now()
);

COMMENT ON TABLE  cantones          IS 'Cantones (municipios) de la provincia de Guanacaste.';
COMMENT ON COLUMN cantones.nombre   IS 'Nombre oficial del cantón (ej: Liberia, Nicoya).';


-- ----------------------------------------------------------------------------
-- 2.2 Categorías de productos
-- Clasificación de los tipos de productos que ofrecen los productores.
-- ----------------------------------------------------------------------------
CREATE TABLE categorias (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre     TEXT        NOT NULL UNIQUE,
    icono      TEXT,                           -- Emoji o nombre de ícono (opcional)
    created_at TIMESTAMPTZ NOT NULL    DEFAULT now()
);

COMMENT ON TABLE  categorias        IS 'Categorías de productos alimenticios.';
COMMENT ON COLUMN categorias.icono  IS 'Emoji o identificador de ícono para la UI.';


-- ----------------------------------------------------------------------------
-- 2.3 Productores (entidad principal)
-- Representa a cada productor/negocio alimentario registrado en el directorio.
-- ----------------------------------------------------------------------------
CREATE TABLE productores (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_negocio    TEXT        NOT NULL,
    nombre_contacto   TEXT        NOT NULL,
    descripcion       TEXT,
    telefono          TEXT        NOT NULL,          -- Usado para generar enlace de WhatsApp
    email             TEXT,
    canton_id         UUID        REFERENCES cantones(id) ON DELETE SET NULL,
    direccion_detalle TEXT,                          -- Dirección o referencia geográfica
    foto_url          TEXT,                          -- URL de imagen en Supabase Storage
    activo            BOOLEAN     NOT NULL DEFAULT true,  -- Toggle de visibilidad (soft delete)
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  productores                    IS 'Productores y negocios alimentarios del directorio.';
COMMENT ON COLUMN productores.telefono           IS 'Número de teléfono, se usa para generar enlace directo a WhatsApp.';
COMMENT ON COLUMN productores.activo             IS 'Controla la visibilidad pública sin eliminar el registro.';
COMMENT ON COLUMN productores.direccion_detalle  IS 'Dirección física o referencia para ubicar al productor.';
COMMENT ON COLUMN productores.foto_url           IS 'URL de la foto de perfil almacenada en Supabase Storage.';

-- Trigger: actualiza updated_at automáticamente en cada UPDATE
CREATE TRIGGER trg_productores_updated_at
    BEFORE UPDATE ON productores
    FOR EACH ROW
    EXECUTE FUNCTION extensions.moddatetime(updated_at);


-- ----------------------------------------------------------------------------
-- 2.4 Productor ↔ Categorías (relación muchos a muchos)
-- Permite asignar múltiples categorías a cada productor.
-- ----------------------------------------------------------------------------
CREATE TABLE productor_categorias (
    productor_id UUID NOT NULL REFERENCES productores(id) ON DELETE CASCADE,
    categoria_id UUID NOT NULL REFERENCES categorias(id)  ON DELETE CASCADE,
    PRIMARY KEY (productor_id, categoria_id)
);

COMMENT ON TABLE productor_categorias IS 'Tabla puente entre productores y sus categorías de productos.';


-- ----------------------------------------------------------------------------
-- 2.5 Productos Destacados (escalabilidad Fase 3)
-- Productos individuales que un productor desea resaltar en su perfil.
-- ----------------------------------------------------------------------------
CREATE TABLE productos_destacados (
    id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    productor_id      UUID          NOT NULL REFERENCES productores(id) ON DELETE CASCADE,
    nombre            TEXT          NOT NULL,
    descripcion       TEXT,
    precio_referencia DECIMAL(10,2),             -- Precio orientativo (opcional)
    unidad            TEXT,                      -- Ej: 'kg', 'unidad', 'litro'
    disponible        BOOLEAN       NOT NULL DEFAULT true,
    temporada         TEXT,                      -- Ej: 'Todo el año', 'Noviembre-Marzo'
    foto_url          TEXT,
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ   NOT NULL DEFAULT now()
);

COMMENT ON TABLE  productos_destacados                    IS 'Productos individuales destacados de cada productor.';
COMMENT ON COLUMN productos_destacados.precio_referencia  IS 'Precio referencial, no vinculante.';
COMMENT ON COLUMN productos_destacados.unidad             IS 'Unidad de medida: kg, unidad, litro, etc.';
COMMENT ON COLUMN productos_destacados.temporada          IS 'Período de disponibilidad: Todo el año, meses específicos, etc.';

-- Trigger: actualiza updated_at automáticamente en cada UPDATE
CREATE TRIGGER trg_productos_destacados_updated_at
    BEFORE UPDATE ON productos_destacados
    FOR EACH ROW
    EXECUTE FUNCTION extensions.moddatetime(updated_at);


-- ----------------------------------------------------------------------------
-- 2.6 Perfiles de Administrador (escalabilidad Fase 2)
-- Metadatos de los usuarios administradores vinculados a Supabase Auth.
-- Los estudiantes del TCU gestionan el contenido del directorio.
-- ----------------------------------------------------------------------------
CREATE TABLE admin_profiles (
    id              UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre_completo TEXT,
    rol             TEXT        NOT NULL DEFAULT 'editor'
                                CHECK (rol IN ('superadmin', 'editor')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  admin_profiles              IS 'Perfiles de administradores del sistema (estudiantes TCU).';
COMMENT ON COLUMN admin_profiles.rol          IS 'Rol del administrador: superadmin (control total) o editor (gestión de contenido).';
COMMENT ON COLUMN admin_profiles.id           IS 'Vinculado directamente al UUID del usuario en auth.users.';


-- ============================================================================
-- 3. ÍNDICES
-- Optimizan las consultas más frecuentes del directorio.
-- ============================================================================

-- Filtrar productores por cantón
CREATE INDEX idx_productores_canton_id    ON productores(canton_id);

-- Filtrar productores activos/inactivos
CREATE INDEX idx_productores_activo       ON productores(activo);

-- Búsqueda inversa: obtener productores de una categoría
CREATE INDEX idx_productor_categorias_cat ON productor_categorias(categoria_id);

-- Listar productos destacados de un productor
CREATE INDEX idx_productos_dest_productor ON productos_destacados(productor_id);


-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- Política de acceso:
--   • Lectura (SELECT): Pública para todos (anon + authenticated)
--   • Escritura (INSERT/UPDATE/DELETE): Solo usuarios autenticados (admins)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 4.1 Cantones
-- ----------------------------------------------------------------------------
ALTER TABLE cantones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cantones_lectura_publica"
    ON cantones FOR SELECT
    USING (true);

CREATE POLICY "cantones_escritura_admin"
    ON cantones FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "cantones_actualizacion_admin"
    ON cantones FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "cantones_eliminacion_admin"
    ON cantones FOR DELETE
    TO authenticated
    USING (true);

-- ----------------------------------------------------------------------------
-- 4.2 Categorías
-- ----------------------------------------------------------------------------
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categorias_lectura_publica"
    ON categorias FOR SELECT
    USING (true);

CREATE POLICY "categorias_escritura_admin"
    ON categorias FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "categorias_actualizacion_admin"
    ON categorias FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "categorias_eliminacion_admin"
    ON categorias FOR DELETE
    TO authenticated
    USING (true);

-- ----------------------------------------------------------------------------
-- 4.3 Productores
-- ----------------------------------------------------------------------------
ALTER TABLE productores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "productores_lectura_publica"
    ON productores FOR SELECT
    USING (true);

CREATE POLICY "productores_escritura_admin"
    ON productores FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "productores_actualizacion_admin"
    ON productores FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "productores_eliminacion_admin"
    ON productores FOR DELETE
    TO authenticated
    USING (true);

-- ----------------------------------------------------------------------------
-- 4.4 Productor ↔ Categorías
-- ----------------------------------------------------------------------------
ALTER TABLE productor_categorias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "productor_cat_lectura_publica"
    ON productor_categorias FOR SELECT
    USING (true);

CREATE POLICY "productor_cat_escritura_admin"
    ON productor_categorias FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "productor_cat_actualizacion_admin"
    ON productor_categorias FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "productor_cat_eliminacion_admin"
    ON productor_categorias FOR DELETE
    TO authenticated
    USING (true);

-- ----------------------------------------------------------------------------
-- 4.5 Productos Destacados
-- ----------------------------------------------------------------------------
ALTER TABLE productos_destacados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "productos_dest_lectura_publica"
    ON productos_destacados FOR SELECT
    USING (true);

CREATE POLICY "productos_dest_escritura_admin"
    ON productos_destacados FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "productos_dest_actualizacion_admin"
    ON productos_destacados FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "productos_dest_eliminacion_admin"
    ON productos_destacados FOR DELETE
    TO authenticated
    USING (true);

-- ----------------------------------------------------------------------------
-- 4.6 Perfiles de Administrador (solo usuarios autenticados)
-- ----------------------------------------------------------------------------
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_profiles_lectura_auth"
    ON admin_profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "admin_profiles_escritura_auth"
    ON admin_profiles FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "admin_profiles_actualizacion_auth"
    ON admin_profiles FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "admin_profiles_eliminacion_auth"
    ON admin_profiles FOR DELETE
    TO authenticated
    USING (true);


-- ============================================================================
-- 5. INSTRUCCIONES PARA SUPABASE STORAGE
-- ============================================================================
/*
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │  CONFIGURACIÓN DEL BUCKET DE IMÁGENES EN SUPABASE STORAGE                 │
 │                                                                            │
 │  Ejecutar desde el Dashboard de Supabase → Storage:                        │
 │                                                                            │
 │  1. Crear un bucket llamado: product-images                                │
 │     - Marcar como PUBLIC para permitir lectura sin autenticación.           │
 │     - Tamaño máximo de archivo recomendado: 2 MB                           │
 │     - Tipos MIME permitidos: image/jpeg, image/png, image/webp             │
 │                                                                            │
 │  2. Políticas de acceso recomendadas (SQL):                                │
 │                                                                            │
 │     -- Lectura pública de imágenes                                         │
 │     CREATE POLICY "imagenes_lectura_publica"                               │
 │         ON storage.objects FOR SELECT                                       │
 │         USING (bucket_id = 'product-images');                              │
 │                                                                            │
 │     -- Solo usuarios autenticados pueden subir imágenes                    │
 │     CREATE POLICY "imagenes_subida_admin"                                  │
 │         ON storage.objects FOR INSERT                                       │
 │         TO authenticated                                                   │
 │         WITH CHECK (bucket_id = 'product-images');                         │
 │                                                                            │
 │     -- Solo usuarios autenticados pueden actualizar imágenes               │
 │     CREATE POLICY "imagenes_actualizacion_admin"                           │
 │         ON storage.objects FOR UPDATE                                       │
 │         TO authenticated                                                   │
 │         USING (bucket_id = 'product-images');                              │
 │                                                                            │
 │     -- Solo usuarios autenticados pueden eliminar imágenes                 │
 │     CREATE POLICY "imagenes_eliminacion_admin"                             │
 │         ON storage.objects FOR DELETE                                       │
 │         TO authenticated                                                   │
 │         USING (bucket_id = 'product-images');                              │
 │                                                                            │
 │  3. Estructura de carpetas sugerida dentro del bucket:                     │
 │     product-images/                                                        │
 │       ├── productores/{productor_id}/perfil.webp                           │
 │       └── productos/{producto_id}/foto.webp                                │
 │                                                                            │
 └─────────────────────────────────────────────────────────────────────────────┘
*/

-- ============================================================================
-- FIN DE LA MIGRACIÓN 001
-- ============================================================================
