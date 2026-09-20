# Spec de diseño — Rediseño visual "Guaitil"

**Fecha:** 2026-09-19
**Proyecto:** Directorio MIPYMES Guanacaste (TCU — UCR, Sede Guanacaste)
**Rama base:** `main` (incluye el refactor completo: RLS, contactos, recuperación de contraseña, `AdminLayout`)
**Rama de trabajo:** `rediseño-ui`

## 1. Objetivo

Reemplazar la estética actual (verde genérico, tipografía Inter, superficies blancas planas) por una identidad visual cálida y con carácter — **dirección "Guaitil"** — inspirada en la cerámica chorotega del pueblo de Guaitil (Guanacaste) y el bosque seco de la provincia. Aprobada por el usuario tras comparar tres direcciones en un artifact de mockups (barro/artesanal, limpia/moderna, vibrante/tropical).

El rediseño cubre **toda la aplicación**, público y panel admin, con el mismo sistema de colores y tipografía. Las páginas públicas (inicio, detalle) llevan además los toques decorativos (resplandor, íconos de fondo); el panel admin usa los mismos tokens pero **sin decoración** — se mantiene calmado y funcional, como corresponde a una herramienta de trabajo.

No cambia: lógica de negocio, composables, router, políticas RLS, ni ninguno de los 77 tests existentes (ninguno depende de clases CSS ni colores).

## 2. Mecanismo: tokens, no componentes

`src/assets/styles/main.css` ya centraliza todos los colores en variables CSS, y el bloque de alias de la rama `refactorizacion` incluye este comentario, escrito para este momento exacto:

> "El rediseño futuro solo tiene que redefinir estos alias."

Por eso el rediseño se implementa **casi enteramente redefiniendo valores de tokens existentes**, no reescribiendo cada componente. Los ~21 archivos `.vue` de la app ya consumen `var(--color-primary)`, `var(--bg-surface)`, `var(--text-primary)`, etc. — cambiar el valor detrás de esos nombres re-pinta toda la app.

Las únicas adiciones de código nuevo son: una tipografía de titulares, un mapa de color por categoría, y la decoración del hero en dos vistas públicas.

## 3. Tokens: valores nuevos

Todos en `src/assets/styles/main.css`, mismos nombres de variable, valores nuevos.

### 3.1 Colores primarios → rampa "barro" (clay)

Reemplaza la rampa verde genérica. `--color-primary-600` es el ancla (`#8C3B26`, el tono principal usado en el mockup aprobado para botones, enlaces y acentos).

```css
--color-primary-50:  #FBF1EA;
--color-primary-100: #F7E3D8;
--color-primary-200: #ECC0AC;
--color-primary-300: #D89478;
--color-primary-400: #BE6A4C;
--color-primary-500: #A4492F;
--color-primary-600: #8C3B26;
--color-primary-700: #6B2C1C;
--color-primary-800: #572415;
--color-primary-900: #3D1810;
```

### 3.2 Colores cálidos → rampa "monte" (forest)

Reemplaza la rampa ámbar. `--color-warm-600` ancla en `#3A5A34` (verde monte del mockup), usado como acento secundario.

```css
--color-warm-50:  #EEF3EA;
--color-warm-100: #DCE7D2;
--color-warm-200: #BFD4AC;
--color-warm-300: #9DBD84;
--color-warm-400: #7CA25F;
--color-warm-500: #5C8641;
--color-warm-600: #3A5A34;
--color-warm-700: #2E4829;
--color-warm-800: #24381F;
--color-warm-900: #1A2916;
```

### 3.3 Neutros → rampa gris con sesgo cálido

La rampa actual es gris frío (`#e5e5e5` de borde, etc.). Se sesga hacia tono tierra para que bordes y superficies apagadas combinen con el resto — un gris puro se ve "no elegido"; uno con sesgo cálido se ve intencional.

```css
--color-neutral-50:  #FAF7F2;
--color-neutral-100: #F3EDE2;
--color-neutral-200: #E6DCC9;
--color-neutral-300: #D3C4A8;
--color-neutral-400: #A99878;
--color-neutral-500: #7D6E56;
--color-neutral-600: #5A4E3C;
--color-neutral-700: #423A2C;
--color-neutral-800: #2E281E;
--color-neutral-900: #1E1A13;
```

### 3.4 Fondos y texto

```css
--bg-primary:   #FFFCF6;
--bg-secondary: #F3EBD9;  /* lienzo de página — sand */
--bg-surface:   #FFFDF9;  /* tarjetas/paneles — más claro que el lienzo */
--bg-muted:     #EFE6D2;

--text-primary:   #2B2016;
--text-secondary: #5F4C39;
--text-muted:     #8A7A66;
--text-inverse:   #FFFFFF;  /* sin cambio */
```

Nota de layout: las tarjetas quedan **más claras** que el fondo de página (`--bg-surface` más claro que `--bg-secondary`), no al revés — así ganan una sensación de "elevadas" sin depender de sombras fuertes. Coincide con el mockup aprobado.

### 3.5 Colores que NO cambian

- `--color-whatsapp` (`#25D366`): es el verde reconocible de WhatsApp, no parte de la marca del sitio. Se deja igual.
- `--color-success` / `--color-warning` / `--color-error` / `--color-info`: colores semánticos (toasts, validación). Cambiarlos arriesga que un error deje de leerse como error. Se dejan igual.
- `--color-error-light` (`#fef2f2`): igual, es el fondo del mensaje de error existente.

### 3.6 Tipografía

Se agrega un token nuevo para titulares y se cambia el de cuerpo/UI.

```css
--font-headline: 'Fraunces', Georgia, serif;
--font-family:   'Work Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

En `index.html` (línea 30), reemplazar el `<link>` de Google Fonts que carga Inter (`family=Inter:wght@300;400;500;600;700`) por:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Work+Sans:wght@400;500;600;700&display=swap"
  rel="stylesheet"
/>
```

`--font-headline` se usa en: `h1`/`h2` de vistas, nombre de negocio en tarjetas y detalle, números de los KPI del panel admin, nombre de marca en el header. Todo lo demás (párrafos, botones, formularios, tabla) sigue en `--font-family`.

### 3.7 Radios de borde

Los valores actuales ya sirven casi sin cambio (`--radius-xl: 1rem` = 16px coincide con las tarjetas del mockup). Regla de aplicación, no de valor:

- Tarjetas, paneles, inputs de texto: `var(--radius-xl)`.
- Buscador, botones primarios, badges/chips, avatar: `var(--radius-full)`.
- Controles pequeños (select, checkbox visual): `var(--radius-md)`.

No se agregan tokens de radio nuevos.

## 4. Color por categoría

Nuevo módulo puro, testeable como los de `src/utils/`:

**`src/utils/categoriaColor.js`**

```js
/**
 * Color de acento por categoría de alimento.
 *
 * Cada categoría real de la base de datos tiene un color propio dentro
 * de la paleta cálida del sitio (ninguno saturado/chillón). Una
 * categoría no contemplada (ej. si el TCU agrega una nueva) usa el
 * color de marca por defecto.
 */
export const CATEGORIA_COLORES = {
  'Frutas y Verduras':      { bg: '#3F6B37', texto: '#EAF3E4' },
  'Lácteos':                { bg: '#C79A3E', texto: '#3A2A0F' },
  'Carnes y Embutidos':     { bg: '#7A3226', texto: '#F5E3DC' },
  'Granos y Cereales':      { bg: '#8A7B3E', texto: '#FBF6E4' },
  'Miel y Derivados':       { bg: '#B9791E', texto: '#FFF2DC' },
  'Productos Artesanales':  { bg: '#9C5A3C', texto: '#F8EAE1' },
  'Condimentos y Especias': { bg: '#B5451F', texto: '#FCE8DD' },
  'Bebidas':                { bg: '#3C6B63', texto: '#E7F3EF' },
  'Panadería y Repostería': { bg: '#6B4226', texto: '#F3E6D8' },
}

const COLOR_POR_DEFECTO = { bg: '#8C3B26', texto: '#F7E9DF' }

/**
 * @param {string} nombreCategoria
 * @returns {{bg: string, texto: string}}
 */
export function colorDeCategoria(nombreCategoria) {
  return CATEGORIA_COLORES[nombreCategoria] ?? COLOR_POR_DEFECTO
}
```

**Dónde se usa** (todas ya renderizan `producer.categorias[].categoria.nombre`, solo cambia cómo se pinta el badge):

- `src/components/producers/ProducerCard.vue` — badges de categoría en la tarjeta pública.
- `src/views/ProducerDetailView.vue` — badges en el detalle.
- `src/components/admin/ProducerTable.vue` — badges de categoría en la tabla del panel admin. Esto es lo que extiende "el mismo lenguaje de diseño" al admin que pediste.

Cada uno usa `:style="{ background: colorDeCategoria(cat.categoria.nombre).bg, color: colorDeCategoria(cat.categoria.nombre).texto }"` en el badge, en vez de una clase de color fija.

## 5. Vista por vista

### 5.1 Públicas — con decoración

**`HomeView.vue`** — hero centrado (una columna, no dos): insignia "Guanacaste, Costa Rica" en píldora clay, titular en `--font-headline`, subtítulo, buscador en píldora, fila de 3 estadísticas (cantones/categorías/gratuito) debajo del buscador. Fondo del hero con un resplandor radial cálido detrás del titular (`radial-gradient` sutil, ~15% opacidad, tono clay) y 4 íconos lineales decorativos en las esquinas del hero a ~20% de opacidad (hoja, espiga, panal, zigzag chorotega) — todo exactamente como en el artifact aprobado. El resto de la vista (filtros + grilla) solo recibe recolor por tokens, sin cambios estructurales.

**`ProducerDetailView.vue`** — mismo recolor por tokens. Se agrega **solo** el resplandor radial detrás del encabezado/portada (sin los 4 íconos — es una página de un producto, no una portada; menos decoración es más apropiado). Badges de categoría con `colorDeCategoria`.

**`SearchBar.vue`, `ProducerFilters.vue`, `ProducerGrid.vue`, `ProducerCard.vue`** — recolor por tokens; tarjetas con `--radius-xl`; buscador y botones en píldora.

**`AppHeader.vue`, `AppFooter.vue`** — recolor por tokens. El ícono de marca (hoja) pasa a usar el verde monte (`--color-warm-600`) o clay, a elección de quien lo implemente entre esas dos opciones — ambas funcionan, no hace falta prescribir cuál.

### 5.2 Públicas — sin decoración (utilitarias)

**`LoginView.vue`, `ResetPasswordView.vue`** — recolor por tokens. Título "Iniciar Sesión" en `--font-headline`. Sin resplandor ni íconos: son pantallas de una sola tarea, no portadas.

### 5.3 Panel admin — mismos tokens, sin decoración

**`AdminLayout.vue`, `AdminSidebar.vue`** — recolor por tokens. El estado activo del enlace de navegación usa `--color-primary-600` (clay) en vez del verde actual.

**`AdminDashboardView.vue`** — las 4 tarjetas KPI: número en `--font-headline` con color `--color-primary-600` o `--color-warm-600` (alternar o elegir uno, criterio de quien implemente), etiqueta en `--text-secondary`. Sin fondo decorativo.

**`ProducerTable.vue`** — recolor por tokens; badges de categoría con `colorDeCategoria` (ver sección 4).

**`ProducerForm.vue`, `ImageUploader.vue`** — recolor por tokens: inputs, focus ring, botón primario. Nice-to-have (no obligatorio): los checkboxes de categoría en el formulario podrían mostrar un adelanto de `colorDeCategoria` al marcarse — se deja a criterio de la implementación, no es requisito de esta spec.

**`AppToast.vue`, `LoadingSpinner.vue`** — recolor por tokens únicamente.

## 6. Favicon

`public/favicon.svg` (la hoja actual) actualiza sus colores a la paleta nueva: forma de hoja en verde monte (`#3A5A34`), detalle/vena en clay (`#8C3B26`). Mismo diseño, colores nuevos.

## 7. Verificación

Este rediseño es casi enteramente visual, así que no aplica TDD de la misma forma que el refactor:

- `npm test` debe seguir en 77/77 — ningún test depende de CSS ni de colores; si alguno fallara, sería señal de que se tocó markup/lógica fuera de lo que pide esta spec.
- `npm run build` sin errores.
- **Sí hace falta un test nuevo**: `tests/utils/categoriaColor.test.js` para `colorDeCategoria` — las 9 categorías conocidas devuelven su color, una categoría desconocida devuelve el color por defecto.
- Verificación visual manual: `npm run dev`, recorrer Inicio, Detalle, Login, Recuperar contraseña, y (con sesión) Panel, Nuevo/Editar productor — confirmar que coincide con el artifact aprobado y que no quedó ningún color/fuente vieja visible (buscar visualmente cualquier verde `#22c55e`/Inter residual).

## 8. Fuera de alcance

- Uso de Superdesign (se evaluó, requiere cuenta externa y créditos; se descartó a favor de mockups propios).
- Rediseño de `productos_destacados` (Fase 3, no implementada aún).
- Ajustes de layout más allá de los descritos (el refactor ya dejó todo responsive; este rediseño no reabre esa capa).
- Cambiar la lógica de `useToast`, `useAuth`, `useProductores`, RLS, router, etc.
