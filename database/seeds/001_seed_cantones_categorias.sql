-- ============================================================================
-- SEED 001: Cantones de Guanacaste y Categorías de Productos
-- Proyecto: Directorio B2B - MiPymes Guanacaste (TCU)
-- Descripción: Datos iniciales para las tablas de referencia del directorio.
-- Fecha: 2026-06-18
-- ============================================================================

-- ============================================================================
-- 1. CANTONES DE LA PROVINCIA DE GUANACASTE
-- Los 11 cantones oficiales según la división territorial de Costa Rica.
-- ============================================================================

INSERT INTO cantones (nombre) VALUES
    ('Liberia'),
    ('Nicoya'),
    ('Santa Cruz'),
    ('Bagaces'),
    ('Carrillo'),
    ('Cañas'),
    ('Abangares'),
    ('Tilarán'),
    ('Nandayure'),
    ('La Cruz'),
    ('Hojancha')
ON CONFLICT (nombre) DO NOTHING;


-- ============================================================================
-- 2. CATEGORÍAS DE PRODUCTOS
-- Clasificaciones principales de productos alimenticios ofrecidos por
-- los productores locales. Cada categoría incluye un emoji representativo
-- para uso en la interfaz de usuario.
-- ============================================================================

INSERT INTO categorias (nombre, icono) VALUES
    ('Frutas y Verduras',      '🥬'),
    ('Lácteos',                '🧀'),
    ('Carnes y Embutidos',     '🥩'),
    ('Granos y Cereales',      '🌾'),
    ('Miel y Derivados',       '🍯'),
    ('Productos Artesanales',  '🫙'),
    ('Condimentos y Especias', '🌶️'),
    ('Bebidas',                '🧃'),
    ('Panadería y Repostería', '🥖')
ON CONFLICT (nombre) DO NOTHING;


-- ============================================================================
-- FIN DEL SEED 001
-- ============================================================================
