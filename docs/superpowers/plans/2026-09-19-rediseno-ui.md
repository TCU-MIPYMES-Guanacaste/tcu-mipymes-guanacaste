# Rediseño visual "Guaitil" — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar la estética actual (verde genérico + Inter + superficies blancas planas) por la identidad "Guaitil" (barro chorotega + verde monte + arena), en toda la app pública y admin, redefiniendo tokens CSS y agregando decoración solo en las dos vistas públicas principales.

**Architecture:** El 95% del rediseño ocurre redefiniendo los valores de los tokens existentes en `src/assets/styles/main.css` — los ~21 componentes `.vue` ya consumen `var(--color-*)`, `var(--bg-*)` y `var(--text-*)`, así que cambiar el valor detrás del nombre re-pinta toda la app sin tocar lógica. Encima de esa base se agregan tres cosas nuevas: una tipografía de titulares (`--font-headline`), un módulo puro `src/utils/categoriaColor.js` que da un color propio a cada categoría de alimento, y la decoración del hero (resplandor radial + 4 íconos lineales) en `HomeView.vue` y `ProducerDetailView.vue`.

**Tech Stack:** Vue 3 (Composition API, `<script setup>`), Vite 5, Vue Router 4, Vitest 2, CSS plano con variables (sin Tailwind, sin preprocesador), Supabase JS (sin cambios en esta rama).

**Spec:** `docs/superpowers/specs/2026-09-19-rediseno-ui-design.md`

## Global Constraints

Estas reglas aplican a **todas** las tareas del plan:

- Todo el código, comentarios y mensajes de commit en español.
- Solo Vue 3 Composition API con `<script setup>`. Sin Pinia, sin TypeScript.
- No debe romper los 77 tests existentes (composables/utils/router — ninguno depende de CSS ni colores).
- `npm run build` debe seguir en 0 errores después de cada tarea.
- `--color-whatsapp`, `--color-success`, `--color-warning`, `--color-error`, `--color-info`, `--color-error-light` NO cambian de valor.
- La decoración (resplandor + íconos de fondo) va SOLO en `HomeView.vue` (resplandor + 4 íconos) y `ProducerDetailView.vue` (solo resplandor, sin íconos). Ningún otro archivo lleva esta decoración — en particular, nada del panel admin.
- Los nombres exactos de token a redefinir (no renombrar) están en la spec sección 3: `--color-primary-50..900`, `--color-warm-50..900`, `--color-neutral-50..900`, `--bg-primary`, `--bg-secondary`, `--bg-surface`, `--bg-muted`, `--text-primary`, `--text-secondary`, `--text-muted`, y los nuevos `--font-headline` / valor nuevo de `--font-family`.
- El nuevo módulo se llama exactamente `src/utils/categoriaColor.js`, exporta `CATEGORIA_COLORES` y `colorDeCategoria(nombreCategoria)`, con la forma de retorno `{ bg, texto }` — usar esos nombres exactos en todo el plan.
- Mensajes de commit terminan con `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.

### Valores de la paleta (fuente de verdad para verificación visual)

| Token | Valor | Uso |
|---|---|---|
| `--color-primary-600` | `#8C3B26` | Clay: botones primarios, enlaces, acentos, encabezado |
| `--color-primary-700` | `#6B2C1C` | Hover de botones/enlaces |
| `--color-warm-600` | `#3A5A34` | Verde monte: acento secundario, marca |
| `--bg-secondary` | `#F3EBD9` | Lienzo de página (arena) |
| `--bg-surface` | `#FFFDF9` | Tarjetas y paneles (más claro que el lienzo) |
| `--text-primary` | `#2B2016` | Texto principal |
| `--font-headline` | `'Fraunces', Georgia, serif` | Titulares |
| `--font-family` | `'Work Sans', …` | Cuerpo/UI |

---

## Estructura de archivos

**Se crean:**

| Archivo | Responsabilidad |
|---|---|
| `src/utils/categoriaColor.js` | Mapa puro categoría → `{ bg, texto }` + función `colorDeCategoria` con color por defecto. Sin dependencias. |
| `tests/utils/categoriaColor.test.js` | Test unitario Vitest del módulo anterior. |

**Se modifican:**

| Archivo | Qué cambia |
|---|---|
| `src/assets/styles/main.css` | Valores de todos los tokens de color, tipografía nueva, radios de inputs/botones/tarjetas, anillo de foco. **Base de todo el rediseño.** |
| `index.html` | Enlace de Google Fonts: Inter → Fraunces + Work Sans. |
| `public/favicon.svg` | Mismos trazos, colores nuevos. |
| `src/components/common/SearchBar.vue` | Recolor + buscador en píldora. |
| `src/components/producers/ProducerCard.vue` | Recolor, tarjeta `--radius-xl`, badges con `colorDeCategoria`. |
| `src/components/producers/ProducerFilters.vue` | Recolor, panel `--radius-xl` con borde izquierdo clay. |
| `src/views/HomeView.vue` | Hero nuevo: insignia, resplandor, 4 íconos, fila de estadísticas. |
| `src/views/ProducerDetailView.vue` | Resplandor detrás del encabezado, badges con `colorDeCategoria`, recolor. |
| `src/components/common/AppHeader.vue` | Marca: emoji 🌿 → SVG de hoja en verde monte; titular en `--font-headline`. |
| `src/components/producers/WhatsAppButton.vue` | Botón en píldora (color WhatsApp intacto). |
| `src/views/LoginView.vue` | Recolor, tarjeta `--radius-xl`, botón en píldora. |
| `src/views/ResetPasswordView.vue` | Igual que login. |
| `src/components/admin/AdminSidebar.vue` | Recolor; enlace activo en clay. |
| `src/views/admin/AdminDashboardView.vue` | KPIs en `--font-headline`, alternando clay/monte. |
| `src/components/admin/ProducerTable.vue` | Badges con `colorDeCategoria`; estado activo en verde monte; botón editar en clay. |
| `src/components/admin/ProducerForm.vue` | Tarjeta `--radius-xl`. |
| `src/components/admin/ImageUploader.vue` | Zona de arrastre `--radius-xl`. |

**Se verifican sin modificar** (ya consumen tokens; el cambio les llega solo): `src/App.vue`, `src/layouts/AdminLayout.vue`, `src/components/common/AppFooter.vue`, `src/components/common/AppToast.vue`, `src/components/common/LoadingSpinner.vue`, `src/components/producers/ProducerGrid.vue`, `src/views/admin/ProducerCreateView.vue`, `src/views/admin/ProducerEditView.vue`.

**Orden de dependencias:** Tarea 1 (tokens) es la base de todo. Tarea 2 (`categoriaColor.js`) es independiente y la consumen las tareas 3, 5 y 8. Las demás son independientes entre sí una vez que 1 y 2 están en el árbol.

---

### Tarea 1: Fundación — tokens, tipografía y favicon

**Files:**
- Modify: `src/assets/styles/main.css:1-7` (comentario de cabecera), `:19-29` (rampa primaria), `:31-41` (rampa cálida), `:43-53` (rampa neutra), `:62-72` (fondos y texto), `:74-75` (tipografía), `:153-162` (titulares), `:180-201` (formularios base), `:213-225` (`.btn`), `:286-293` (`.card`)
- Modify: `index.html:26-32`
- Modify: `public/favicon.svg` (archivo completo, 6 líneas)
- Test: no aplica (cambio puramente visual; se verifica a ojo + `npm run build` + `npm test`)

**Interfaces:**
- Consumes: nada.
- Produces: los tokens CSS que consumen todas las tareas siguientes. En particular `--color-primary-600` = `#8C3B26`, `--color-primary-700` = `#6B2C1C`, `--color-warm-600` = `#3A5A34`, `--bg-secondary` = `#F3EBD9`, `--bg-surface` = `#FFFDF9`, `--text-primary` = `#2B2016`, `--text-secondary` = `#5F4C39`, `--text-muted` = `#8A7A66`, y el token nuevo `--font-headline` = `'Fraunces', Georgia, serif`. Los alias existentes (`--color-primary`, `--color-primary-dark`, `--color-primary-light`, `--color-border`, `--color-text`, `--color-text-muted`, `--color-surface`, `--color-surface-dark`, `--color-text-light`) **no se renombran**: siguen apuntando a los mismos nombres de token y heredan los valores nuevos automáticamente.

- [ ] **Step 1: Reemplazar el comentario de cabecera de `main.css`**

En `src/assets/styles/main.css`, reemplazar las líneas 1-7 por:

```css
/* ============================================================================
   ESTILOS GLOBALES
   Directorio MIPYMES Guanacaste — TCU Universidad de Costa Rica

   Paleta "Guaitil": inspirada en la cerámica chorotega del pueblo de Guaitil
   y el bosque seco de Guanacaste. Barro (clay) como color principal, verde
   monte como acento y arena como lienzo de página.
   ============================================================================ */
```

- [ ] **Step 2: Reemplazar la rampa de colores primarios**

Reemplazar las líneas 19-29 (bloque `--- Colores Primarios (Verdes orgánicos) ---` completo, desde el comentario hasta `--color-primary-900`) por:

```css
  /* --- Colores Primarios (Barro chorotega / clay) --- */
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

- [ ] **Step 3: Reemplazar la rampa de colores cálidos**

Reemplazar las líneas 31-41 (bloque `--- Colores Cálidos (Acento tierra/cosecha) ---` completo) por:

```css
  /* --- Colores Cálidos (Verde monte / bosque seco) --- */
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

- [ ] **Step 4: Reemplazar la rampa de neutros**

Reemplazar las líneas 43-53 (bloque `--- Colores Neutros ---` completo) por:

```css
  /* --- Colores Neutros (gris con sesgo cálido/tierra) --- */
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

NO tocar el bloque `--- Colores Semánticos ---` (líneas 55-60): `--color-success`, `--color-warning`, `--color-error`, `--color-info` y `--color-whatsapp` se quedan exactamente como están.

- [ ] **Step 5: Reemplazar fondos y texto**

Reemplazar las líneas 62-72 (bloques `--- Fondos ---` y `--- Texto ---`) por:

```css
  /* --- Fondos --- */
  --bg-primary:   #FFFCF6;
  --bg-secondary: #F3EBD9;  /* lienzo de página — arena */
  --bg-surface:   #FFFDF9;  /* tarjetas/paneles — más claro que el lienzo */
  --bg-muted:     #EFE6D2;

  /* --- Texto --- */
  --text-primary:   #2B2016;
  --text-secondary: #5F4C39;
  --text-muted:     #8A7A66;
  --text-inverse:   #FFFFFF;
```

- [ ] **Step 6: Agregar `--font-headline` y cambiar `--font-family`**

Reemplazar las líneas 74-75 (el comentario `/* --- Tipografía --- */` y la línea `--font-family: 'Inter', ...`) por:

```css
  /* --- Tipografía --- */
  --font-headline: 'Fraunces', Georgia, serif;
  --font-family: 'Work Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

El resto del bloque (`--font-size-xs` … `--font-size-4xl`) no cambia.

- [ ] **Step 7: Aplicar la tipografía de titulares a `h1` y `h2`**

Reemplazar las líneas 153-162 (bloque `/* ---- Tipografía ---- */`, desde `h1, h2, h3, h4, h5, h6 {` hasta `h4 { font-size: var(--font-size-xl); }`) por:

```css
h1, h2, h3, h4, h5, h6 {
  font-weight: 600;
  line-height: 1.3;
  color: var(--text-primary);
}

/* Solo los titulares de primer y segundo nivel usan la serif. Los h3/h4
   son etiquetas de UI (paneles, tarjetas) y siguen en la tipografía de
   cuerpo para no recargar la pantalla. */
h1, h2 {
  font-family: var(--font-headline);
}

h1 { font-size: var(--font-size-4xl); }
h2 { font-size: var(--font-size-3xl); }
h3 { font-size: var(--font-size-2xl); }
h4 { font-size: var(--font-size-xl); }
```

- [ ] **Step 8: Ajustar radios de formularios y el anillo de foco**

Reemplazar las líneas 180-201 (bloque `/* ---- Formularios Base ---- */` completo, desde el comentario hasta el cierre de la regla `input:focus, select:focus, textarea:focus`) por:

```css
/* ---- Formularios Base ---- */
input,
select,
textarea {
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  padding: var(--spacing-3) var(--spacing-4);
  border: 1px solid var(--color-neutral-300);
  border-radius: var(--radius-xl);
  background-color: var(--bg-primary);
  color: var(--text-primary);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  width: 100%;
}

/* Los select son controles pequeños: radio medio, no de tarjeta. */
select {
  border-radius: var(--radius-md);
}

input:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px rgba(140, 59, 38, 0.15);
}
```

(El `rgba(140, 59, 38, 0.15)` es `--color-primary-600` en rgba; reemplaza al verde `rgba(34, 197, 94, 0.15)`.)

- [ ] **Step 9: Poner los botones `.btn` en píldora**

En el bloque `/* ---- Botones Base ---- */`, dentro de la regla `.btn { … }` (línea 213 en adelante), cambiar:

```css
  border-radius: var(--radius-md);
```

por:

```css
  border-radius: var(--radius-full);
```

Ojo: la regla `button { … }` de la línea 204 también tiene `border-radius: var(--radius-md);` — esa **no** se toca (aplica a botones sueltos, no a los `.btn`). Solo cambia la que está dentro de `.btn`.

- [ ] **Step 10: Tarjetas con radio grande**

En la regla `.card { … }` (línea 286 en adelante), cambiar:

```css
  border-radius: var(--radius-lg);
```

por:

```css
  border-radius: var(--radius-xl);
```

- [ ] **Step 11: Cambiar la fuente en `index.html`**

Reemplazar las líneas 26-32 de `index.html` por:

```html
    <!-- Google Fonts - Fraunces (titulares) + Work Sans (cuerpo/UI) -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Work+Sans:wght@400;500;600;700&display=swap"
      rel="stylesheet"
    />
```

- [ ] **Step 12: Recolorear el favicon**

Reemplazar el contenido completo de `public/favicon.svg` por:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="7" fill="#F3EBD9"/>
  <path d="M16 26V14" stroke="#8C3B26" stroke-width="2.4" stroke-linecap="round"/>
  <path d="M16 15c-5 0-8-3.5-8-8 5 0 8 3.5 8 8Z" fill="#3A5A34"/>
  <path d="M16 18c0-5 3-8 8-8 0 5-3 8-8 8Z" fill="#5C8641"/>
</svg>
```

(Mismos trazos que antes: fondo arena, hoja en verde monte y vena/tallo en clay, tal como pide la spec sección 6.)

- [ ] **Step 13: Verificación visual**

Ejecutar: `npm run dev`

Abrir `http://localhost:5173/` y confirmar con las DevTools del navegador (pestaña Elements → Computed):

1. `body` tiene `background-color: rgb(243, 235, 217)` (= `#F3EBD9`, arena). Antes era casi blanco.
2. El encabezado superior es **barro** (`#8C3B26`), no verde.
3. El titular "Descubre productores locales en Guanacaste" se renderiza en **Fraunces** (serif con contraste marcado). En Computed → `font-family` debe decir `Fraunces`.
4. El texto de párrafos y botones se renderiza en **Work Sans**, no en Inter.
5. Hacer clic en el campo de búsqueda: el anillo de foco es **rojizo/barro**, no verde.
6. En la pestaña Network, filtrar por `fonts.googleapis.com`: hay una sola petición de CSS y su URL contiene `Fraunces` y `Work+Sans`; no hay ninguna petición a `family=Inter`.
7. La pestaña del navegador muestra el favicon con hoja verde oscura sobre fondo arena.
8. Buscar visualmente cualquier verde brillante tipo `#22c55e` que haya quedado: no debe verse ninguno en la página de inicio (el único verde permitido es el de WhatsApp en el detalle de productor).

Detener el servidor con `Ctrl+C` al terminar.

- [ ] **Step 14: Verificar build**
Run: `npm run build`
Expected: termina sin errores (0 errors).

- [ ] **Step 15: Verificar tests**
Run: `npm test`
Expected: PASS — 77 tests pasando, mismo número que antes.

- [ ] **Step 16: Commit**
```bash
git add src/assets/styles/main.css index.html public/favicon.svg
git commit -m "feat(ui): paleta Guaitil, tipografía Fraunces/Work Sans y favicon nuevo

Redefine los valores de los tokens de color (rampas barro, monte y
neutro cálido), fondos y texto en main.css. Agrega --font-headline y
cambia --font-family. Los colores semánticos y el verde de WhatsApp
quedan intactos.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Tarea 2: Módulo de color por categoría

**Files:**
- Create: `src/utils/categoriaColor.js`
- Test: `tests/utils/categoriaColor.test.js`

**Interfaces:**
- Consumes: nada (módulo puro, sin dependencias).
- Produces:
  - `export const CATEGORIA_COLORES` — objeto plano cuyas claves son los nombres exactos de las 9 categorías de la base de datos y cuyos valores son `{ bg: string, texto: string }`.
  - `export function colorDeCategoria(nombreCategoria: string): { bg: string, texto: string }` — devuelve el color de la categoría o un color por defecto (barro) si el nombre no está en el mapa.

- [ ] **Step 1: Escribir el test que falla**

Crear `tests/utils/categoriaColor.test.js` con este contenido exacto:

```js
import { describe, it, expect } from 'vitest'
import { CATEGORIA_COLORES, colorDeCategoria } from '@/utils/categoriaColor'

describe('CATEGORIA_COLORES', () => {
  it('cubre las nueve categorías de la base de datos', () => {
    expect(Object.keys(CATEGORIA_COLORES)).toHaveLength(9)
  })

  it('cada categoría define fondo y color de texto', () => {
    for (const [nombre, color] of Object.entries(CATEGORIA_COLORES)) {
      expect(color, `falta bg/texto en "${nombre}"`).toEqual({
        bg: expect.stringMatching(/^#[0-9A-Fa-f]{6}$/),
        texto: expect.stringMatching(/^#[0-9A-Fa-f]{6}$/),
      })
    }
  })
})

describe('colorDeCategoria', () => {
  it('devuelve el color propio de cada categoría conocida', () => {
    expect(colorDeCategoria('Frutas y Verduras')).toEqual({ bg: '#3F6B37', texto: '#EAF3E4' })
    expect(colorDeCategoria('Lácteos')).toEqual({ bg: '#C79A3E', texto: '#3A2A0F' })
    expect(colorDeCategoria('Carnes y Embutidos')).toEqual({ bg: '#7A3226', texto: '#F5E3DC' })
    expect(colorDeCategoria('Granos y Cereales')).toEqual({ bg: '#8A7B3E', texto: '#FBF6E4' })
    expect(colorDeCategoria('Miel y Derivados')).toEqual({ bg: '#B9791E', texto: '#FFF2DC' })
    expect(colorDeCategoria('Productos Artesanales')).toEqual({ bg: '#9C5A3C', texto: '#F8EAE1' })
    expect(colorDeCategoria('Condimentos y Especias')).toEqual({ bg: '#B5451F', texto: '#FCE8DD' })
    expect(colorDeCategoria('Bebidas')).toEqual({ bg: '#3C6B63', texto: '#E7F3EF' })
    expect(colorDeCategoria('Panadería y Repostería')).toEqual({ bg: '#6B4226', texto: '#F3E6D8' })
  })

  it('usa el color de marca por defecto para una categoría no contemplada', () => {
    expect(colorDeCategoria('Categoría Nueva del TCU')).toEqual({ bg: '#8C3B26', texto: '#F7E9DF' })
  })

  it('usa el color por defecto para vacío, null o undefined', () => {
    expect(colorDeCategoria('')).toEqual({ bg: '#8C3B26', texto: '#F7E9DF' })
    expect(colorDeCategoria(null)).toEqual({ bg: '#8C3B26', texto: '#F7E9DF' })
    expect(colorDeCategoria(undefined)).toEqual({ bg: '#8C3B26', texto: '#F7E9DF' })
  })

  it('distingue mayúsculas y acentos: "lacteos" sin tilde no es "Lácteos"', () => {
    expect(colorDeCategoria('lacteos')).toEqual({ bg: '#8C3B26', texto: '#F7E9DF' })
  })
})
```

- [ ] **Step 2: Correr el test y verificar que falla**
Run: `npm test -- categoriaColor`
Expected: FAIL — el módulo `@/utils/categoriaColor` todavía no existe, así que Vitest reporta un error de resolución de importación.

- [ ] **Step 3: Escribir la implementación mínima**

Crear `src/utils/categoriaColor.js` con este contenido exacto:

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

- [ ] **Step 4: Correr el test y verificar que pasa**
Run: `npm test -- categoriaColor`
Expected: PASS — 6 tests del archivo `categoriaColor.test.js` pasando.

- [ ] **Step 5: Correr la suite completa**
Run: `npm test`
Expected: PASS — 83 tests (los 77 anteriores + los 6 nuevos). Ningún test previo se rompe.

- [ ] **Step 6: Verificar build**
Run: `npm run build`
Expected: termina sin errores (0 errors).

- [ ] **Step 7: Commit**
```bash
git add src/utils/categoriaColor.js tests/utils/categoriaColor.test.js
git commit -m "feat(ui): módulo de color por categoría de alimento

Agrega colorDeCategoria() con un color propio para cada una de las
nueve categorías de la base de datos y un color de marca por defecto
para categorías no contempladas.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Tarea 3: Componentes públicos de listado (buscador, filtros, tarjeta, grilla)

**Files:**
- Modify: `src/components/common/SearchBar.vue:79-119` (bloque `<style scoped>`)
- Modify: `src/components/producers/ProducerCard.vue:11-37` (`<script setup>`), `:64-72` (badges del template), `:78-147` (bloque `<style scoped>`)
- Modify: `src/components/producers/ProducerFilters.vue:88-147` (bloque `<style scoped>`)
- Verify only (sin cambios de código): `src/components/producers/ProducerGrid.vue`
- Test: no aplica (recolor visual; se verifica a ojo + `npm run build` + `npm test`)

**Interfaces:**
- Consumes: los tokens de la Tarea 1 (`--color-primary-600` = `#8C3B26`, `--color-primary-700` = `#6B2C1C`, `--bg-surface` = `#FFFDF9`, `--color-neutral-200`/`-300`, `--radius-xl`, `--radius-full`, `--font-headline`). Y de la Tarea 2: `import { colorDeCategoria } from '@/utils/categoriaColor'`, que recibe el nombre de la categoría (string) y devuelve `{ bg, texto }`.
- Produces: nada que otra tarea consuma.

- [ ] **Step 1: Buscador en píldora**

En `src/components/common/SearchBar.vue`, reemplazar las reglas `.search-input`, `.search-input:focus`, `.search-clear`, `.search-button` y `.search-button:hover` (líneas 79-119) por:

```css
.search-input {
  width: 100%;
  padding: 0.75rem 2.5rem 0.75rem 2.5rem;
  border: 1px solid var(--color-neutral-300);
  border-radius: var(--radius-full);
  background-color: var(--bg-surface);
  color: var(--text-primary);
  font-size: 1rem;
  font-family: inherit;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary-600);
  box-shadow: 0 0 0 3px rgba(140, 59, 38, 0.15);
}

.search-clear {
  position: absolute;
  right: 0.75rem;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  font-size: 1rem;
  padding: 0.25rem;
}

.search-button {
  padding: 0.75rem 1.5rem;
  background-color: var(--color-primary-600);
  color: var(--text-inverse);
  border: none;
  border-radius: var(--radius-full);
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.search-button:hover {
  background-color: var(--color-primary-700);
}
```

- [ ] **Step 2: Importar `colorDeCategoria` en la tarjeta**

En `src/components/producers/ProducerCard.vue`, dentro del `<script setup>`, agregar el import justo después de la línea `import { getPublicImageUrl } from '@/lib/supabase'` (línea 14):

```js
import { colorDeCategoria } from '@/utils/categoriaColor'
```

El bloque de imports queda así:

```js
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { getPublicImageUrl } from '@/lib/supabase'
import { colorDeCategoria } from '@/utils/categoriaColor'
```

No hay que declarar nada más: `colorDeCategoria` queda disponible en el template automáticamente por ser `<script setup>`.

- [ ] **Step 3: Pintar cada badge con el color de su categoría**

En el mismo archivo, reemplazar el bloque de etiquetas del template (líneas 64-72) por:

```vue
      <!-- Etiquetas de categorías, cada una con su color propio -->
      <div v-if="categoryNames.length" class="card-tags">
        <span
          v-for="cat in categoryNames"
          :key="cat"
          class="card-tag"
          :style="{ background: colorDeCategoria(cat).bg, color: colorDeCategoria(cat).texto }"
        >
          {{ cat }}
        </span>
      </div>
```

- [ ] **Step 4: Recolorear la tarjeta**

En el mismo archivo, reemplazar las reglas `.producer-card`, `.producer-card:hover`, `.card-image`, `.card-img-placeholder`, `.card-title`, `.card-location` y `.card-tag` del bloque `<style scoped>` (líneas 78-147) por:

```css
.producer-card {
  display: flex;
  flex-direction: column;
  background: var(--bg-surface);
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(43, 32, 22, 0.06);
  transition: transform 0.2s, box-shadow 0.2s;
  text-decoration: none;
  color: inherit;
}

.producer-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(43, 32, 22, 0.12);
}

.card-image {
  aspect-ratio: 16 / 10;
  overflow: hidden;
  background-color: var(--bg-muted);
}

.card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-img-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  background-color: var(--bg-muted);
}

.card-body {
  padding: 1rem;
}

.card-title {
  font-family: var(--font-headline);
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 0.5rem;
  color: var(--text-primary);
}

.card-location {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin: 0 0 0.75rem;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

/* El fondo y el color de texto los pone colorDeCategoria() por :style. */
.card-tag {
  font-size: 0.75rem;
  padding: 0.2rem 0.6rem;
  border-radius: var(--radius-full);
  font-weight: 600;
}
```

- [ ] **Step 5: Recolorear el panel de filtros**

En `src/components/producers/ProducerFilters.vue`, reemplazar el bloque `<style scoped>` completo (líneas 88-147, es decir todo lo que hay entre `<style scoped>` y `</style>`) por:

```css
.producer-filters {
  padding: 1.25rem;
  background: var(--bg-surface);
  border: 1px solid var(--color-neutral-200);
  border-left: 4px solid var(--color-primary-600);
  border-radius: var(--radius-xl);
  box-shadow: 0 2px 8px rgba(43, 32, 22, 0.05);
}

.filters-title {
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 1rem;
  color: var(--text-secondary);
}

.filter-group {
  margin-bottom: 1rem;
}

.filter-label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 0.35rem;
  color: var(--text-secondary);
}

.filter-select {
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--color-neutral-300);
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  font-family: inherit;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  cursor: pointer;
  transition: border-color 0.2s;
}

.filter-select:focus {
  outline: none;
  border-color: var(--color-primary-600);
}

.filter-clear {
  width: 100%;
  padding: 0.5rem;
  margin-top: 0.5rem;
  background: none;
  border: 1px solid var(--color-neutral-300);
  border-radius: var(--radius-full);
  color: var(--text-secondary);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-clear:hover {
  border-color: var(--color-primary-600);
  color: var(--color-primary-600);
}
```

- [ ] **Step 6: Verificación visual**

Ejecutar: `npm run dev`

Abrir `http://localhost:5173/` y confirmar:

1. **Buscador**: el campo de texto y el botón "Buscar" son **píldoras** (bordes completamente redondeados, no rectángulos con esquinas suaves). El botón es barro `#8C3B26` y al pasar el mouse se oscurece a `#6B2C1C`.
2. **Panel "Filtrar por"**: fondo casi blanco (`#FFFDF9`), claramente **más claro** que el lienzo arena de la página, con una **barra vertical barro de 4px pegada al borde izquierdo**.
3. **Tarjetas de productor**: fondo `#FFFDF9`, esquinas de 16px, borde fino color arena oscura. Se ven "elevadas" sobre el fondo de página.
4. **Nombre del negocio en cada tarjeta**: en Fraunces (serif). Verificar en DevTools → Computed → `font-family` contiene `Fraunces`.
5. **Badges de categoría**: cada categoría tiene su **propio color**, no todas el mismo rosado. Comparar contra la tabla del módulo: una tarjeta con "Frutas y Verduras" debe tener el badge verde `#3F6B37` con texto claro; una con "Lácteos", mostaza `#C79A3E` con texto oscuro; una con "Miel y Derivados", ámbar `#B9791E`. Si un productor tiene una categoría que no está entre las nueve, su badge sale barro `#8C3B26`.
6. **Grilla sin resultados**: escribir algo sin coincidencias en el buscador y pulsar Buscar. El mensaje "No se encontraron productores…" debe leerse con buen contraste sobre el fondo arena (`ProducerGrid.vue` no se modifica: hereda los tokens nuevos). Si el texto se viera lavado o ilegible, ese es el único caso en el que hay que tocar `ProducerGrid.vue`.

Detener el servidor con `Ctrl+C` al terminar.

- [ ] **Step 7: Verificar build**
Run: `npm run build`
Expected: termina sin errores (0 errors).

- [ ] **Step 8: Verificar tests**
Run: `npm test`
Expected: PASS — 83 tests pasando, sin cambios respecto a la tarea anterior.

- [ ] **Step 9: Commit**
```bash
git add src/components/common/SearchBar.vue src/components/producers/ProducerCard.vue src/components/producers/ProducerFilters.vue
git commit -m "feat(ui): recolor de buscador, filtros y tarjeta pública

Buscador y botón en píldora, panel de filtros con borde barro, tarjetas
con radio grande sobre superficie clara y badges de categoría con su
color propio vía colorDeCategoria().

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Tarea 4: Hero decorado de la página de inicio

**Files:**
- Modify: `src/views/HomeView.vue:60-69` (sección hero del template), `:100-151` (bloque `<style scoped>`)
- Test: no aplica (markup y CSS visuales; se verifica a ojo + `npm run build` + `npm test`)

**Interfaces:**
- Consumes: tokens de la Tarea 1 (`--color-primary-600`, `--font-headline`, `--text-primary`, `--text-secondary`, `--text-muted`, `--text-inverse`, `--radius-full`, `--font-size-xs`). También consume los `ref` que la vista ya tiene del composable `useCatalogos`: `cantones` y `categorias` (arreglos), ya importados y cargados en `onMounted`.
- Produces: nada que otra tarea consuma.

Notas de diseño (del artifact aprobado, dirección "Guaitil"):
- El resplandor es un `radial-gradient` barro al 16% centrado detrás del titular.
- Los 4 íconos son SVG lineales en las esquinas del hero: hoja (barro), espiga (verde monte), panal/hexágono (barro) y zigzag chorotega (verde monte), entre 20% y 24% de opacidad.
- Resplandor e íconos se ocultan por completo bajo 720px de ancho.

- [ ] **Step 1: Reemplazar la sección hero del template**

En `src/views/HomeView.vue`, reemplazar el bloque de la sección hero (líneas 60-69, desde `<section class="hero-section">` hasta su `</section>`) por:

```vue
    <!-- Sección hero / encabezado de la página -->
    <section class="hero-section">
      <!-- Resplandor cálido detrás del titular (decorativo) -->
      <div class="hero-glow" aria-hidden="true"></div>

      <!-- Íconos lineales en las esquinas: hoja, espiga, panal y zigzag chorotega -->
      <div class="hero-deco" aria-hidden="true">
        <svg class="deco-hoja" viewBox="0 0 48 48" fill="none" stroke="#8C3B26" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 38C6 20 22 6 40 6C40 24 24 38 6 38Z" />
          <path d="M9 35C17 27 25 19 37 9" />
        </svg>
        <svg class="deco-espiga" viewBox="0 0 48 48" fill="none" stroke="#3A5A34" stroke-width="2.5" stroke-linecap="round">
          <path d="M24 4v40" />
          <path d="M24 12c-6-2-10 0-12 4M24 12c6-2 10 0 12 4M24 22c-6-2-10 0-12 4M24 22c6-2 10 0 12 4M24 32c-6-2-10 0-12 4M24 32c6-2 10 0 12 4" />
        </svg>
        <svg class="deco-panal" viewBox="0 0 48 48" fill="none" stroke="#8C3B26" stroke-width="2.5" stroke-linejoin="round">
          <path d="M24 4 42 15v18L24 44 6 33V15Z" />
        </svg>
        <svg class="deco-zigzag" viewBox="0 0 52 24" fill="none" stroke="#3A5A34" stroke-width="3" stroke-linecap="square">
          <path d="M2 20 10 20 10 8 18 8 18 20 26 20 26 8 34 8 34 20 42 20 42 8 50 8" />
        </svg>
      </div>

      <div class="hero-inner">
        <span class="hero-eyebrow">Guanacaste, Costa Rica</span>

        <h2 class="hero-title">Descubre productores locales en Guanacaste</h2>
        <p class="hero-subtitle">
          Conecta directamente con micro, pequeñas y medianas empresas productoras
          de alimentos de tu comunidad.
        </p>

        <!-- Barra de búsqueda -->
        <SearchBar @search="handleSearch" />

        <!-- Estadísticas del directorio -->
        <div class="stat-row">
          <div class="stat">
            <span class="stat-num">{{ cantones.length }}</span>
            <span class="stat-label">Cantones</span>
          </div>
          <div class="stat">
            <span class="stat-num">{{ categorias.length }}</span>
            <span class="stat-label">Categorías</span>
          </div>
          <div class="stat">
            <span class="stat-num">100%</span>
            <span class="stat-label">Gratuito</span>
          </div>
        </div>
      </div>
    </section>
```

- [ ] **Step 2: Reemplazar los estilos del hero**

En el mismo archivo, reemplazar las reglas `.hero-section`, `.hero-title`, `.hero-subtitle` y `.hero-section :deep(.search-bar)` (líneas 100-122) por:

```css
.hero-section {
  position: relative;
  overflow: visible;
  text-align: center;
  padding: 3rem 0 2.5rem;
}

/* --- Decoración (solo estética; oculta en móvil) --- */
.hero-glow {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 520px;
  max-width: 90%;
  height: 300px;
  background: radial-gradient(closest-side, rgba(140, 59, 38, 0.16), rgba(140, 59, 38, 0) 72%);
  pointer-events: none;
  z-index: 0;
}

.hero-deco {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.hero-deco svg {
  position: absolute;
}

.deco-hoja {
  top: 8%;
  left: 3%;
  width: 46px;
  height: 46px;
  opacity: 0.24;
  transform: rotate(-14deg);
}

.deco-espiga {
  top: 12%;
  right: 4%;
  width: 44px;
  height: 44px;
  opacity: 0.22;
  transform: rotate(10deg);
}

.deco-panal {
  bottom: 10%;
  left: 6%;
  width: 40px;
  height: 40px;
  opacity: 0.2;
  transform: rotate(-6deg);
}

.deco-zigzag {
  bottom: 14%;
  right: 5%;
  width: 52px;
  height: 22px;
  opacity: 0.24;
}

/* --- Contenido del hero (por encima de la decoración) --- */
.hero-inner {
  position: relative;
  z-index: 1;
  max-width: 640px;
  margin: 0 auto;
}

.hero-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 1rem;
  padding: 0.3rem 0.7rem;
  border-radius: var(--radius-full);
  background: var(--color-primary-600);
  color: var(--text-inverse);
  font-size: var(--font-size-xs);
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.hero-title {
  font-family: var(--font-headline);
  font-size: clamp(2rem, 4vw, 2.75rem);
  font-weight: 600;
  line-height: 1.08;
  color: var(--text-primary);
  margin: 0 0 0.85rem;
}

.hero-subtitle {
  font-size: 1.05rem;
  color: var(--text-secondary);
  max-width: 46ch;
  margin: 0 auto 1.5rem;
  line-height: 1.6;
}

.hero-section :deep(.search-bar) {
  margin: 0 auto;
}

/* --- Fila de estadísticas --- */
.stat-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1.5rem;
  margin-top: 2rem;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
}

.stat-num {
  font-family: var(--font-headline);
  font-size: 1.375rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--color-primary-600);
}

.stat-label {
  font-size: 0.6875rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

- [ ] **Step 3: Ocultar la decoración en pantallas angostas**

En el mismo archivo, reemplazar el bloque `@media (max-width: 768px) { … }` completo (líneas 139-151) por:

```css
/* Diseño responsivo */
@media (max-width: 768px) {
  .hero-section {
    padding: 2rem 0 2rem;
  }

  .content-layout {
    grid-template-columns: 1fr;
  }

  .filters-sidebar {
    order: -1;
  }
}

/* La decoración estorba en pantallas angostas: se retira por completo. */
@media (max-width: 720px) {
  .hero-glow,
  .hero-deco {
    display: none;
  }
}
```

(La regla vieja `.hero-title { font-size: 1.5rem; }` dentro del media query se elimina: el `clamp()` del Step 2 ya escala el titular.)

- [ ] **Step 4: Verificación visual**

Ejecutar: `npm run dev`

Abrir `http://localhost:5173/` (ventana ancha, >1000px) y confirmar contra el mockup aprobado (dirección "Guaitil"):

1. Arriba del titular hay una **píldora barro** con el texto "GUANACASTE, COSTA RICA" en mayúsculas, centrada.
2. El titular está centrado, en Fraunces, y detrás de él se ve un **halo cálido difuso** (más notorio si se mira el fondo justo arriba/detrás del texto). No debe verse un círculo con borde duro: el degradado se desvanece.
3. En las **cuatro esquinas** del hero hay íconos lineales tenues: arriba-izquierda una hoja barro inclinada, arriba-derecha una espiga verde, abajo-izquierda un hexágono/panal barro, abajo-derecha un zigzag verde. Todos apenas visibles (20-24% de opacidad), sin competir con el texto.
4. Debajo del buscador hay **tres estadísticas centradas**: el número de cantones, el de categorías y "100% Gratuito". Los números están en Fraunces y en barro `#8C3B26`; las etiquetas en mayúsculas pequeñas y gris cálido. Los dos primeros números deben coincidir con la cantidad real de opciones de los selectores "Cantón" y "Categoría" del panel de filtros.
5. Achicar la ventana a menos de 720px (DevTools → modo responsive, 375px): el resplandor y los cuatro íconos **desaparecen por completo**, y el titular sigue legible sin desbordarse.
6. Ningún ícono ni el resplandor deben capturar clics: se puede seleccionar el texto del titular y hacer clic en el buscador con normalidad.

Detener el servidor con `Ctrl+C` al terminar.

- [ ] **Step 5: Verificar build**
Run: `npm run build`
Expected: termina sin errores (0 errors).

- [ ] **Step 6: Verificar tests**
Run: `npm test`
Expected: PASS — 83 tests pasando, sin cambios.

- [ ] **Step 7: Commit**
```bash
git add src/views/HomeView.vue
git commit -m "feat(ui): hero decorado en la página de inicio

Agrega insignia de región, resplandor radial cálido, cuatro íconos
lineales de fondo (hoja, espiga, panal y zigzag chorotega) y la fila de
estadísticas del directorio. La decoración se oculta bajo 720px.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Tarea 5: Detalle de productor — resplandor, badges por categoría y recolor

**Files:**
- Modify: `src/views/ProducerDetailView.vue:8-16` (imports del `<script setup>`), `:48-51` (apertura del artículo), `:72-81` (badges del template), `:111-212` (bloque `<style scoped>`)
- Test: no aplica (markup y CSS visuales; se verifica a ojo + `npm run build` + `npm test`)

**Interfaces:**
- Consumes: tokens de la Tarea 1 (`--color-primary-600`, `--color-primary-700`, `--bg-muted`, `--text-primary`, `--text-secondary`, `--radius-xl`, `--radius-full`, `--font-headline`). De la Tarea 2: `import { colorDeCategoria } from '@/utils/categoriaColor'`, que recibe el nombre de la categoría (string) y devuelve `{ bg, texto }`.
- Produces: nada que otra tarea consuma.

Nota: esta vista lleva **solo el resplandor**, sin los cuatro íconos. Es la página de un productor, no una portada.

- [ ] **Step 1: Importar `colorDeCategoria`**

En `src/views/ProducerDetailView.vue`, dentro del `<script setup>`, agregar el import justo después de `import { formatearTelefono } from '@/utils/telefono'` (línea 13):

```js
import { colorDeCategoria } from '@/utils/categoriaColor'
```

El bloque de imports queda así:

```js
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProductores } from '@/composables/useProductores'
import { getPublicImageUrl } from '@/lib/supabase'
import { formatearTelefono } from '@/utils/telefono'
import { colorDeCategoria } from '@/utils/categoriaColor'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import WhatsAppButton from '@/components/producers/WhatsAppButton.vue'
```

- [ ] **Step 2: Agregar el resplandor detrás del encabezado**

En el mismo archivo, reemplazar las líneas 48-51 (la apertura del `<article>` y el enlace de regreso) por:

```vue
    <article v-else-if="producer" class="detail-content">
      <!-- Resplandor cálido detrás de la portada (decorativo, sin íconos) -->
      <div class="detail-glow" aria-hidden="true"></div>

      <!-- Enlace para regresar -->
      <RouterLink to="/" class="back-link">← Volver al directorio</RouterLink>
```

- [ ] **Step 3: Pintar los badges con el color de su categoría**

En el mismo archivo, reemplazar el bloque de categorías del template (líneas 72-81) por:

```vue
          <!-- Categorías, cada una con su color propio -->
          <div v-if="producer.categorias?.length" class="detail-tags">
            <span
              v-for="cat in producer.categorias"
              :key="cat.categoria?.id"
              class="detail-tag"
              :style="{
                background: colorDeCategoria(cat.categoria?.nombre).bg,
                color: colorDeCategoria(cat.categoria?.nombre).texto,
              }"
            >
              {{ cat.categoria?.nombre }}
            </span>
          </div>
```

- [ ] **Step 4: Reemplazar los estilos de la vista**

En el mismo archivo, reemplazar el bloque `<style scoped>` completo (líneas 111-212, todo lo que hay entre `<style scoped>` y `</style>`) por:

```css
.producer-detail {
  padding: 1rem 0;
}

.detail-content {
  position: relative;
}

/* Resplandor cálido detrás de la portada. Sin íconos: esta es la página
   de un productor, no una portada del sitio. */
.detail-glow {
  position: absolute;
  top: -1.5rem;
  left: 0;
  width: 560px;
  max-width: 100%;
  height: 320px;
  background: radial-gradient(closest-side, rgba(140, 59, 38, 0.14), rgba(140, 59, 38, 0) 72%);
  pointer-events: none;
  z-index: 0;
}

.detail-content > *:not(.detail-glow) {
  position: relative;
  z-index: 1;
}

.back-link {
  display: inline-block;
  color: var(--color-primary-600);
  text-decoration: none;
  font-weight: 600;
  margin-bottom: 1.5rem;
}

.back-link:hover {
  color: var(--color-primary-700);
  text-decoration: underline;
}

.detail-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2.5rem;
  align-items: start;
}

.detail-image {
  border-radius: var(--radius-xl);
  overflow: hidden;
  border: 1px solid var(--color-neutral-200);
  background-color: var(--bg-muted);
}

.detail-img {
  width: 100%;
  display: block;
  object-fit: cover;
}

.detail-img-placeholder {
  aspect-ratio: 4 / 3;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 4rem;
}

.detail-title {
  font-family: var(--font-headline);
  font-size: 2rem;
  font-weight: 600;
  line-height: 1.15;
  margin: 0 0 0.5rem;
  color: var(--text-primary);
}

.detail-location {
  font-size: 1rem;
  color: var(--text-secondary);
  margin: 0 0 1rem;
}

.detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}

/* El fondo y el color de texto los pone colorDeCategoria() por :style. */
.detail-tag {
  font-size: 0.8rem;
  padding: 0.3rem 0.75rem;
  border-radius: var(--radius-full);
  font-weight: 600;
}

.detail-description {
  font-size: 1rem;
  line-height: 1.7;
  color: var(--text-primary);
  margin-bottom: 1.5rem;
}

.detail-contact {
  margin-bottom: 1.5rem;
}

.contact-name,
.contact-phone {
  margin: 0.3rem 0;
  color: var(--text-secondary);
}

.error-message {
  text-align: center;
  padding: 2rem;
  color: var(--color-error);
}

@media (max-width: 768px) {
  .detail-layout {
    grid-template-columns: 1fr;
  }
}

/* La decoración estorba en pantallas angostas: se retira por completo. */
@media (max-width: 720px) {
  .detail-glow {
    display: none;
  }
}
```

- [ ] **Step 5: Verificación visual**

Ejecutar: `npm run dev`

Abrir `http://localhost:5173/`, hacer clic en cualquier tarjeta de productor para llegar al detalle (`/productor/<id>`), y confirmar:

1. Detrás de la imagen de portada y del título se percibe un **halo cálido difuso** (mismo efecto del inicio pero más discreto, 14%). **No** debe haber ningún ícono decorativo en esta vista — ni hoja, ni espiga, ni panal, ni zigzag.
2. El nombre del negocio está en Fraunces, tamaño grande.
3. Los badges de categoría tienen **cada uno su color** (comparar con los de la tarjeta en el inicio: deben coincidir para el mismo productor).
4. El enlace "← Volver al directorio" es barro `#8C3B26` y se oscurece al pasar el mouse.
5. La imagen de portada tiene esquinas de 16px y un borde fino color arena oscura.
6. El botón "Contactar por WhatsApp" **sigue siendo verde WhatsApp** `#25D366` — este color no cambia.
7. En modo responsive a 375px: el resplandor desaparece y el contenido se apila en una columna.

Detener el servidor con `Ctrl+C` al terminar.

- [ ] **Step 6: Verificar build**
Run: `npm run build`
Expected: termina sin errores (0 errors).

- [ ] **Step 7: Verificar tests**
Run: `npm test`
Expected: PASS — 83 tests pasando, sin cambios.

- [ ] **Step 8: Commit**
```bash
git add src/views/ProducerDetailView.vue
git commit -m "feat(ui): detalle de productor con resplandor y badges por categoría

Agrega el resplandor radial detrás de la portada (sin íconos, a
diferencia del inicio), pinta los badges con colorDeCategoria() y
recolorea la vista con los tokens nuevos.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Tarea 6: Encabezado, marca y componentes comunes

**Files:**
- Modify: `src/components/common/AppHeader.vue:28-35` (marca del template), `:79-100` (estilos de la marca)
- Modify: `src/components/producers/WhatsAppButton.vue:68-81` (regla `.whatsapp-button`)
- Verify only (sin cambios de código): `src/App.vue`, `src/components/common/AppFooter.vue`, `src/components/common/AppToast.vue`, `src/components/common/LoadingSpinner.vue`
- Test: no aplica (markup y CSS visuales; se verifica a ojo + `npm run build` + `npm test`)

**Interfaces:**
- Consumes: tokens de la Tarea 1 (`--color-warm-600` = `#3A5A34`, `--color-warm-50` = `#EEF3EA`, `--font-headline`, `--radius-md`, `--radius-full`). El encabezado ya usa el alias `var(--color-primary)`, que apunta a `--color-primary-600` y por lo tanto ya es barro tras la Tarea 1: **el fondo del encabezado no se toca**.
- Produces: nada que otra tarea consuma.

Nota de la spec (sección 5.1): el ícono de marca puede ir en verde monte o en barro. Aquí se elige **verde monte** porque el encabezado ya es barro y un ícono barro sobre fondo barro sería invisible.

- [ ] **Step 1: Reemplazar el emoji de la marca por un SVG de hoja**

El emoji 🌿 no se puede recolorear. En `src/components/common/AppHeader.vue`, reemplazar el bloque de la marca del template (líneas 28-35) por:

```vue
      <!-- Logo y nombre del sitio -->
      <RouterLink to="/" class="header-brand">
        <span class="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M12 21V9" />
            <path d="M12 9C7 9 4 6 4 2c5 0 8 3 8 7Z" />
          </svg>
        </span>
        <div class="brand-text">
          <h1 class="brand-name">Directorio MIPYMES</h1>
          <span class="brand-subtitle">Guanacaste, Costa Rica</span>
        </div>
      </RouterLink>
```

- [ ] **Step 2: Estilar la marca**

En el mismo archivo, reemplazar las reglas `.header-brand`, `.brand-icon`, `.brand-name` y `.brand-subtitle` (líneas 79-100) por:

```css
.header-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  color: inherit;
}

/* Cuadro con la hoja de marca: verde monte sobre el encabezado barro. */
.brand-mark {
  width: 34px;
  height: 34px;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  background-color: var(--color-warm-600);
  color: var(--color-warm-50);
}

.brand-mark svg {
  width: 18px;
  height: 18px;
}

.brand-name {
  font-family: var(--font-headline);
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}

.brand-subtitle {
  font-size: 0.75rem;
  opacity: 0.85;
}
```

- [ ] **Step 3: Botón de WhatsApp en píldora**

En `src/components/producers/WhatsAppButton.vue`, dentro de la regla `.whatsapp-button` (líneas 68-81), cambiar:

```css
  border-radius: 10px;
```

por:

```css
  border-radius: var(--radius-full);
```

**No** tocar `background-color: #25d366` ni el `#1ebe5d` del hover: son el verde de WhatsApp y la spec los congela.

- [ ] **Step 4: Verificación visual**

Ejecutar: `npm run dev`

Abrir `http://localhost:5173/` y confirmar:

1. **Encabezado**: fondo barro `#8C3B26` con texto blanco. A la izquierda hay un **cuadro verde monte `#3A5A34` con una hoja lineal clara dentro**, en vez del emoji 🌿. El cuadro tiene esquinas de 8px.
2. "Directorio MIPYMES" se renderiza en Fraunces (DevTools → Computed → `font-family` contiene `Fraunces`).
3. **Pie de página** (`AppFooter.vue`, sin cambios de código): el fondo ahora es marrón muy oscuro (`--color-neutral-800` = `#2E281E`) en vez de gris frío, y el texto claro se lee bien. Si el contraste fuera insuficiente, ese es el único caso en el que hay que tocar el archivo.
4. **Spinner** (`LoadingSpinner.vue`, sin cambios): recargar la página y mirar el indicador de carga — el arco que gira debe ser **barro**, no verde.
5. **Toast** (`AppToast.vue`, sin cambios): iniciar sesión con credenciales incorrectas o realizar cualquier acción del panel que muestre una notificación. La franja izquierda del toast de éxito sigue **verde `#22c55e`** y la de error **roja `#ef4444`** — son colores semánticos y no deben haber cambiado. El fondo del toast sí debe ser la superficie nueva (`#FFFDF9`).
6. Ir al detalle de un productor: el botón "Contactar por WhatsApp" ahora es una **píldora** verde WhatsApp.

Detener el servidor con `Ctrl+C` al terminar.

- [ ] **Step 5: Verificar build**
Run: `npm run build`
Expected: termina sin errores (0 errors).

- [ ] **Step 6: Verificar tests**
Run: `npm test`
Expected: PASS — 83 tests pasando, sin cambios.

- [ ] **Step 7: Commit**
```bash
git add src/components/common/AppHeader.vue src/components/producers/WhatsAppButton.vue
git commit -m "feat(ui): marca con hoja en verde monte y botón de WhatsApp en píldora

Reemplaza el emoji de la marca por un SVG recoloreable sobre un cuadro
verde monte y pone el nombre del sitio en la tipografía de titulares.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Tarea 7: Vistas de autenticación (login y recuperación)

**Files:**
- Modify: `src/views/LoginView.vue:158-291` (bloque `<style scoped>`)
- Modify: `src/views/ResetPasswordView.vue:126-219` (reglas `.reset-card`, `.reset-title`, `.reset-subtitle`, `.reset-error`, `.form-label`, `.form-input`, `.form-input:focus`, `.reset-button`, `.reset-button:hover`)
- Test: no aplica (recolor visual; se verifica a ojo + `npm run build` + `npm test`)

**Interfaces:**
- Consumes: tokens de la Tarea 1 (`--bg-surface`, `--color-neutral-200`/`-300`, `--color-primary-600`/`-700`, `--text-primary`, `--text-secondary`, `--radius-xl`, `--radius-full`, `--font-headline`) y `--color-error-light` (valor congelado `#fef2f2`).
- Produces: nada que otra tarea consuma.

Nota de la spec (sección 5.2): estas dos pantallas **no** llevan resplandor ni íconos. Son pantallas de una sola tarea.

- [ ] **Step 1: Recolorear la tarjeta de login**

En `src/views/LoginView.vue`, reemplazar las reglas `.login-card`, `.login-title`, `.login-subtitle` y `.login-error` (líneas 167-198) por:

```css
.login-card {
  width: 100%;
  max-width: 400px;
  background: var(--bg-surface);
  border: 1px solid var(--color-neutral-200);
  padding: 2.5rem;
  border-radius: var(--radius-xl);
  box-shadow: 0 8px 28px rgba(43, 32, 22, 0.08);
}

.login-title {
  font-family: var(--font-headline);
  font-size: 1.75rem;
  font-weight: 600;
  margin: 0 0 0.25rem;
  text-align: center;
  color: var(--text-primary);
}

.login-subtitle {
  text-align: center;
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin: 0 0 1.5rem;
}

.login-error {
  background-color: var(--color-error-light);
  color: var(--color-error);
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  margin-bottom: 1rem;
  font-size: 0.9rem;
}
```

- [ ] **Step 2: Recolorear el formulario y los botones de login**

En el mismo archivo, reemplazar las reglas `.form-label`, `.form-input`, `.form-input:focus`, `.login-button`, `.login-button:hover:not(:disabled)`, `.login-back-link`, `.login-back-link:hover` y `.login-link-button` (líneas 204-290) por:

```css
.form-label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 0.35rem;
  color: var(--text-primary);
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-neutral-300);
  border-radius: var(--radius-xl);
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-size: 1rem;
  font-family: inherit;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary-600);
  box-shadow: 0 0 0 3px rgba(140, 59, 38, 0.15);
}

.login-button {
  width: 100%;
  padding: 0.85rem;
  background-color: var(--color-primary-600);
  color: var(--text-inverse);
  border: none;
  border-radius: var(--radius-full);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-top: 0.5rem;
}

.login-button:hover:not(:disabled) {
  background-color: var(--color-primary-700);
}

.login-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.login-back-link {
  display: block;
  text-align: center;
  margin-top: 1.5rem;
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.85rem;
}

.login-back-link:hover {
  color: var(--color-primary-600);
}

.login-info {
  background-color: var(--color-primary-50);
  color: var(--color-primary-800);
  border: 1px solid var(--color-primary-200);
  border-radius: var(--radius-md);
  padding: var(--spacing-3) var(--spacing-4);
  font-size: var(--font-size-sm);
  line-height: 1.5;
  margin-bottom: var(--spacing-4);
}

.login-link-button {
  display: block;
  width: 100%;
  margin-top: var(--spacing-4);
  background: none;
  border: none;
  color: var(--color-primary-600);
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  text-align: center;
}

.login-link-button:hover {
  text-decoration: underline;
}
```

(La regla `.login-button:disabled` y `.login-info` van en el orden mostrado; `.login-info` conserva sus tokens porque ya apuntan a la rampa barro nueva.)

- [ ] **Step 3: Recolorear la vista de nueva contraseña**

En `src/views/ResetPasswordView.vue`, reemplazar las reglas `.reset-card`, `.reset-title`, `.reset-subtitle` y `.reset-error` (líneas 126-158) por:

```css
.reset-card {
  width: 100%;
  max-width: 420px;
  background: var(--bg-surface);
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-xl);
  box-shadow: 0 8px 28px rgba(43, 32, 22, 0.08);
  padding: var(--spacing-8);
}

.reset-title {
  font-family: var(--font-headline);
  font-size: var(--font-size-2xl);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-2);
}

.reset-subtitle {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  margin: 0 0 var(--spacing-6);
  line-height: 1.5;
}

.reset-error {
  background-color: var(--color-error-light);
  color: var(--color-error);
  border: 1px solid #fecaca;
  border-radius: var(--radius-md);
  padding: var(--spacing-3) var(--spacing-4);
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-4);
}
```

- [ ] **Step 4: Recolorear el formulario y el botón de nueva contraseña**

En el mismo archivo, reemplazar las reglas `.form-label`, `.form-input`, `.form-input:focus`, `.reset-button` y `.reset-button:hover:not(:disabled)` (líneas 172-210) por:

```css
.form-label {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-primary);
}

.form-input {
  padding: 0.65rem var(--spacing-4);
  border: 1px solid var(--color-neutral-300);
  border-radius: var(--radius-xl);
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-size: var(--font-size-base);
  font-family: inherit;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary-600);
  box-shadow: 0 0 0 3px rgba(140, 59, 38, 0.15);
}

.reset-button {
  display: block;
  width: 100%;
  padding: 0.75rem;
  background-color: var(--color-primary-600);
  color: var(--text-inverse);
  border: none;
  border-radius: var(--radius-full);
  font-size: var(--font-size-base);
  font-weight: 600;
  cursor: pointer;
  text-align: center;
  text-decoration: none;
  transition: background-color var(--transition-fast);
}

.reset-button:hover:not(:disabled) {
  background-color: var(--color-primary-700);
}
```

- [ ] **Step 5: Verificación visual**

Ejecutar: `npm run dev`

1. Abrir `http://localhost:5173/login`. Confirmar:
   - El título "Iniciar Sesión" está en **Fraunces**.
   - La tarjeta es casi blanca (`#FFFDF9`), con esquinas de 16px y un borde fino arena, sobre el lienzo arena de la página.
   - Los campos de correo y contraseña tienen esquinas redondeadas amplias; al enfocarlos el borde y el anillo son **barro**, no verdes.
   - El botón "Ingresar" es una **píldora barro**; al pasar el mouse se oscurece.
   - El enlace "¿Olvidó su contraseña?" es barro.
   - **No** hay resplandor ni íconos decorativos en esta pantalla.
2. Pulsar "¿Olvidó su contraseña?": el modo de recuperación mantiene los mismos estilos; el mensaje informativo tras enviar usa fondo barro muy claro (`#FBF1EA`).
3. Intentar iniciar sesión con credenciales incorrectas: el recuadro de error sigue siendo **rojo sobre fondo rosado claro** (`#fef2f2`) — el color semántico no cambió.
4. Abrir `http://localhost:5173/restablecer-contrasena`. Sin sesión mostrará "Enlace inválido o expirado": confirmar el mismo lenguaje visual (título Fraunces, tarjeta clara, botón píldora barro).

Detener el servidor con `Ctrl+C` al terminar.

- [ ] **Step 6: Verificar build**
Run: `npm run build`
Expected: termina sin errores (0 errors).

- [ ] **Step 7: Verificar tests**
Run: `npm test`
Expected: PASS — 83 tests pasando, sin cambios.

- [ ] **Step 8: Commit**
```bash
git add src/views/LoginView.vue src/views/ResetPasswordView.vue
git commit -m "feat(ui): recolor de las pantallas de sesión y recuperación

Tarjetas sobre superficie clara con radio grande, títulos en la
tipografía de titulares y botones en píldora barro. Sin decoración: son
pantallas de una sola tarea.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Tarea 8: Panel admin — navegación, KPIs y tabla

**Files:**
- Modify: `src/components/admin/AdminSidebar.vue:39-89` (bloque `<style scoped>`)
- Modify: `src/views/admin/AdminDashboardView.vue:113-177` (bloque `<style scoped>`)
- Modify: `src/components/admin/ProducerTable.vue:4-7` (imports del `<script setup>`), `:105-115` (badges del template), `:268-293` (reglas `.cat-badge`, `.status-badge`, `.status-active`, `.status-inactive`), `:316-323` (reglas `.btn-edit`)
- Verify only (sin cambios de código): `src/layouts/AdminLayout.vue`, `src/views/admin/ProducerCreateView.vue`, `src/views/admin/ProducerEditView.vue`
- Test: no aplica (recolor visual; se verifica a ojo + `npm run build` + `npm test`)

**Interfaces:**
- Consumes: tokens de la Tarea 1 (`--bg-surface`, `--bg-muted`, `--color-neutral-200`, `--color-primary-50`/`-100`/`-600`/`-700`, `--color-warm-100`/`-600`/`-800`, `--text-secondary`, `--radius-full`, `--font-headline`). De la Tarea 2: `import { colorDeCategoria } from '@/utils/categoriaColor'`, que recibe el nombre de la categoría (string) y devuelve `{ bg, texto }`.
- Produces: nada que otra tarea consuma.

Nota de la spec (sección 5.3): el panel admin usa los mismos tokens pero **sin decoración**. Nada de resplandor ni íconos de fondo aquí.

- [ ] **Step 1: Recolorear la barra lateral**

En `src/components/admin/AdminSidebar.vue`, reemplazar el bloque `<style scoped>` completo (líneas 39-89, todo entre `<style scoped>` y `</style>`) por:

```css
.admin-sidebar {
  width: 240px;
  min-height: 100%;
  background: var(--bg-surface);
  border-right: 1px solid var(--color-neutral-200);
  padding: 1.5rem 1rem;
}

.sidebar-title {
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  margin: 0 0 1rem;
  padding: 0 0.5rem;
}

.sidebar-link {
  display: block;
  padding: 0.6rem 0.75rem;
  border-radius: var(--radius-md);
  text-decoration: none;
  color: var(--text-primary);
  font-size: 0.9rem;
  transition: background-color 0.2s, color 0.2s;
  margin-bottom: 0.25rem;
}

.sidebar-link:hover {
  background-color: var(--bg-muted);
}

/* Estado activo en barro (antes era el verde de la paleta vieja). */
.sidebar-link--active {
  background-color: var(--color-primary-50);
  color: var(--color-primary-600);
  font-weight: 600;
}

.sidebar-link--back {
  color: var(--text-muted);
  font-size: 0.85rem;
}

.sidebar-divider {
  height: 1px;
  background-color: var(--color-neutral-200);
  margin: 1rem 0;
}
```

- [ ] **Step 2: Recolorear el panel general y los KPIs**

En `src/views/admin/AdminDashboardView.vue`, reemplazar el bloque `<style scoped>` completo (líneas 113-177, todo entre `<style scoped>` y `</style>`) por:

```css
.admin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
}

.admin-title {
  font-family: var(--font-headline);
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.btn-create {
  padding: 0.6rem 1.25rem;
  background-color: var(--color-primary-600);
  color: var(--text-inverse);
  text-decoration: none;
  border-radius: var(--radius-full);
  font-weight: 600;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.btn-create:hover {
  background-color: var(--color-primary-700);
  color: var(--text-inverse);
}

.error-message {
  color: var(--color-error);
  font-weight: 500;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-8);
}

.kpi-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  padding: var(--spacing-5);
  background: var(--bg-surface);
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
}

/* Los números alternan barro y verde monte para dar ritmo a la fila. */
.kpi-value {
  font-family: var(--font-headline);
  font-size: var(--font-size-3xl);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--color-primary-600);
  line-height: 1;
}

.kpi-card:nth-child(even) .kpi-value {
  color: var(--color-warm-600);
}

.kpi-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}
```

- [ ] **Step 3: Importar `colorDeCategoria` en la tabla**

En `src/components/admin/ProducerTable.vue`, dentro del `<script setup>`, agregar el import justo después de `import { getPublicImageUrl } from '@/lib/supabase'` (línea 6):

```js
import { colorDeCategoria } from '@/utils/categoriaColor'
```

El bloque de imports queda así:

```js
import { computed, ref } from 'vue'
import { getPublicImageUrl } from '@/lib/supabase'
import { colorDeCategoria } from '@/utils/categoriaColor'
```

- [ ] **Step 4: Pintar los badges de la tabla con el color de su categoría**

En el mismo archivo, reemplazar el bloque de la celda de categorías del template (líneas 104-115) por:

```vue
            <!-- Categorías, cada una con su color propio -->
            <td>
              <div class="categories-tags">
                <span
                  v-for="cat in p.categorias"
                  :key="cat.categoria?.id"
                  class="cat-badge"
                  :style="{
                    background: colorDeCategoria(cat.categoria?.nombre).bg,
                    color: colorDeCategoria(cat.categoria?.nombre).texto,
                  }"
                >
                  {{ cat.categoria?.nombre || 'Alimento' }}
                </span>
              </div>
            </td>
```

- [ ] **Step 5: Ajustar badges de estado y botón de editar**

En el mismo archivo, reemplazar las reglas `.cat-badge`, `.status-badge`, `.status-active` y `.status-inactive` (líneas 268-293) por:

```css
/* El fondo y el color de texto los pone colorDeCategoria() por :style. */
.cat-badge {
  font-size: var(--font-size-xs);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-weight: 600;
}

/* Estados */
.status-badge {
  font-size: var(--font-size-xs);
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font-weight: 600;
}

/* "Activo" en verde monte: el barro es el color de marca y aquí debe
   leerse como estado bueno, no como acento. */
.status-active {
  background-color: var(--color-warm-100);
  color: var(--color-warm-800);
}

.status-inactive {
  background-color: var(--color-neutral-200);
  color: var(--color-neutral-600);
}
```

En el mismo archivo, reemplazar las reglas `.btn-edit` y `.btn-edit:hover` (líneas 316-323) por:

```css
.btn-edit {
  background-color: var(--color-primary-100);
  color: var(--color-primary-700);
}

.btn-edit:hover {
  background-color: var(--color-primary-200);
}
```

**No** tocar `.btn-delete` ni `.btn-delete:hover`: sus rojos (`#fee2e2`, `#991b1b`, `#fca5a5`) son señal de acción destructiva y la spec congela los colores semánticos.

- [ ] **Step 6: Verificación visual**

Ejecutar: `npm run dev`

Iniciar sesión con una cuenta de administrador y abrir `http://localhost:5173/admin`. Confirmar:

1. **Barra lateral**: fondo casi blanco (`#FFFDF9`) con un borde derecho arena. El enlace de la sección activa ("Panel General") tiene fondo barro muy claro (`#FBF1EA`) y texto **barro `#8C3B26`** — no verde.
2. **Título "Panel de Administración"**: en Fraunces.
3. **Tarjetas KPI**: los números están en Fraunces y **alternan** color: la 1.ª y la 3.ª en barro `#8C3B26`, la 2.ª y la 4.ª en verde monte `#3A5A34`. Las etiquetas están en `--text-secondary` (`#5F4C39`).
4. **Botón "➕ Nuevo Productor"**: píldora barro.
5. **Tabla**: los badges de la columna "Categorías" tienen **cada uno su color** y coinciden con los del sitio público para el mismo productor.
6. El badge "Activo" es **verde monte claro** con texto verde oscuro; "Inactivo" es gris cálido.
7. El botón "✏️ Editar" es barro claro; el botón "🗑️ Eliminar" **sigue rojo**.
8. **En ninguna pantalla del admin** debe verse resplandor radial ni íconos decorativos de fondo.
9. Abrir `/admin/productores/nuevo` y `/admin/productores/<id>/editar` (vistas sin cambios de código): sus títulos "Nuevo Productor" y "Editar Productor" deben salir en **Fraunces** gracias a la regla global de `h1` (Tarea 1). El área de contenido (`AdminLayout.vue`, sin cambios) debe tener el fondo arena de la página.

Detener el servidor con `Ctrl+C` al terminar.

- [ ] **Step 7: Verificar build**
Run: `npm run build`
Expected: termina sin errores (0 errors).

- [ ] **Step 8: Verificar tests**
Run: `npm test`
Expected: PASS — 83 tests pasando, sin cambios.

- [ ] **Step 9: Commit**
```bash
git add src/components/admin/AdminSidebar.vue src/views/admin/AdminDashboardView.vue src/components/admin/ProducerTable.vue
git commit -m "feat(ui): recolor del panel admin (navegación, KPIs y tabla)

Enlace activo de la barra lateral en barro, KPIs en la tipografía de
titulares alternando barro y verde monte, y badges de categoría con
colorDeCategoria(). Sin decoración: el panel es herramienta de trabajo.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Tarea 9: Formulario de productor y selector de imagen

**Files:**
- Modify: `src/components/admin/ProducerForm.vue:314-320` (regla `.producer-form-card`), `:405-432` (reglas de los checkboxes de categoría), `:527-559` (reglas `.btn`, `.btn-outline`, `.btn-primary`)
- Modify: `src/components/admin/ImageUploader.vue:249-270` (reglas `.dropzone`)
- Test: no aplica (recolor visual; se verifica a ojo + `npm run build` + `npm test`)

**Interfaces:**
- Consumes: tokens de la Tarea 1 (`--bg-surface`, `--bg-secondary`, `--color-neutral-200`/`-300`, `--color-primary-50`/`-100`/`-400`/`-500`/`-600`/`-700`, `--radius-xl`, `--radius-full`).
- Produces: nada que otra tarea consuma.

Nota: la spec (sección 5.3) menciona como *nice-to-have* que los checkboxes de categoría muestren un adelanto de `colorDeCategoria` al marcarse. **No se implementa**: no es requisito y agrega estado visual que el formulario no necesita.

- [ ] **Step 1: Tarjeta del formulario con radio grande**

En `src/components/admin/ProducerForm.vue`, reemplazar la regla `.producer-form-card` (líneas 314-320) por:

```css
.producer-form-card {
  background-color: var(--bg-surface);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  padding: var(--spacing-6);
  border: 1px solid var(--color-neutral-200);
}
```

- [ ] **Step 2: Ajustar los checkboxes de categoría**

En el mismo archivo, reemplazar las reglas `.category-checkbox-item`, `.category-checkbox-item input`, `.category-checkbox-item:hover` y `.category-checkbox-item.checked` (líneas 405-432) por:

```css
.category-checkbox-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2);
  background-color: var(--bg-surface);
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: all var(--transition-fast);
  user-select: none;
}

.category-checkbox-item input {
  display: none;
}

.category-checkbox-item:hover {
  border-color: var(--color-primary-400);
  background-color: var(--color-primary-50);
}

.category-checkbox-item.checked {
  border-color: var(--color-primary-600);
  background-color: var(--color-primary-100);
  color: var(--color-primary-900);
  font-weight: 600;
}
```

- [ ] **Step 3: Botones del formulario en píldora**

En el mismo archivo, reemplazar las reglas `.btn`, `.btn-outline`, `.btn-outline:hover`, `.btn-primary`, `.btn-primary:hover:not(:disabled)` y `.btn-primary:disabled` (líneas 527-559) por:

```css
.btn {
  padding: var(--spacing-3) var(--spacing-6);
  font-size: var(--font-size-base);
  border-radius: var(--radius-full);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
}

.btn-outline {
  background-color: transparent;
  border: 1px solid var(--color-neutral-300);
  color: var(--text-secondary);
}

.btn-outline:hover {
  background-color: var(--bg-muted);
  color: var(--text-primary);
}

.btn-primary {
  background-color: var(--color-primary-600);
  color: var(--text-inverse);
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--color-primary-700);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
```

- [ ] **Step 4: Zona de arrastre con radio grande**

En `src/components/admin/ImageUploader.vue`, reemplazar las reglas `.dropzone`, `.dropzone.drag-active` y `.dropzone.has-preview` (líneas 249-270) por:

```css
.dropzone {
  position: relative;
  width: 100%;
  height: 220px;
  border: 2px dashed var(--color-neutral-300);
  border-radius: var(--radius-xl);
  background-color: var(--bg-secondary);
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  transition: all var(--transition-fast);
}

.dropzone.drag-active {
  border-color: var(--color-primary-500);
  background-color: var(--color-primary-50);
}

.dropzone.has-preview {
  border-style: solid;
  border-color: var(--color-neutral-200);
}
```

- [ ] **Step 5: Verificación visual**

Ejecutar: `npm run dev`

Iniciar sesión y abrir `http://localhost:5173/admin/productores/nuevo`. Confirmar:

1. La tarjeta del formulario es casi blanca (`#FFFDF9`) con esquinas de 16px sobre el fondo arena.
2. Los campos de texto y las áreas de texto tienen esquinas amplias; los **selectores (`<select>`) tienen esquinas pequeñas** (8px) — esa diferencia la impone la regla global de la Tarea 1 y es intencional.
3. Al enfocar cualquier campo, el borde y el anillo son **barro**, no verdes.
4. En la cuadrícula "Categorías de Alimentos": al pasar el mouse sobre un ítem, el fondo se tiñe de barro muy claro (`#FBF1EA`); al marcarlo, el borde queda barro `#8C3B26` y el fondo `#F7E3D8`.
5. El interruptor "Perfil Activo" encendido es **barro**.
6. La zona de arrastre de imagen tiene borde punteado arena con esquinas de 16px; al arrastrar un archivo encima se tiñe barro claro.
7. Los botones "Cancelar" y "Registrar Productor" son **píldoras**; el primario es barro y se oscurece al pasar el mouse.
8. Dejar campos obligatorios vacíos y enviar: los mensajes de validación y los bordes de error siguen siendo **rojos** — el color semántico no cambió.
9. Abrir `/admin/productores/<id>/editar` de un productor con imagen: la vista previa se ve dentro de la zona con esquinas redondeadas y el botón "Quitar imagen" sigue rojo.

Detener el servidor con `Ctrl+C` al terminar.

- [ ] **Step 6: Verificar build**
Run: `npm run build`
Expected: termina sin errores (0 errors).

- [ ] **Step 7: Verificar tests**
Run: `npm test`
Expected: PASS — 83 tests pasando, sin cambios.

- [ ] **Step 8: Commit**
```bash
git add src/components/admin/ProducerForm.vue src/components/admin/ImageUploader.vue
git commit -m "feat(ui): recolor del formulario de productor y el selector de imagen

Tarjeta y zona de arrastre con radio grande, checkboxes de categoría y
botones de acción en la paleta barro.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Tarea 10: Barrido final — sin rastros de la paleta vieja

**Files:**
- Modify: ninguno por defecto. Si el barrido encuentra un resto de la paleta vieja, se corrige en el archivo donde aparezca.
- Test: no aplica (verificación; se apoya en `npm run build` y `npm test`)

**Interfaces:**
- Consumes: el resultado de las Tareas 1-9.
- Produces: la confirmación de que el rediseño está completo (spec sección 7).

- [ ] **Step 1: Buscar restos de la paleta verde vieja y de Inter**

Run: `grep -rniE "#22c55e|#16a34a|#15803d|#166534|#14532d|#f0fdf4|#dcfce7|#bbf7d0|#86efac|#4ade80|#f8faf5|#fffbeb|#fef3c7|#fde68a|#fcd34d|#fbbf24|#f59e0b|#d97706|#b45309|#92400e|#78350f|Inter|rgba\(34, ?197, ?94" src/ index.html public/`

Expected: la **única** coincidencia aceptable es `src/assets/styles/main.css` en las líneas de `--color-success: #22c55e;` y `--color-warning: #f59e0b;` (colores semánticos congelados por la spec). Cualquier otra coincidencia es un resto de la paleta vieja: corregirla reemplazando el valor literal por el token correspondiente de la tabla de paleta al inicio de este plan.

- [ ] **Step 2: Confirmar que no quedó decoración fuera de las dos vistas públicas**

Run: `grep -rn "hero-glow\|hero-deco\|detail-glow\|radial-gradient" src/`

Expected: coincidencias **solo** en `src/views/HomeView.vue` (`hero-glow`, `hero-deco`, un `radial-gradient`) y `src/views/ProducerDetailView.vue` (`detail-glow`, un `radial-gradient`). Ninguna coincidencia en `src/components/admin/`, `src/layouts/` ni `src/views/admin/`.

- [ ] **Step 3: Confirmar que las tres pantallas con badges usan el mismo módulo**

Run: `grep -rn "colorDeCategoria" src/`

Expected: exactamente cuatro archivos — `src/utils/categoriaColor.js` (definición), `src/components/producers/ProducerCard.vue`, `src/views/ProducerDetailView.vue` y `src/components/admin/ProducerTable.vue` (cada uno con su `import` y sus usos en el `:style`).

- [ ] **Step 4: Recorrido visual completo**

Ejecutar: `npm run dev`

Recorrer estas siete pantallas y confirmar en cada una que la paleta es barro/monte/arena, que la tipografía de titulares es Fraunces y la de cuerpo Work Sans, y que **no queda ningún verde brillante** salvo el botón de WhatsApp y la franja del toast de éxito:

1. `http://localhost:5173/` — inicio con hero decorado.
2. `http://localhost:5173/productor/<id>` — detalle con resplandor, sin íconos.
3. `http://localhost:5173/login` — inicio de sesión.
4. `http://localhost:5173/restablecer-contrasena` — nueva contraseña.
5. `http://localhost:5173/admin` — panel general (requiere sesión).
6. `http://localhost:5173/admin/productores/nuevo` — nuevo productor.
7. `http://localhost:5173/admin/productores/<id>/editar` — editar productor.

Repetir el recorrido de las pantallas 1 y 2 en modo responsive a 375px: la decoración debe desaparecer y no debe haber desbordamiento horizontal.

Detener el servidor con `Ctrl+C` al terminar.

- [ ] **Step 5: Verificar build**
Run: `npm run build`
Expected: termina sin errores (0 errors).

- [ ] **Step 6: Verificar tests**
Run: `npm test`
Expected: PASS — 83 tests pasando (los 77 originales intactos + los 6 de `categoriaColor`).

- [ ] **Step 7: Commit (solo si el barrido obligó a corregir algo)**

Si los Steps 1-3 no encontraron nada que corregir, **no hay nada que commitear**: saltar este paso y dar la tarea por terminada.

Si hubo correcciones:

```bash
git add -A
git commit -m "fix(ui): eliminar restos de la paleta y la tipografía anteriores

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```
