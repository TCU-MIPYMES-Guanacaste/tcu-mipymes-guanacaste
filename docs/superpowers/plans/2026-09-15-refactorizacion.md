# Plan de implementación — Rama `refactorizacion`

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dejar el Directorio MIPYMES Guanacaste funcional, seguro, testeable y documentado sobre la rama `refactorizacion`, sin tocar la estética.

**Architecture:** Refactor por responsabilidades: lógica pura en `src/utils/` (testeable sin Supabase), un composable por responsabilidad (`useAuth`, `useStorage`, `useContactos`, `useToast`, `useProductores`), `AdminLayout` con rutas anidadas, y una migración SQL 002 que impone lista blanca de administradores, oculta inactivos en la API y agrega la métrica de contactos. Vitest cubre utils, composables y el guard del router.

**Tech Stack:** Vue 3.5 (`<script setup>`), Vue Router 4, Vite 5.4, `@supabase/supabase-js` 2.x, Vitest 2.x + jsdom, PostgreSQL (Supabase), Node 22.

**Spec:** `docs/superpowers/specs/2026-09-15-refactorizacion-design.md`

## Global Constraints

- Todo el código, comentarios, mensajes de commit y textos de UI en **español**.
- Solo Vue 3 Composition API con `<script setup>`. Sin Pinia, sin TypeScript.
- Compatible con el plan gratuito de Supabase y Vercel ($0/mes).
- Teléfonos: solo Costa Rica. Normalizado = 11 dígitos empezando por `506`.
- Bucket de Storage: `product-images`. Carpeta de fotos: `productores/`.
- Mensajes de commit terminan con `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.
- No se toca la estética (colores, tipografía, layout visual) salvo para corregir tokens CSS rotos.
- Cada tarea termina con `npm test` en verde y (cuando toca código de la app) `npm run build` sin errores.

**Desviación respecto a la spec (sección 4.6):** la auditoría sobre `main` encontró **11 tokens CSS indefinidos en 70 lugares de 14 archivos** (no 5 en 5 archivos como en la rama borrada). Incluyen `--color-primary` y `--color-white`, así que los botones principales hoy se renderizan sin fondo. Editar 70 líneas es propenso a error; en su lugar la Tarea 3 agrega un **bloque de alias** en `main.css` que mapea cada nombre legado al token existente. Un solo lugar, y el rediseño futuro solo tiene que redefinir esos alias.

---

### Task 1: Infraestructura de pruebas + `utils/telefono.js`

**Files:**
- Modify: `package.json`
- Modify: `vite.config.js`
- Create: `src/utils/telefono.js`
- Create: `tests/utils/telefono.test.js`

**Interfaces:**
- Produces: `normalizarTelefono(texto: string|null) → string|null`, `esTelefonoValido(texto) → boolean`, `formatearTelefono(valor) → string`.

- [ ] **Step 1: Instalar Vitest y jsdom, agregar scripts**

```bash
npm install --save-dev vitest@^2 jsdom@^25
npm uninstall @vueuse/core
```

Editar `package.json` → sección `scripts` queda así:

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 2: Configurar Vitest en `vite.config.js`**

Reemplazar el archivo completo:

```js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// Configuración de Vite para el proyecto MIPYMES Guanacaste
export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // Configuración de Vitest (pruebas unitarias)
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.js'],
    clearMocks: true,
  },
})
```

- [ ] **Step 3: Escribir las pruebas de teléfono (fallan)**

Crear `tests/utils/telefono.test.js`:

```js
import { describe, it, expect } from 'vitest'
import {
  normalizarTelefono,
  esTelefonoValido,
  formatearTelefono,
} from '@/utils/telefono'

describe('normalizarTelefono', () => {
  it('antepone 506 a un número de 8 dígitos', () => {
    expect(normalizarTelefono('88884444')).toBe('50688884444')
  })

  it('acepta guion, espacios y paréntesis', () => {
    expect(normalizarTelefono('8888-4444')).toBe('50688884444')
    expect(normalizarTelefono('8888 4444')).toBe('50688884444')
    expect(normalizarTelefono('(8888) 4444')).toBe('50688884444')
  })

  it('acepta el código de país con y sin +', () => {
    expect(normalizarTelefono('+506 8888 4444')).toBe('50688884444')
    expect(normalizarTelefono('506 8888-4444')).toBe('50688884444')
    expect(normalizarTelefono('50688884444')).toBe('50688884444')
  })

  it('rechaza longitudes inválidas', () => {
    expect(normalizarTelefono('123')).toBeNull()
    expect(normalizarTelefono('1234567')).toBeNull()
    expect(normalizarTelefono('123456789')).toBeNull()
    expect(normalizarTelefono('1234567890123')).toBeNull()
  })

  it('rechaza 11 dígitos que no empiezan por 506', () => {
    expect(normalizarTelefono('12388884444')).toBeNull()
  })

  it('devuelve null para vacío, null y no-string', () => {
    expect(normalizarTelefono('')).toBeNull()
    expect(normalizarTelefono(null)).toBeNull()
    expect(normalizarTelefono(undefined)).toBeNull()
    expect(normalizarTelefono(88884444)).toBeNull()
  })
})

describe('esTelefonoValido', () => {
  it('es true solo cuando normaliza', () => {
    expect(esTelefonoValido('8888-4444')).toBe(true)
    expect(esTelefonoValido('+506 8888 4444')).toBe(true)
    expect(esTelefonoValido('123')).toBe(false)
    expect(esTelefonoValido('')).toBe(false)
  })
})

describe('formatearTelefono', () => {
  it('muestra el número local con guion', () => {
    expect(formatearTelefono('50688884444')).toBe('8888-4444')
  })

  it('formatea también entradas no normalizadas pero válidas', () => {
    expect(formatearTelefono('8888 4444')).toBe('8888-4444')
  })

  it('devuelve el valor sin cambios si no es válido', () => {
    expect(formatearTelefono('123')).toBe('123')
  })

  it('devuelve cadena vacía para null o undefined', () => {
    expect(formatearTelefono(null)).toBe('')
    expect(formatearTelefono(undefined)).toBe('')
  })
})
```

- [ ] **Step 4: Ejecutar y verificar que fallan**

Run: `npm test -- tests/utils/telefono.test.js`
Expected: FAIL — `Failed to resolve import "@/utils/telefono"`.

- [ ] **Step 5: Implementar `src/utils/telefono.js`**

```js
/**
 * Utilidades para teléfonos de Costa Rica.
 *
 * Formato normalizado: 11 dígitos, código de país 506 seguido de los
 * 8 dígitos locales (ej: '50688884444'). Es el formato que exige wa.me.
 */

const CODIGO_PAIS = '506'

/**
 * Normaliza un teléfono al formato '506XXXXXXXX'.
 *
 * @param {string|null|undefined} texto - Teléfono tal como lo escribió el usuario
 * @returns {string|null} Teléfono normalizado, o null si no es válido
 */
export function normalizarTelefono(texto) {
  if (typeof texto !== 'string') return null

  const digitos = texto.replace(/\D/g, '')

  if (digitos.length === 8) {
    return `${CODIGO_PAIS}${digitos}`
  }

  if (digitos.length === 11 && digitos.startsWith(CODIGO_PAIS)) {
    return digitos
  }

  return null
}

/**
 * Indica si el texto corresponde a un teléfono costarricense válido.
 *
 * @param {string|null|undefined} texto
 * @returns {boolean}
 */
export function esTelefonoValido(texto) {
  return normalizarTelefono(texto) !== null
}

/**
 * Formatea un teléfono para mostrarlo en pantalla: '8888-4444'.
 * Si el valor no es válido, lo devuelve sin cambios (o '' si es null).
 *
 * @param {string|null|undefined} valor
 * @returns {string}
 */
export function formatearTelefono(valor) {
  const normalizado = normalizarTelefono(valor)
  if (!normalizado) return valor ?? ''

  const local = normalizado.slice(CODIGO_PAIS.length)
  return `${local.slice(0, 4)}-${local.slice(4)}`
}
```

- [ ] **Step 6: Ejecutar y verificar que pasan**

Run: `npm test -- tests/utils/telefono.test.js`
Expected: PASS, 11 pruebas.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json vite.config.js src/utils/telefono.js tests/utils/telefono.test.js
git commit -m "feat(utils): normalización de teléfonos CR + infraestructura Vitest

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: `utils/whatsapp.js` y `utils/busqueda.js`

**Files:**
- Create: `src/utils/whatsapp.js`
- Create: `src/utils/busqueda.js`
- Create: `tests/utils/whatsapp.test.js`
- Create: `tests/utils/busqueda.test.js`

**Interfaces:**
- Consumes: `normalizarTelefono` (Task 1).
- Produces: `generarEnlaceWhatsApp(telefono, nombreNegocio) → string` (`''` si el teléfono no es válido); `sanitizarBusqueda(texto) → string`.

- [ ] **Step 1: Pruebas de WhatsApp (fallan)**

Crear `tests/utils/whatsapp.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { generarEnlaceWhatsApp } from '@/utils/whatsapp'

describe('generarEnlaceWhatsApp', () => {
  it('genera el enlace wa.me con código de país 506', () => {
    const enlace = generarEnlaceWhatsApp('8888-4444', 'Finca La Cosecha')
    expect(enlace.startsWith('https://wa.me/50688884444?text=')).toBe(true)
  })

  it('incluye el nombre del negocio en el mensaje codificado', () => {
    const enlace = generarEnlaceWhatsApp('88884444', 'Finca La Cosecha')
    const url = new URL(enlace)
    const mensaje = url.searchParams.get('text')
    expect(mensaje).toContain('Finca La Cosecha')
    expect(mensaje).toContain('Directorio MIPYMES Guanacaste')
  })

  it('codifica caracteres especiales del nombre', () => {
    const enlace = generarEnlaceWhatsApp('88884444', 'Queso & Miel "Doña Ñeca"')
    const url = new URL(enlace)
    expect(url.searchParams.get('text')).toContain('Queso & Miel "Doña Ñeca"')
    // El & literal no debe romper la query string
    expect(url.searchParams.has('text')).toBe(true)
    expect([...url.searchParams.keys()]).toEqual(['text'])
  })

  it('devuelve cadena vacía si el teléfono no es válido', () => {
    expect(generarEnlaceWhatsApp('123', 'Negocio')).toBe('')
    expect(generarEnlaceWhatsApp('', 'Negocio')).toBe('')
    expect(generarEnlaceWhatsApp(null, 'Negocio')).toBe('')
  })
})
```

- [ ] **Step 2: Pruebas de búsqueda (fallan)**

Crear `tests/utils/busqueda.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { sanitizarBusqueda } from '@/utils/busqueda'

describe('sanitizarBusqueda', () => {
  it('elimina caracteres con significado en filtros PostgREST', () => {
    expect(sanitizarBusqueda('queso,miel')).toBe('queso miel')
    expect(sanitizarBusqueda('finca (norte)')).toBe('finca norte')
    expect(sanitizarBusqueda('100%')).toBe('100')
    expect(sanitizarBusqueda('a_b')).toBe('a b')
  })

  it('colapsa espacios múltiples y recorta extremos', () => {
    expect(sanitizarBusqueda('  queso    fresco  ')).toBe('queso fresco')
  })

  it('recorta a 100 caracteres', () => {
    const largo = 'a'.repeat(150)
    expect(sanitizarBusqueda(largo)).toHaveLength(100)
  })

  it('devuelve cadena vacía para vacío, null o no-string', () => {
    expect(sanitizarBusqueda('')).toBe('')
    expect(sanitizarBusqueda('   ')).toBe('')
    expect(sanitizarBusqueda(null)).toBe('')
    expect(sanitizarBusqueda(42)).toBe('')
  })

  it('conserva acentos y ñ', () => {
    expect(sanitizarBusqueda('Doña Ñeca café')).toBe('Doña Ñeca café')
  })
})
```

- [ ] **Step 3: Ejecutar y verificar que fallan**

Run: `npm test -- tests/utils`
Expected: FAIL en los dos archivos nuevos por import no resuelto; `telefono.test.js` sigue en PASS.

- [ ] **Step 4: Implementar `src/utils/whatsapp.js`**

```js
/**
 * Generación de enlaces de contacto por WhatsApp (wa.me).
 */
import { normalizarTelefono } from './telefono'

/**
 * Genera un enlace de WhatsApp con un mensaje predefinido en español.
 *
 * @param {string|null|undefined} telefono - Teléfono en cualquier formato aceptado por normalizarTelefono
 * @param {string} nombreNegocio - Nombre del negocio/productor
 * @returns {string} URL completa lista para abrir, o '' si el teléfono no es válido
 */
export function generarEnlaceWhatsApp(telefono, nombreNegocio) {
  const normalizado = normalizarTelefono(telefono)
  if (!normalizado) return ''

  const mensaje = encodeURIComponent(
    `Hola, encontré su negocio ${nombreNegocio} en el Directorio MIPYMES Guanacaste ` +
    `y me gustaría consultar sobre sus productos.`
  )

  return `https://wa.me/${normalizado}?text=${mensaje}`
}
```

- [ ] **Step 5: Implementar `src/utils/busqueda.js`**

```js
/**
 * Limpieza del texto de búsqueda antes de enviarlo a Supabase.
 *
 * Los filtros `.or()` de PostgREST usan coma, paréntesis y los comodines
 * % y _ como sintaxis. Si el usuario los escribe, la consulta falla o
 * devuelve resultados inesperados, así que se reemplazan por espacios.
 */

const LONGITUD_MAXIMA = 100

/**
 * @param {string|null|undefined} texto
 * @returns {string} Texto limpio, sin caracteres reservados, máximo 100 caracteres
 */
export function sanitizarBusqueda(texto) {
  if (typeof texto !== 'string') return ''

  return texto
    .replace(/[,()%_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, LONGITUD_MAXIMA)
    .trim()
}
```

- [ ] **Step 6: Ejecutar y verificar que pasan**

Run: `npm test`
Expected: PASS, 3 archivos, 20 pruebas.

- [ ] **Step 7: Commit**

```bash
git add src/utils/whatsapp.js src/utils/busqueda.js tests/utils/whatsapp.test.js tests/utils/busqueda.test.js
git commit -m "feat(utils): enlace de WhatsApp con 506 y sanitización de búsqueda

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: Cliente Supabase estricto, alias de tokens CSS, `vercel.json`, favicon

**Files:**
- Modify: `src/lib/supabase.js`
- Modify: `src/assets/styles/main.css` (dentro de `:root`, después de `--header-height`)
- Modify: `src/components/producers/WhatsAppButton.vue` (solo el import; parche mínimo)
- Create: `vercel.json`
- Create: `public/favicon.svg`
- Modify: `index.html:34`

**Interfaces:**
- Produces: `supabase` (cliente), `BUCKET_IMAGENES = 'product-images'`, `getPublicImageUrl(path) → string`. `generateWhatsAppLink` **deja de existir** en `lib/supabase.js`.

- [ ] **Step 1: Reescribir `src/lib/supabase.js`**

```js
/**
 * Cliente de Supabase y funciones auxiliares.
 *
 * Inicializa la conexión con Supabase usando las variables de entorno
 * de Vite. Si faltan, lanza un error claro en vez de seguir con un
 * cliente roto (que solo produciría una pantalla en blanco).
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[Supabase] Faltan las variables VITE_SUPABASE_URL y/o VITE_SUPABASE_ANON_KEY. ' +
    'Copie el archivo .env.example a .env y complete los valores de su proyecto.'
  )
}

/** Nombre del bucket público de imágenes en Supabase Storage. */
export const BUCKET_IMAGENES = 'product-images'

/** Instancia única del cliente de Supabase. */
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Obtiene la URL pública de una imagen almacenada en el bucket de imágenes.
 *
 * @param {string} path - Ruta relativa dentro del bucket (ej: 'productores/123.webp')
 * @returns {string} URL pública, o '' si no hay ruta
 */
export function getPublicImageUrl(path) {
  if (!path) return ''

  const { data } = supabase.storage.from(BUCKET_IMAGENES).getPublicUrl(path)
  return data?.publicUrl ?? ''
}
```

- [ ] **Step 2: Parche mínimo en `WhatsAppButton.vue` para que el build no se rompa**

Reemplazar la línea
```js
import { generateWhatsAppLink } from '@/lib/supabase'
```
por
```js
import { generarEnlaceWhatsApp } from '@/utils/whatsapp'
```
y el `computed` por:
```js
const whatsappUrl = computed(() => {
  return generarEnlaceWhatsApp(props.phone, props.producerName)
})
```
(Task 11 reescribe este componente completo; esto solo evita un commit con build roto.)

- [ ] **Step 3: Agregar alias de tokens legados en `main.css`**

Dentro de `:root`, inmediatamente después de la línea `--header-height: 4rem;`, insertar:

```css

  /* --- Alias de compatibilidad ---
     Varios componentes usan estos nombres cortos. Se mapean aquí al
     sistema de tokens para no editar 70 líneas en 14 archivos. El
     rediseño futuro solo tiene que redefinir estos alias. */
  --color-primary:       var(--color-primary-600);
  --color-primary-dark:  var(--color-primary-700);
  --color-primary-light: var(--color-primary-100);
  --color-white:         #ffffff;
  --color-surface:       var(--bg-surface);
  --color-surface-dark:  var(--color-neutral-800);
  --color-border:        var(--color-neutral-200);
  --color-text:          var(--text-primary);
  --color-text-muted:    var(--text-secondary);
  --color-text-light:    var(--color-neutral-100);
```

Nota: `--color-text-muted` apunta a `--text-secondary` (#525252) y no a `--text-muted` (#a3a3a3) porque se usa en textos de lectura (subtítulos, hints) donde #a3a3a3 no cumple contraste mínimo. `--color-text-light` es texto claro sobre el footer oscuro.

- [ ] **Step 4: Verificar que no quedan tokens indefinidos**

Run (Git Bash):
```bash
grep -rhoE 'var\(--[a-z0-9-]+' src --include=*.vue | sed 's/var(//' | sort -u > /tmp/used.txt; grep -oE '^\s*--[a-z0-9-]+' src/assets/styles/main.css | sed 's/^\s*//' | sort -u > /tmp/def.txt; comm -23 /tmp/used.txt /tmp/def.txt
```
Expected: sin salida (lista vacía).

- [ ] **Step 5: Crear `vercel.json`**

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

- [ ] **Step 6: Crear `public/favicon.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="7" fill="#166534"/>
  <path d="M16 26V14" stroke="#f0fdf4" stroke-width="2.4" stroke-linecap="round"/>
  <path d="M16 15c-5 0-8-3.5-8-8 5 0 8 3.5 8 8Z" fill="#4ade80"/>
  <path d="M16 18c0-5 3-8 8-8 0 5-3 8-8 8Z" fill="#86efac"/>
</svg>
```

- [ ] **Step 7: Apuntar `index.html` al favicon nuevo**

Línea 34, reemplazar:
```html
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
```
por:
```html
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
```

- [ ] **Step 8: Build**

Run: `npm run build`
Expected: `✓ built`, 0 errores. Verificar que `dist/favicon.svg` existe.

- [ ] **Step 9: Commit**

```bash
git add src/lib/supabase.js src/assets/styles/main.css vercel.json public/favicon.svg index.html src/components/producers/WhatsAppButton.vue
git commit -m "fix: cliente Supabase estricto, alias de tokens CSS, rewrite SPA y favicon

- lanza error claro si faltan las variables de entorno
- 11 tokens CSS indefinidos (botones sin fondo) resueltos con alias
- vercel.json evita 404 al refrescar rutas del SPA
- favicon propio en lugar de /vite.svg inexistente

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: `useToast` + `AppToast`

**Files:**
- Create: `src/composables/useToast.js`
- Create: `src/components/common/AppToast.vue`
- Modify: `src/App.vue`
- Create: `tests/composables/useToast.test.js`

**Interfaces:**
- Produces: `useToast() → { toasts: Ref<Array<{id, tipo:'exito'|'error', mensaje}>>, mostrarExito(mensaje) → id, mostrarError(mensaje) → id, cerrar(id) }`. Estado singleton compartido.

- [ ] **Step 1: Pruebas (fallan)**

Crear `tests/composables/useToast.test.js`:

```js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useToast } from '@/composables/useToast'

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useToast().toasts.value = []
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('agrega un toast de éxito', () => {
    const { toasts, mostrarExito } = useToast()
    mostrarExito('Guardado')
    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0]).toMatchObject({ tipo: 'exito', mensaje: 'Guardado' })
  })

  it('agrega un toast de error', () => {
    const { toasts, mostrarError } = useToast()
    mostrarError('Falló')
    expect(toasts.value[0]).toMatchObject({ tipo: 'error', mensaje: 'Falló' })
  })

  it('el estado es compartido entre instancias', () => {
    const a = useToast()
    const b = useToast()
    a.mostrarExito('uno')
    expect(b.toasts.value).toHaveLength(1)
  })

  it('se autodescarta a los 4 segundos (éxito)', () => {
    const { toasts, mostrarExito } = useToast()
    mostrarExito('temporal')
    vi.advanceTimersByTime(3999)
    expect(toasts.value).toHaveLength(1)
    vi.advanceTimersByTime(1)
    expect(toasts.value).toHaveLength(0)
  })

  it('los errores duran 6 segundos', () => {
    const { toasts, mostrarError } = useToast()
    mostrarError('error largo')
    vi.advanceTimersByTime(4000)
    expect(toasts.value).toHaveLength(1)
    vi.advanceTimersByTime(2000)
    expect(toasts.value).toHaveLength(0)
  })

  it('cerrar(id) lo quita antes de tiempo', () => {
    const { toasts, mostrarExito, cerrar } = useToast()
    const id = mostrarExito('cerrable')
    cerrar(id)
    expect(toasts.value).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Ejecutar y verificar que fallan**

Run: `npm test -- tests/composables/useToast.test.js`
Expected: FAIL por import no resuelto.

- [ ] **Step 3: Implementar `src/composables/useToast.js`**

```js
/**
 * Composable de notificaciones (toasts).
 *
 * Mantiene una cola global de mensajes breves de éxito o error que
 * AppToast.vue renderiza. Cualquier vista o composable puede llamar
 * mostrarExito()/mostrarError() sin preocuparse de dónde se muestran.
 */
import { ref } from 'vue'

// Estado compartido (singleton) fuera de la función
const toasts = ref([])
let contadorIds = 0

const DURACION_EXITO_MS = 4000
const DURACION_ERROR_MS = 6000

/**
 * Agrega un toast a la cola y programa su cierre automático.
 *
 * @param {'exito'|'error'} tipo
 * @param {string} mensaje
 * @param {number} duracionMs
 * @returns {number} id del toast
 */
function agregar(tipo, mensaje, duracionMs) {
  const id = ++contadorIds
  toasts.value.push({ id, tipo, mensaje })
  setTimeout(() => cerrar(id), duracionMs)
  return id
}

/** Quita un toast de la cola por id. */
function cerrar(id) {
  toasts.value = toasts.value.filter((t) => t.id !== id)
}

export function useToast() {
  return {
    toasts,
    mostrarExito: (mensaje) => agregar('exito', mensaje, DURACION_EXITO_MS),
    mostrarError: (mensaje) => agregar('error', mensaje, DURACION_ERROR_MS),
    cerrar,
  }
}
```

- [ ] **Step 4: Ejecutar y verificar que pasan**

Run: `npm test -- tests/composables/useToast.test.js`
Expected: PASS, 6 pruebas.

- [ ] **Step 5: Crear `src/components/common/AppToast.vue`**

```vue
<!--
  AppToast.vue - Contenedor de notificaciones globales.

  Renderiza la cola de useToast en la esquina inferior derecha.
  Se monta una sola vez en App.vue.
-->
<script setup>
import { useToast } from '@/composables/useToast'

const { toasts, cerrar } = useToast()
</script>

<template>
  <div class="toast-container" aria-live="polite">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="['toast', `toast--${toast.tipo}`]"
        role="status"
      >
        <span class="toast-icon">{{ toast.tipo === 'exito' ? '✅' : '⚠️' }}</span>
        <span class="toast-mensaje">{{ toast.mensaje }}</span>
        <button
          type="button"
          class="toast-cerrar"
          aria-label="Cerrar notificación"
          @click="cerrar(toast.id)"
        >
          ×
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  bottom: var(--spacing-6);
  right: var(--spacing-6);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  z-index: 1000;
  max-width: min(360px, calc(100vw - 2 * var(--spacing-4)));
}

.toast {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-2);
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  background: var(--bg-surface);
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  border-left: 4px solid var(--color-info);
}

.toast--exito {
  border-left-color: var(--color-success);
}

.toast--error {
  border-left-color: var(--color-error);
}

.toast-mensaje {
  flex: 1;
  line-height: 1.4;
}

.toast-cerrar {
  background: none;
  border: none;
  font-size: var(--font-size-lg);
  line-height: 1;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 0 0.25rem;
}

.toast-enter-active,
.toast-leave-active {
  transition: all var(--transition-normal);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(0.5rem);
}
</style>
```

- [ ] **Step 6: Montar en `src/App.vue`**

Reemplazar `<script setup>` y `<template>` (el `<style scoped>` queda igual; Task 9 lo modifica):

```vue
<script setup>
import AppHeader from '@/components/common/AppHeader.vue'
import AppFooter from '@/components/common/AppFooter.vue'
import AppToast from '@/components/common/AppToast.vue'
</script>

<template>
  <div class="app-layout">
    <!-- Encabezado global de navegación -->
    <AppHeader />

    <!-- Contenido principal: cambia según la ruta activa -->
    <main class="main-content">
      <RouterView />
    </main>

    <!-- Pie de página con créditos -->
    <AppFooter />

    <!-- Notificaciones globales -->
    <AppToast />
  </div>
</template>
```

- [ ] **Step 7: Build y commit**

Run: `npm run build`
Expected: `✓ built`, 0 errores.

```bash
git add src/composables/useToast.js src/components/common/AppToast.vue src/App.vue tests/composables/useToast.test.js
git commit -m "feat: sistema de notificaciones globales (useToast + AppToast)

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: Simulador de Supabase para pruebas + `useAuth` reescrito

**Files:**
- Create: `tests/helpers/supabaseMock.js`
- Modify: `src/composables/useAuth.js` (reescritura completa)
- Create: `tests/composables/useAuth.test.js`

**Interfaces:**
- Produces (helper de pruebas): `crearSupabaseMock() → { supabase, responder(tabla, respuesta), consultasDe(tabla) → builder[], storage, reiniciar() }`. Cada `builder` tiene `tabla`, `pasos: [{metodo, args}]` y es *thenable* (se puede `await`).
- Produces (`useAuth`): `useAuth() → { currentUser, isAuthenticated, loading, error, login(email, password), logout(), resetPassword(email), updatePassword(nueva) }` y export nombrado `authReady: Promise<User|null>`.

- [ ] **Step 1: Crear `tests/helpers/supabaseMock.js`**

```js
/**
 * Simulador mínimo del cliente de Supabase para pruebas unitarias.
 *
 * - `supabase.from(tabla)` devuelve un "builder" encadenable que registra
 *   cada método llamado y, al hacer `await`, resuelve con la siguiente
 *   respuesta en cola para esa tabla (o { data: null, error: null }).
 * - `supabase.storage.from(bucket)` devuelve un objeto con upload/remove simulados.
 * - `supabase.auth` expone funciones simuladas con respuestas por defecto.
 * - `supabase.rpc` es una función simulada.
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

  const supabase = {
    from: vi.fn((tabla) => crearBuilder(tabla)),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    storage: { from: vi.fn(() => storage) },
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
    for (const fn of Object.values(auth)) fn.mockClear()
  }

  return { supabase, storage, auth, responder, consultasDe, reiniciar }
}
```

- [ ] **Step 2: Pruebas de `useAuth` (fallan)**

Crear `tests/composables/useAuth.test.js`:

```js
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockRef = vi.hoisted(() => ({ actual: null }))

vi.mock('@/lib/supabase', async () => {
  const { crearSupabaseMock } = await import('../helpers/supabaseMock.js')
  mockRef.actual = crearSupabaseMock()
  return { supabase: mockRef.actual.supabase, getPublicImageUrl: (p) => `https://cdn.test/${p}` }
})

import { useAuth, authReady } from '@/composables/useAuth'

const usuario = { id: 'u-1', email: 'admin@ucr.ac.cr' }

describe('useAuth', () => {
  beforeEach(async () => {
    await authReady
    mockRef.actual.reiniciar()
    useAuth().currentUser.value = null
  })

  it('registra el listener de sesión una sola vez al importar', () => {
    // El listener se registró al cargar el módulo (antes de reiniciar),
    // así que aquí no debe volver a registrarse aunque se llame useAuth() varias veces.
    useAuth()
    useAuth()
    expect(mockRef.actual.auth.onAuthStateChange).not.toHaveBeenCalled()
  })

  it('login guarda el usuario y limpia el error', async () => {
    mockRef.actual.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: usuario, session: {} },
      error: null,
    })
    const { login, currentUser, isAuthenticated, error } = useAuth()
    await login('admin@ucr.ac.cr', 'secreto')
    expect(currentUser.value).toEqual(usuario)
    expect(isAuthenticated.value).toBe(true)
    expect(error.value).toBeNull()
  })

  it('login traduce "Invalid login credentials" al español y relanza', async () => {
    mockRef.actual.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' },
    })
    const { login, error, currentUser } = useAuth()
    await expect(login('x@y.z', 'mal')).rejects.toBeTruthy()
    expect(error.value).toBe('Correo o contraseña incorrectos.')
    expect(currentUser.value).toBeNull()
  })

  it('logout limpia el usuario', async () => {
    const { logout, currentUser } = useAuth()
    currentUser.value = usuario
    await logout()
    expect(mockRef.actual.auth.signOut).toHaveBeenCalledTimes(1)
    expect(currentUser.value).toBeNull()
  })

  it('resetPassword usa la ruta /restablecer-contrasena del origen actual', async () => {
    const { resetPassword } = useAuth()
    await resetPassword('admin@ucr.ac.cr')
    expect(mockRef.actual.auth.resetPasswordForEmail).toHaveBeenCalledWith(
      'admin@ucr.ac.cr',
      { redirectTo: `${window.location.origin}/restablecer-contrasena` }
    )
  })

  it('updatePassword llama updateUser con la nueva contraseña', async () => {
    const { updatePassword } = useAuth()
    await updatePassword('nueva-clave-123')
    expect(mockRef.actual.auth.updateUser).toHaveBeenCalledWith({ password: 'nueva-clave-123' })
  })

  it('updatePassword expone el error traducido si la clave es débil', async () => {
    mockRef.actual.auth.updateUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Password should be at least 6 characters' },
    })
    const { updatePassword, error } = useAuth()
    await expect(updatePassword('123')).rejects.toBeTruthy()
    expect(error.value).toBe('La contraseña debe tener al menos 8 caracteres.')
  })
})
```

- [ ] **Step 3: Ejecutar y verificar que fallan**

Run: `npm test -- tests/composables/useAuth.test.js`
Expected: FAIL — `authReady` no se exporta / `resetPassword is not a function`.

- [ ] **Step 4: Reescribir `src/composables/useAuth.js`**

```js
/**
 * Composable de autenticación.
 *
 * El estado del usuario es un singleton a nivel de módulo: la sesión
 * inicial y el listener de cambios se registran UNA sola vez al importar
 * este archivo, no en cada componente que llame useAuth().
 */
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

// --- Estado compartido ---
const currentUser = ref(null)

/**
 * Promesa que resuelve cuando se conoce la sesión inicial.
 * Útil para vistas que necesitan saber si hay sesión antes de renderizar.
 */
export const authReady = supabase.auth
  .getSession()
  .then(({ data: { session } }) => {
    currentUser.value = session?.user ?? null
    return currentUser.value
  })
  .catch(() => {
    currentUser.value = null
    return null
  })

// Mantener el estado sincronizado con login, logout y refresco de token
supabase.auth.onAuthStateChange((_event, session) => {
  currentUser.value = session?.user ?? null
})

/**
 * Traduce los mensajes de error más comunes de Supabase Auth al español.
 *
 * @param {string|undefined} mensaje
 * @returns {string}
 */
function traducirErrorAuth(mensaje = '') {
  const m = mensaje.toLowerCase()
  if (m.includes('invalid login credentials')) return 'Correo o contraseña incorrectos.'
  if (m.includes('email not confirmed')) return 'El correo aún no ha sido confirmado.'
  if (m.includes('password should be at least')) return 'La contraseña debe tener al menos 8 caracteres.'
  if (m.includes('rate limit') || m.includes('too many requests')) return 'Demasiados intentos. Espere unos minutos e intente de nuevo.'
  if (m.includes('same password')) return 'La nueva contraseña debe ser distinta a la anterior.'
  return mensaje || 'Ocurrió un error de autenticación.'
}

export function useAuth() {
  const loading = ref(false)
  const error = ref(null)

  const isAuthenticated = computed(() => !!currentUser.value)

  /**
   * Ejecuta una operación de auth manejando loading/error de forma uniforme.
   * Relanza el error para que la vista pueda decidir qué hacer.
   */
  async function ejecutar(operacion) {
    loading.value = true
    error.value = null
    try {
      return await operacion()
    } catch (err) {
      error.value = traducirErrorAuth(err?.message)
      throw err
    } finally {
      loading.value = false
    }
  }

  /** Iniciar sesión con correo y contraseña. */
  function login(email, password) {
    return ejecutar(async () => {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) throw authError
      currentUser.value = data.user
      return data
    })
  }

  /** Cerrar la sesión actual. */
  function logout() {
    return ejecutar(async () => {
      const { error: authError } = await supabase.auth.signOut()
      if (authError) throw authError
      currentUser.value = null
    })
  }

  /**
   * Enviar correo de recuperación de contraseña.
   * El enlace del correo lleva a /restablecer-contrasena.
   */
  function resetPassword(email) {
    return ejecutar(async () => {
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/restablecer-contrasena`,
      })
      if (authError) throw authError
    })
  }

  /** Cambiar la contraseña del usuario con sesión activa. */
  function updatePassword(nuevaContrasena) {
    return ejecutar(async () => {
      const { error: authError } = await supabase.auth.updateUser({ password: nuevaContrasena })
      if (authError) throw authError
    })
  }

  return {
    currentUser,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    resetPassword,
    updatePassword,
  }
}
```

- [ ] **Step 5: Ejecutar y verificar que pasan**

Run: `npm test -- tests/composables/useAuth.test.js`
Expected: PASS, 7 pruebas.

- [ ] **Step 6: Build y commit**

Run: `npm run build`
Expected: `✓ built`, 0 errores (AppHeader y LoginView siguen usando `login`, `logout`, `isAuthenticated`, `loading`, `error`, que se mantienen).

```bash
git add tests/helpers/supabaseMock.js src/composables/useAuth.js tests/composables/useAuth.test.js
git commit -m "refactor(auth): listener único a nivel de módulo, errores en español, resetPassword/updatePassword

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 6: `useStorage`

**Files:**
- Create: `src/composables/useStorage.js`
- Create: `tests/composables/useStorage.test.js`

**Interfaces:**
- Consumes: `supabase`, `BUCKET_IMAGENES` (Task 3).
- Produces: `useStorage() → { uploadImage(file: File) → Promise<string>` (ruta relativa; lanza si falla), `deleteImage(path: string|null) → Promise<void>` (nunca lanza) }`.

- [ ] **Step 1: Pruebas (fallan)**

Crear `tests/composables/useStorage.test.js`:

```js
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockRef = vi.hoisted(() => ({ actual: null }))

vi.mock('@/lib/supabase', async () => {
  const { crearSupabaseMock } = await import('../helpers/supabaseMock.js')
  mockRef.actual = crearSupabaseMock()
  return {
    supabase: mockRef.actual.supabase,
    BUCKET_IMAGENES: 'product-images',
    getPublicImageUrl: (p) => `https://cdn.test/${p}`,
  }
})

import { useStorage } from '@/composables/useStorage'

describe('useStorage', () => {
  beforeEach(() => {
    mockRef.actual.reiniciar()
  })

  describe('uploadImage', () => {
    it('sube a productores/<nombre único>.<ext> y devuelve la ruta', async () => {
      const archivo = new File(['x'], 'foto.webp', { type: 'image/webp' })
      const { uploadImage } = useStorage()
      const ruta = await uploadImage(archivo)

      expect(ruta).toMatch(/^productores\/\d+-[a-z0-9]+\.webp$/)
      expect(mockRef.actual.supabase.storage.from).toHaveBeenCalledWith('product-images')
      expect(mockRef.actual.storage.upload).toHaveBeenCalledWith(
        ruta,
        archivo,
        expect.objectContaining({ upsert: false, contentType: 'image/webp' })
      )
    })

    it('usa la extensión en minúsculas', async () => {
      const archivo = new File(['x'], 'FOTO.JPG', { type: 'image/jpeg' })
      const { uploadImage } = useStorage()
      const ruta = await uploadImage(archivo)
      expect(ruta.endsWith('.jpg')).toBe(true)
    })

    it('lanza el error de Supabase si la subida falla', async () => {
      mockRef.actual.storage.upload.mockResolvedValueOnce({ data: null, error: new Error('cuota excedida') })
      const { uploadImage } = useStorage()
      await expect(uploadImage(new File(['x'], 'a.png', { type: 'image/png' }))).rejects.toThrow('cuota excedida')
    })
  })

  describe('deleteImage', () => {
    it('elimina la ruta indicada del bucket', async () => {
      const { deleteImage } = useStorage()
      await deleteImage('productores/abc.webp')
      expect(mockRef.actual.storage.remove).toHaveBeenCalledWith(['productores/abc.webp'])
    })

    it('no hace nada si la ruta está vacía', async () => {
      const { deleteImage } = useStorage()
      await deleteImage('')
      await deleteImage(null)
      expect(mockRef.actual.storage.remove).not.toHaveBeenCalled()
    })

    it('no lanza si Supabase devuelve error', async () => {
      mockRef.actual.storage.remove.mockResolvedValueOnce({ data: null, error: new Error('no existe') })
      const { deleteImage } = useStorage()
      await expect(deleteImage('productores/x.webp')).resolves.toBeUndefined()
    })
  })
})
```

- [ ] **Step 2: Ejecutar y verificar que fallan**

Run: `npm test -- tests/composables/useStorage.test.js`
Expected: FAIL por import no resuelto.

- [ ] **Step 3: Implementar `src/composables/useStorage.js`**

```js
/**
 * Composable de almacenamiento de imágenes en Supabase Storage.
 *
 * Única responsabilidad: subir y eliminar archivos del bucket de imágenes.
 * La compresión ocurre antes, en ImageUploader.vue.
 */
import { supabase, BUCKET_IMAGENES } from '@/lib/supabase'

const CARPETA_PRODUCTORES = 'productores'

export function useStorage() {
  /**
   * Sube una imagen con un nombre único y devuelve su ruta relativa.
   *
   * @param {File} file
   * @returns {Promise<string>} Ruta dentro del bucket (ej: 'productores/1700000000-ab12cd.webp')
   * @throws Error de Supabase si la subida falla
   */
  async function uploadImage(file) {
    const extension = (file.name.split('.').pop() || 'webp').toLowerCase()
    const nombreUnico = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extension}`
    const ruta = `${CARPETA_PRODUCTORES}/${nombreUnico}`

    const { error } = await supabase.storage
      .from(BUCKET_IMAGENES)
      .upload(ruta, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      })

    if (error) throw error

    return ruta
  }

  /**
   * Elimina una imagen del bucket. Nunca lanza: un fallo al borrar una
   * foto no debe impedir borrar o actualizar el productor.
   *
   * @param {string|null|undefined} ruta
   */
  async function deleteImage(ruta) {
    if (!ruta) return

    const { error } = await supabase.storage.from(BUCKET_IMAGENES).remove([ruta])

    if (error) {
      console.warn('[useStorage] No se pudo eliminar la imagen:', ruta, error.message)
    }
  }

  return { uploadImage, deleteImage }
}
```

- [ ] **Step 4: Ejecutar y verificar que pasan**

Run: `npm test -- tests/composables/useStorage.test.js`
Expected: PASS, 6 pruebas.

- [ ] **Step 5: Commit**

```bash
git add src/composables/useStorage.js tests/composables/useStorage.test.js
git commit -m "feat(storage): composable useStorage para subir y eliminar imágenes

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 7: Migración SQL 002 — lista blanca de admins, inactivos ocultos, contactos

**Files:**
- Create: `database/migrations/002_seguridad_admin_y_contactos.sql`

**Interfaces:**
- Produces (BD): función `es_admin()`, tabla `contactos_whatsapp`, RPC `registrar_contacto(p_productor_id uuid)`, vista `resumen_contactos_whatsapp(productor_id, total, ultimos_30_dias)`. Task 13 (`useContactos`) consume el RPC y la vista.

- [ ] **Step 1: Escribir la migración**

Crear `database/migrations/002_seguridad_admin_y_contactos.sql`:

```sql
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
WHERE telefono IS NOT NULL;
-- Idempotente: un número ya normalizado (11 dígitos) cae en ELSE y queda igual.


-- ============================================================================
-- FIN DE LA MIGRACIÓN 002
--
-- PASOS MANUALES PENDIENTES (ver README):
--   • Authentication → Providers → Email → desactivar "Allow new users to sign up".
--   • Authentication → URL Configuration → Site URL y Redirect URLs.
--   • Insertar el primer administrador en admin_profiles.
-- ============================================================================
```

- [ ] **Step 2: Ejecutar la migración en Supabase (manual, lo hace el usuario)**

Abrir el SQL Editor del proyecto Supabase, pegar el contenido completo del archivo y ejecutar. Expected: `Success. No rows returned`.

Si el bucket `product-images` no existe todavía, las políticas de Storage se crean igual (no dependen de que exista), pero hay que crearlo desde Storage → New bucket → nombre `product-images`, marcar **Public**.

- [ ] **Step 3: Verificar el bootstrap del primer admin**

En el SQL Editor:
```sql
SELECT id, email FROM auth.users;
```
Copiar el UUID del usuario administrador actual y ejecutar:
```sql
INSERT INTO public.admin_profiles (id, nombre_completo, rol)
VALUES ('<uuid copiado>', 'Nombre del administrador', 'superadmin')
ON CONFLICT (id) DO NOTHING;
```
Luego verificar:
```sql
SELECT p.id, u.email, p.rol FROM public.admin_profiles p JOIN auth.users u ON u.id = p.id;
```
Expected: una fila con el correo del admin.

- [ ] **Step 4: Verificar que un anónimo no ve inactivos**

En el SQL Editor:
```sql
SET ROLE anon;
SELECT count(*) FROM public.productores WHERE activo = false;
RESET ROLE;
```
Expected: `0` (aunque existan productores inactivos).

- [ ] **Step 5: Spike — ¿funciona el filtro de categoría en una sola consulta?**

Crear `spike-categoria.mjs` **en la raíz del proyecto** (temporal; se borra al final de este paso y nunca se commitea). Tiene que estar dentro del proyecto para que Node resuelva `@supabase/supabase-js` desde `node_modules`. Lee `.env` y prueba el doble embed con alias:

```js
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  readFileSync('.env', 'utf8')
    .split('\n').filter((l) => l.includes('=') && !l.startsWith('#'))
    .map((l) => l.split('=').map((s) => s.trim()))
)
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)

const { data: cats } = await supabase.from('categorias').select('id, nombre').limit(1)
const categoriaId = cats[0].id
console.log('Probando con categoría:', cats[0].nombre)

const { data, error } = await supabase
  .from('productores')
  .select(`
    id, nombre_negocio,
    filtro:productor_categorias!inner(categoria_id),
    categorias:productor_categorias(categoria:categorias(id, nombre))
  `)
  .eq('filtro.categoria_id', categoriaId)
  .eq('activo', true)

console.log('error:', error)
console.log('productores:', data?.length)
for (const p of data ?? []) {
  console.log(' -', p.nombre_negocio, '→ categorías:', p.categorias.map((c) => c.categoria.nombre))
}
```

Run: `node spike-categoria.mjs`

**Resultado esperado si funciona:** `error: null`, cada productor listado muestra **todas** sus categorías (no solo la filtrada). → Task 8 usa la **Opción A** (una consulta).

**Si `error` no es null** (por ejemplo "Could not embed because more than one relationship was found") o los productores muestran solo la categoría filtrada → Task 8 usa la **Opción B** (dos consultas, código actual).

Anotar el resultado en el mensaje de commit de Task 8. Borrar el script:

```bash
rm spike-categoria.mjs
```

- [ ] **Step 6: Commit**

```bash
git status --short   # debe mostrar SOLO la migración; si aparece spike-categoria.mjs, borrarlo
git add database/migrations/002_seguridad_admin_y_contactos.sql
git commit -m "feat(db): migración 002 — lista blanca de admins, inactivos ocultos, contactos WhatsApp

- es_admin() + políticas de escritura solo para admin_profiles
- productores inactivos invisibles para anon
- políticas reales de Storage para product-images
- tabla contactos_whatsapp, RPC registrar_contacto, vista resumen
- normaliza teléfonos existentes a 506XXXXXXXX

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 8: `useProductores` — búsqueda, filtro, limpieza de datos, fotos sin huérfanos

**Files:**
- Modify: `src/composables/useProductores.js` (reescritura completa)
- Create: `tests/composables/useProductores.test.js`

**Interfaces:**
- Consumes: `useStorage` (Task 6), `normalizarTelefono` (Task 1), `sanitizarBusqueda` (Task 2).
- Produces: `useProductores() → { productores, loading, error, fetchProductores(filters), fetchProductorById(id), createProductor(data), updateProductor(id, data), deleteProductor(id) }`.
  - `filters = { search?, canton_id?, categoria_id?, onlyActive? (default true) }`.
  - `data = { nombre_negocio, nombre_contacto, telefono, email, descripcion, canton_id, direccion_detalle, foto_url, activo, categoria_ids: string[], fotoFile: File|null }`.
  - `createProductor`/`updateProductor` devuelven el registro o `null` (y dejan el mensaje en `error`). `deleteProductor` devuelve `boolean`.
  - **`uploadImage` ya no existe aquí** (Task 10 actualiza `ImageUploader`, que era su único consumidor externo).

- [ ] **Step 1: Pruebas (fallan)**

Crear `tests/composables/useProductores.test.js`:

```js
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockRef = vi.hoisted(() => ({ actual: null }))

vi.mock('@/lib/supabase', async () => {
  const { crearSupabaseMock } = await import('../helpers/supabaseMock.js')
  mockRef.actual = crearSupabaseMock()
  return {
    supabase: mockRef.actual.supabase,
    BUCKET_IMAGENES: 'product-images',
    getPublicImageUrl: (p) => `https://cdn.test/${p}`,
  }
})

const storageMock = vi.hoisted(() => ({
  uploadImage: vi.fn(),
  deleteImage: vi.fn(),
}))

vi.mock('@/composables/useStorage', () => ({
  useStorage: () => storageMock,
}))

import { useProductores } from '@/composables/useProductores'

/** Devuelve los pasos de un builder como "metodo(arg0)" para aserciones legibles. */
function pasosDe(builder) {
  return builder.pasos.map((p) => ({ metodo: p.metodo, arg: p.args[0] }))
}

const datosBase = {
  nombre_negocio: '  Finca La Cosecha  ',
  nombre_contacto: 'Ana',
  telefono: '8888-4444',
  email: '',
  descripcion: '',
  canton_id: 'canton-1',
  direccion_detalle: '',
  foto_url: '',
  activo: true,
  categoria_ids: ['cat-1', 'cat-2'],
  fotoFile: null,
}

describe('useProductores', () => {
  beforeEach(() => {
    mockRef.actual.reiniciar()
    storageMock.uploadImage.mockReset().mockResolvedValue('productores/nueva.webp')
    storageMock.deleteImage.mockReset().mockResolvedValue(undefined)
  })

  describe('fetchProductores', () => {
    it('por defecto filtra activos y ordena por nombre', async () => {
      mockRef.actual.responder('productores', { data: [{ id: 'p1' }], error: null })
      const { fetchProductores, productores } = useProductores()
      await fetchProductores()

      const [consulta] = mockRef.actual.consultasDe('productores')
      expect(pasosDe(consulta)).toContainEqual({ metodo: 'eq', arg: 'activo' })
      expect(pasosDe(consulta)).toContainEqual({ metodo: 'order', arg: 'nombre_negocio' })
      expect(productores.value).toEqual([{ id: 'p1' }])
    })

    it('con onlyActive=false no filtra por activo', async () => {
      const { fetchProductores } = useProductores()
      await fetchProductores({ onlyActive: false })
      const [consulta] = mockRef.actual.consultasDe('productores')
      expect(consulta.eq).not.toHaveBeenCalledWith('activo', true)
    })

    it('la búsqueda usa .or sobre nombre_negocio y descripcion con texto sanitizado', async () => {
      const { fetchProductores } = useProductores()
      await fetchProductores({ search: 'queso, (fresco)' })
      const [consulta] = mockRef.actual.consultasDe('productores')
      expect(consulta.or).toHaveBeenCalledWith(
        'nombre_negocio.ilike.%queso fresco%,descripcion.ilike.%queso fresco%'
      )
    })

    it('una búsqueda vacía o solo con símbolos no aplica .or', async () => {
      const { fetchProductores } = useProductores()
      await fetchProductores({ search: '  ,,()  ' })
      const [consulta] = mockRef.actual.consultasDe('productores')
      expect(consulta.or).not.toHaveBeenCalled()
    })

    it('filtra por cantón', async () => {
      const { fetchProductores } = useProductores()
      await fetchProductores({ canton_id: 'canton-9' })
      const [consulta] = mockRef.actual.consultasDe('productores')
      expect(consulta.eq).toHaveBeenCalledWith('canton_id', 'canton-9')
    })

    it('expone el error de Supabase', async () => {
      mockRef.actual.responder('productores', { data: null, error: { message: 'boom' } })
      const { fetchProductores, error, productores } = useProductores()
      await fetchProductores()
      expect(error.value).toBe('boom')
      expect(productores.value).toEqual([])
    })
  })

  describe('createProductor', () => {
    it('limpia strings, convierte vacíos a null y normaliza el teléfono', async () => {
      mockRef.actual.responder('productores', { data: { id: 'nuevo' }, error: null })
      const { createProductor } = useProductores()
      await createProductor(datosBase)

      const [insercion] = mockRef.actual.consultasDe('productores')
      expect(insercion.insert).toHaveBeenCalledWith({
        nombre_negocio: 'Finca La Cosecha',
        nombre_contacto: 'Ana',
        telefono: '50688884444',
        email: null,
        descripcion: null,
        canton_id: 'canton-1',
        direccion_detalle: null,
        foto_url: null,
        activo: true,
      })
    })

    it('inserta las categorías asociadas', async () => {
      mockRef.actual.responder('productores', { data: { id: 'nuevo' }, error: null })
      const { createProductor } = useProductores()
      await createProductor(datosBase)

      const [relaciones] = mockRef.actual.consultasDe('productor_categorias')
      expect(relaciones.insert).toHaveBeenCalledWith([
        { productor_id: 'nuevo', categoria_id: 'cat-1' },
        { productor_id: 'nuevo', categoria_id: 'cat-2' },
      ])
    })

    it('sube la foto antes de insertar y guarda su ruta', async () => {
      mockRef.actual.responder('productores', { data: { id: 'nuevo' }, error: null })
      const archivo = new File(['x'], 'f.webp', { type: 'image/webp' })
      const { createProductor } = useProductores()
      await createProductor({ ...datosBase, fotoFile: archivo })

      expect(storageMock.uploadImage).toHaveBeenCalledWith(archivo)
      const [insercion] = mockRef.actual.consultasDe('productores')
      expect(insercion.insert.mock.calls[0][0].foto_url).toBe('productores/nueva.webp')
    })

    it('si el insert falla después de subir la foto, la borra y devuelve null', async () => {
      mockRef.actual.responder('productores', { data: null, error: { message: 'falló' } })
      const { createProductor, error } = useProductores()
      const resultado = await createProductor({ ...datosBase, fotoFile: new File(['x'], 'f.webp') })

      expect(resultado).toBeNull()
      expect(error.value).toBe('falló')
      expect(storageMock.deleteImage).toHaveBeenCalledWith('productores/nueva.webp')
    })
  })

  describe('updateProductor', () => {
    it('borra la foto anterior si cambió', async () => {
      mockRef.actual.responder('productores', { data: { foto_url: 'productores/vieja.webp' }, error: null }) // select foto_url
      mockRef.actual.responder('productores', { data: { id: 'p1' }, error: null })                          // update
      const { updateProductor } = useProductores()
      await updateProductor('p1', { ...datosBase, fotoFile: new File(['x'], 'n.webp') })

      expect(storageMock.uploadImage).toHaveBeenCalled()
      expect(storageMock.deleteImage).toHaveBeenCalledWith('productores/vieja.webp')
    })

    it('no borra la foto si es la misma', async () => {
      mockRef.actual.responder('productores', { data: { foto_url: 'productores/misma.webp' }, error: null })
      mockRef.actual.responder('productores', { data: { id: 'p1' }, error: null })
      const { updateProductor } = useProductores()
      await updateProductor('p1', { ...datosBase, foto_url: 'productores/misma.webp', fotoFile: null })

      expect(storageMock.uploadImage).not.toHaveBeenCalled()
      expect(storageMock.deleteImage).not.toHaveBeenCalled()
    })

    it('borra la foto anterior si el usuario la quitó sin poner otra', async () => {
      mockRef.actual.responder('productores', { data: { foto_url: 'productores/vieja.webp' }, error: null })
      mockRef.actual.responder('productores', { data: { id: 'p1' }, error: null })
      const { updateProductor } = useProductores()
      await updateProductor('p1', { ...datosBase, foto_url: '', fotoFile: null })

      expect(storageMock.deleteImage).toHaveBeenCalledWith('productores/vieja.webp')
      const [, actualizacion] = mockRef.actual.consultasDe('productores')
      expect(actualizacion.update.mock.calls[0][0].foto_url).toBeNull()
    })

    it('reemplaza las categorías (delete + insert)', async () => {
      mockRef.actual.responder('productores', { data: { foto_url: null }, error: null })
      mockRef.actual.responder('productores', { data: { id: 'p1' }, error: null })
      const { updateProductor } = useProductores()
      await updateProductor('p1', datosBase)

      const [borrado, insercion] = mockRef.actual.consultasDe('productor_categorias')
      expect(borrado.delete).toHaveBeenCalled()
      expect(borrado.eq).toHaveBeenCalledWith('productor_id', 'p1')
      expect(insercion.insert).toHaveBeenCalledWith([
        { productor_id: 'p1', categoria_id: 'cat-1' },
        { productor_id: 'p1', categoria_id: 'cat-2' },
      ])
    })
  })

  describe('deleteProductor', () => {
    it('borra el registro y luego su foto', async () => {
      mockRef.actual.responder('productores', { data: { foto_url: 'productores/x.webp' }, error: null })
      mockRef.actual.responder('productores', { data: null, error: null })
      const { deleteProductor } = useProductores()
      const ok = await deleteProductor('p1')

      expect(ok).toBe(true)
      expect(storageMock.deleteImage).toHaveBeenCalledWith('productores/x.webp')
    })

    it('quita el productor de la lista local', async () => {
      mockRef.actual.responder('productores', { data: { foto_url: null }, error: null })
      mockRef.actual.responder('productores', { data: null, error: null })
      const { deleteProductor, productores } = useProductores()
      productores.value = [{ id: 'p1' }, { id: 'p2' }]
      await deleteProductor('p1')
      expect(productores.value).toEqual([{ id: 'p2' }])
    })

    it('devuelve false y no toca la foto si el delete falla', async () => {
      mockRef.actual.responder('productores', { data: { foto_url: 'productores/x.webp' }, error: null })
      mockRef.actual.responder('productores', { data: null, error: { message: 'no' } })
      const { deleteProductor, error } = useProductores()
      const ok = await deleteProductor('p1')

      expect(ok).toBe(false)
      expect(error.value).toBe('no')
      expect(storageMock.deleteImage).not.toHaveBeenCalled()
    })
  })
})
```

- [ ] **Step 2: Ejecutar y verificar que fallan**

Run: `npm test -- tests/composables/useProductores.test.js`
Expected: FAIL en la mayoría (búsqueda con `.or`, `fotoFile`, `deleteImage`, `null`s).

- [ ] **Step 3: Reescribir `src/composables/useProductores.js`**

El bloque de filtro por categoría tiene dos opciones; usar la que indicó el spike de Task 7 Step 5 y **borrar la otra**.

```js
/**
 * Composable para operaciones CRUD de productores.
 *
 * Consulta, crea, actualiza y elimina productores junto con sus categorías
 * y su foto. La subida/borrado físico de la foto lo hace useStorage.
 */
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useStorage } from '@/composables/useStorage'
import { normalizarTelefono } from '@/utils/telefono'
import { sanitizarBusqueda } from '@/utils/busqueda'

// Columnas y relaciones que se traen siempre al leer productores
const SELECT_PRODUCTOR = `
  *,
  canton:cantones(id, nombre),
  categorias:productor_categorias(
    categoria:categorias(id, nombre)
  )
`

// Campos de texto opcionales: si llegan vacíos se guardan como NULL
const CAMPOS_OPCIONALES = ['email', 'descripcion', 'direccion_detalle', 'foto_url']

/**
 * Separa los datos del formulario en: campos del productor (limpios),
 * ids de categorías y archivo de foto pendiente de subir.
 */
function prepararDatos(data) {
  const { categoria_ids = [], fotoFile = null, ...campos } = data
  const limpios = {}

  for (const [clave, valor] of Object.entries(campos)) {
    limpios[clave] = typeof valor === 'string' ? valor.trim() : valor
  }

  for (const clave of CAMPOS_OPCIONALES) {
    if (limpios[clave] === '') limpios[clave] = null
  }

  if (limpios.canton_id === '') limpios.canton_id = null

  if (limpios.telefono) {
    limpios.telefono = normalizarTelefono(limpios.telefono) ?? limpios.telefono
  }

  return { campos: limpios, categoria_ids, fotoFile }
}

export function useProductores() {
  const productores = ref([])
  const loading = ref(false)
  const error = ref(null)

  const { uploadImage, deleteImage } = useStorage()

  /** Envuelve una operación con loading/error; devuelve `valorSiFalla` si lanza. */
  async function ejecutar(operacion, valorSiFalla) {
    loading.value = true
    error.value = null
    try {
      return await operacion()
    } catch (err) {
      error.value = err?.message || 'Ocurrió un error inesperado'
      console.error('[useProductores]', err)
      return valorSiFalla
    } finally {
      loading.value = false
    }
  }

  /** Reemplaza las categorías de un productor por la lista indicada. */
  async function guardarCategorias(productorId, categoriaIds, { reemplazar }) {
    if (reemplazar) {
      const { error: deleteError } = await supabase
        .from('productor_categorias')
        .delete()
        .eq('productor_id', productorId)
      if (deleteError) throw deleteError
    }

    if (categoriaIds.length === 0) return

    const filas = categoriaIds.map((categoriaId) => ({
      productor_id: productorId,
      categoria_id: categoriaId,
    }))
    const { error: insertError } = await supabase.from('productor_categorias').insert(filas)
    if (insertError) throw insertError
  }

  /** Lee solo la ruta de la foto actual de un productor. */
  async function obtenerFotoActual(id) {
    const { data } = await supabase.from('productores').select('foto_url').eq('id', id).single()
    return data?.foto_url ?? null
  }

  /**
   * Lista productores con filtros opcionales.
   *
   * @param {Object} filters
   * @param {string} [filters.search]       - Texto a buscar en nombre y descripción
   * @param {string} [filters.canton_id]
   * @param {string} [filters.categoria_id]
   * @param {boolean} [filters.onlyActive]  - Solo activos (por defecto true)
   */
  async function fetchProductores(filters = {}) {
    const resultado = await ejecutar(async () => {
      const onlyActive = filters.onlyActive !== undefined ? filters.onlyActive : true

      // ===== OPCIÓN A: filtro de categoría en una sola consulta (si el spike funcionó) =====
      const select = filters.categoria_id
        ? `${SELECT_PRODUCTOR}, filtro:productor_categorias!inner(categoria_id)`
        : SELECT_PRODUCTOR

      let query = supabase.from('productores').select(select)

      if (filters.categoria_id) {
        query = query.eq('filtro.categoria_id', filters.categoria_id)
      }
      // ===== FIN OPCIÓN A =====

      // ===== OPCIÓN B: dos consultas (si el spike NO funcionó) =====
      // let query = supabase.from('productores').select(SELECT_PRODUCTOR)
      //
      // if (filters.categoria_id) {
      //   const { data: relaciones, error: catError } = await supabase
      //     .from('productor_categorias')
      //     .select('productor_id')
      //     .eq('categoria_id', filters.categoria_id)
      //   if (catError) throw catError
      //
      //   const ids = relaciones?.map((r) => r.productor_id) ?? []
      //   if (ids.length === 0) return []
      //   query = query.in('id', ids)
      // }
      // ===== FIN OPCIÓN B =====

      if (onlyActive) {
        query = query.eq('activo', true)
      }

      if (filters.canton_id) {
        query = query.eq('canton_id', filters.canton_id)
      }

      const texto = sanitizarBusqueda(filters.search)
      if (texto) {
        query = query.or(`nombre_negocio.ilike.%${texto}%,descripcion.ilike.%${texto}%`)
      }

      query = query.order('nombre_negocio', { ascending: true })

      const { data, error: fetchError } = await query
      if (fetchError) throw fetchError

      return data ?? []
    }, [])

    productores.value = resultado
  }

  /**
   * Obtiene un productor por id con sus relaciones.
   * @returns {Promise<Object|null>}
   */
  function fetchProductorById(id) {
    return ejecutar(async () => {
      const { data, error: fetchError } = await supabase
        .from('productores')
        .select(SELECT_PRODUCTOR)
        .eq('id', id)
        .single()
      if (fetchError) throw fetchError
      return data
    }, null)
  }

  /**
   * Crea un productor. Si viene `fotoFile`, la sube primero.
   * @returns {Promise<Object|null>} Registro creado o null si falló
   */
  function createProductor(data) {
    return ejecutar(async () => {
      const { campos, categoria_ids, fotoFile } = prepararDatos(data)

      let fotoSubida = null
      if (fotoFile) {
        fotoSubida = await uploadImage(fotoFile)
        campos.foto_url = fotoSubida
      }

      const { data: nuevo, error: insertError } = await supabase
        .from('productores')
        .insert(campos)
        .select()
        .single()

      if (insertError) {
        // No dejar la foto huérfana si el registro no se creó
        if (fotoSubida) await deleteImage(fotoSubida)
        throw insertError
      }

      await guardarCategorias(nuevo.id, categoria_ids, { reemplazar: false })

      return nuevo
    }, null)
  }

  /**
   * Actualiza un productor y re-asocia sus categorías.
   * Sube la foto nueva si viene `fotoFile` y borra la anterior si cambió.
   * @returns {Promise<Object|null>}
   */
  function updateProductor(id, data) {
    return ejecutar(async () => {
      const { campos, categoria_ids, fotoFile } = prepararDatos(data)
      const fotoAnterior = await obtenerFotoActual(id)

      if (fotoFile) {
        campos.foto_url = await uploadImage(fotoFile)
      }

      const { data: actualizado, error: updateError } = await supabase
        .from('productores')
        .update(campos)
        .eq('id', id)
        .select()
        .single()
      if (updateError) throw updateError

      await guardarCategorias(id, categoria_ids, { reemplazar: true })

      if (fotoAnterior && fotoAnterior !== campos.foto_url) {
        await deleteImage(fotoAnterior)
      }

      return actualizado
    }, null)
  }

  /**
   * Elimina un productor y su foto. Las categorías se borran por CASCADE.
   * @returns {Promise<boolean>}
   */
  function deleteProductor(id) {
    return ejecutar(async () => {
      const foto = await obtenerFotoActual(id)

      const { error: deleteError } = await supabase.from('productores').delete().eq('id', id)
      if (deleteError) throw deleteError

      await deleteImage(foto)

      productores.value = productores.value.filter((p) => p.id !== id)
      return true
    }, false)
  }

  return {
    productores,
    loading,
    error,
    fetchProductores,
    fetchProductorById,
    createProductor,
    updateProductor,
    deleteProductor,
  }
}
```

Nota sobre `fetchProductores`: `ejecutar(..., [])` devuelve `[]` cuando hay error, así la lista queda vacía y el mensaje en `error` (la prueba "expone el error de Supabase" lo exige).

- [ ] **Step 4: Ejecutar y verificar que pasan**

Run: `npm test -- tests/composables/useProductores.test.js`
Expected: PASS, 16 pruebas.

Si se eligió la Opción B, la prueba "filtra por cantón" sigue pasando; ninguna prueba depende de la opción elegida.

- [ ] **Step 5: Build**

Run: `npm run build`
Expected: FAIL — `ImageUploader.vue` importa `uploadImage` de `useProductores`, que ya no existe. Aplicar el parche mínimo en `src/components/admin/ImageUploader.vue`: reemplazar

```js
import { useProductores } from '@/composables/useProductores'
```
por
```js
import { useStorage } from '@/composables/useStorage'
```
y
```js
const { uploadImage } = useProductores()
```
por
```js
const { uploadImage } = useStorage()
```
(Task 10 reescribe este componente; esto solo evita un commit con build roto.)

Run: `npm run build`
Expected: `✓ built`, 0 errores.

- [ ] **Step 6: Commit**

```bash
git add src/composables/useProductores.js tests/composables/useProductores.test.js src/components/admin/ImageUploader.vue
git commit -m "refactor(productores): búsqueda en descripción, datos limpios, fotos sin huérfanos

Filtro de categoría: <Opción A en una consulta | Opción B en dos consultas>
según spike contra Supabase real.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 9: Guard testeable, `AdminLayout` y rutas anidadas

**Files:**
- Create: `src/router/guard.js`
- Create: `tests/router/guard.test.js`
- Create: `src/layouts/AdminLayout.vue`
- Modify: `src/router/index.js` (reescritura completa)
- Modify: `src/App.vue` (template y estilos)
- Modify: `src/views/admin/AdminDashboardView.vue` (template y estilos)
- Modify: `src/views/admin/ProducerCreateView.vue` (template y estilos)
- Modify: `src/views/admin/ProducerEditView.vue` (template y estilos)

**Interfaces:**
- Produces: `guardiaAutenticacion(to) → true | RouteLocationRaw` (exportada desde `src/router/guard.js`). Rutas con nombres `home`, `producer-detail`, `login`, `reset-password` (la vista se crea en Task 12; aquí se declara la ruta con lazy import — el archivo debe existir para que el build pase, ver Step 6), `admin-dashboard`, `producer-create`, `producer-edit`.

- [ ] **Step 1: Pruebas del guard (fallan)**

Crear `tests/router/guard.test.js`:

```js
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockRef = vi.hoisted(() => ({ actual: null }))

vi.mock('@/lib/supabase', async () => {
  const { crearSupabaseMock } = await import('../helpers/supabaseMock.js')
  mockRef.actual = crearSupabaseMock()
  return { supabase: mockRef.actual.supabase }
})

import { guardiaAutenticacion } from '@/router/guard'

/** Construye un objeto "to" mínimo como el que entrega Vue Router. */
function ruta({ name, fullPath, requiresAuth = false, title }) {
  return {
    name,
    fullPath,
    meta: { title },
    matched: [{ meta: { requiresAuth } }, { meta: {} }],
  }
}

function conSesion(activa) {
  mockRef.actual.auth.getSession.mockResolvedValueOnce({
    data: { session: activa ? { user: { id: 'u1' } } : null },
    error: null,
  })
}

describe('guardiaAutenticacion', () => {
  beforeEach(() => {
    mockRef.actual.reiniciar()
    document.title = ''
  })

  it('sin sesión, una ruta protegida redirige a login con redirect', async () => {
    conSesion(false)
    const destino = await guardiaAutenticacion(
      ruta({ name: 'producer-create', fullPath: '/admin/productores/nuevo', requiresAuth: true })
    )
    expect(destino).toEqual({ name: 'login', query: { redirect: '/admin/productores/nuevo' } })
  })

  it('una ruta hija hereda requiresAuth del padre (meta en matched[0])', async () => {
    conSesion(false)
    const to = {
      name: 'producer-edit',
      fullPath: '/admin/productores/1/editar',
      meta: {},
      matched: [{ meta: { requiresAuth: true } }, { meta: { title: 'Editar' } }],
    }
    const destino = await guardiaAutenticacion(to)
    expect(destino).toMatchObject({ name: 'login' })
  })

  it('con sesión, una ruta protegida se permite', async () => {
    conSesion(true)
    const destino = await guardiaAutenticacion(
      ruta({ name: 'admin-dashboard', fullPath: '/admin', requiresAuth: true })
    )
    expect(destino).toBe(true)
  })

  it('con sesión, /login redirige al panel', async () => {
    conSesion(true)
    const destino = await guardiaAutenticacion(ruta({ name: 'login', fullPath: '/login' }))
    expect(destino).toEqual({ name: 'admin-dashboard' })
  })

  it('con sesión, /restablecer-contrasena NO redirige', async () => {
    conSesion(true)
    const destino = await guardiaAutenticacion(
      ruta({ name: 'reset-password', fullPath: '/restablecer-contrasena' })
    )
    expect(destino).toBe(true)
  })

  it('sin sesión, una ruta pública se permite', async () => {
    conSesion(false)
    const destino = await guardiaAutenticacion(ruta({ name: 'home', fullPath: '/' }))
    expect(destino).toBe(true)
  })

  it('actualiza document.title con meta.title', async () => {
    conSesion(false)
    await guardiaAutenticacion(ruta({ name: 'home', fullPath: '/', title: 'Inicio' }))
    expect(document.title).toBe('Inicio')
  })
})
```

- [ ] **Step 2: Ejecutar y verificar que fallan**

Run: `npm test -- tests/router/guard.test.js`
Expected: FAIL por import no resuelto.

- [ ] **Step 3: Crear `src/router/guard.js`**

```js
/**
 * Guardia de navegación global.
 *
 * Separado del router para poder probarlo sin instanciar Vue Router
 * ni cargar las vistas.
 */
import { supabase } from '@/lib/supabase'

/**
 * @param {import('vue-router').RouteLocationNormalized} to
 * @returns {Promise<true | import('vue-router').RouteLocationRaw>}
 */
export async function guardiaAutenticacion(to) {
  // Título de la pestaña: usa el meta.title más específico (el último de matched)
  const titulo = [...to.matched].reverse().find((r) => r.meta?.title)?.meta.title ?? to.meta?.title
  if (titulo) document.title = titulo

  const { data: { session } } = await supabase.auth.getSession()
  const autenticado = !!session

  // requiresAuth puede estar en la ruta o en cualquiera de sus padres
  const requiereAuth = to.matched.some((r) => r.meta?.requiresAuth)

  if (requiereAuth && !autenticado) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.name === 'login' && autenticado) {
    return { name: 'admin-dashboard' }
  }

  return true
}
```

- [ ] **Step 4: Ejecutar y verificar que pasan**

Run: `npm test -- tests/router/guard.test.js`
Expected: PASS, 7 pruebas.

- [ ] **Step 5: Crear `src/layouts/AdminLayout.vue`**

```vue
<!--
  AdminLayout.vue - Estructura común del panel de administración.

  Barra lateral fija + área de contenido donde se renderiza la vista
  hija activa (dashboard, crear, editar). Es la ruta padre de /admin.
-->
<script setup>
import AdminSidebar from '@/components/admin/AdminSidebar.vue'
</script>

<template>
  <div class="admin-layout">
    <AdminSidebar />

    <div class="admin-content">
      <RouterView />
    </div>
  </div>
</template>

<style scoped>
.admin-layout {
  display: flex;
  min-height: calc(100vh - var(--header-height));
}

.admin-content {
  flex: 1;
  min-width: 0;
  padding: var(--spacing-8);
}

@media (max-width: 768px) {
  .admin-layout {
    flex-direction: column;
  }

  .admin-content {
    padding: var(--spacing-4);
  }
}
</style>
```

- [ ] **Step 6: Crear un `ResetPasswordView.vue` mínimo (placeholder de compilación)**

Task 12 lo reescribe. Para que el router compile ahora, crear `src/views/ResetPasswordView.vue`:

```vue
<!--
  ResetPasswordView.vue - Cambio de contraseña desde el enlace del correo.
  (Se completa en la tarea de recuperación de contraseña.)
-->
<script setup>
</script>

<template>
  <div class="reset-view">
    <p>Restablecer contraseña</p>
  </div>
</template>
```

- [ ] **Step 7: Reescribir `src/router/index.js`**

```js
/**
 * Configuración del enrutador de la aplicación.
 *
 * Rutas públicas, de autenticación y de administración. Las rutas admin
 * cuelgan de AdminLayout y heredan `requiresAuth` del padre.
 */
import { createRouter, createWebHistory } from 'vue-router'
import { guardiaAutenticacion } from './guard'

// Carga diferida de vistas para optimizar la carga inicial
const HomeView = () => import('@/views/HomeView.vue')
const ProducerDetailView = () => import('@/views/ProducerDetailView.vue')
const LoginView = () => import('@/views/LoginView.vue')
const ResetPasswordView = () => import('@/views/ResetPasswordView.vue')
const AdminLayout = () => import('@/layouts/AdminLayout.vue')
const AdminDashboardView = () => import('@/views/admin/AdminDashboardView.vue')
const ProducerCreateView = () => import('@/views/admin/ProducerCreateView.vue')
const ProducerEditView = () => import('@/views/admin/ProducerEditView.vue')

const routes = [
  // --- Rutas públicas ---
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: { title: 'Inicio - Directorio MIPYMES Guanacaste' },
  },
  {
    path: '/productor/:id',
    name: 'producer-detail',
    component: ProducerDetailView,
    props: true,
    meta: { title: 'Detalle del Productor' },
  },

  // --- Autenticación ---
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { title: 'Iniciar Sesión - Admin' },
  },
  {
    path: '/restablecer-contrasena',
    name: 'reset-password',
    component: ResetPasswordView,
    meta: { title: 'Restablecer Contraseña' },
  },

  // --- Administración (requiere sesión; el meta del padre protege a los hijos) ---
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAuth: true, fullWidth: true },
    children: [
      {
        path: '',
        name: 'admin-dashboard',
        component: AdminDashboardView,
        meta: { title: 'Panel de Administración' },
      },
      {
        path: 'productores/nuevo',
        name: 'producer-create',
        component: ProducerCreateView,
        meta: { title: 'Nuevo Productor' },
      },
      {
        path: 'productores/:id/editar',
        name: 'producer-edit',
        component: ProducerEditView,
        props: true,
        meta: { title: 'Editar Productor' },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    return savedPosition ?? { top: 0 }
  },
})

router.beforeEach(guardiaAutenticacion)

export default router
```

- [ ] **Step 8: `App.vue` — ancho completo para el panel admin**

Reemplazar `<script setup>`, `<template>` y `<style scoped>` completos:

```vue
<!--
  Componente raíz de la aplicación.
  Estructura: encabezado, contenido dinámico (RouterView), pie de página y toasts.
-->
<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/common/AppHeader.vue'
import AppFooter from '@/components/common/AppFooter.vue'
import AppToast from '@/components/common/AppToast.vue'

const route = useRoute()

// Las rutas admin ocupan todo el ancho (sin el contenedor centrado)
const anchoCompleto = computed(() => route.matched.some((r) => r.meta?.fullWidth))
</script>

<template>
  <div class="app-layout">
    <!-- Encabezado global de navegación -->
    <AppHeader />

    <!-- Contenido principal: cambia según la ruta activa -->
    <main :class="['main-content', { 'main-content--full': anchoCompleto }]">
      <RouterView />
    </main>

    <!-- Pie de página con créditos -->
    <AppFooter />

    <!-- Notificaciones globales -->
    <AppToast />
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 1.5rem;
}

.main-content--full {
  max-width: none;
  padding: 0;
}
</style>
```

- [ ] **Step 9: `AdminDashboardView.vue` — quitar el layout duplicado**

Reemplazar el `<template>` completo por:

```vue
<template>
  <div class="dashboard-view">
    <header class="admin-header">
      <h1 class="admin-title">Panel de Administración</h1>
      <RouterLink to="/admin/productores/nuevo" class="btn-create">
        ➕ Nuevo Productor
      </RouterLink>
    </header>

    <!-- Indicador de carga -->
    <LoadingSpinner v-if="loading" message="Cargando productores..." />

    <!-- Error -->
    <div v-else-if="error" class="error-message">
      <p>⚠️ {{ error }}</p>
    </div>

    <!-- Tabla de productores -->
    <ProducerTable
      v-else
      :productores="productores"
      @edit="handleEdit"
      @delete="handleDelete"
    />
  </div>
</template>
```

En `<script setup>`, eliminar la línea `import AdminSidebar from '@/components/admin/AdminSidebar.vue'`.

En `<style scoped>`, eliminar los bloques `.admin-layout { ... }` y `.admin-content { ... }` (las 10 primeras líneas de estilos). El resto queda igual.

- [ ] **Step 10: `ProducerCreateView.vue` — quitar el layout duplicado**

Reemplazar el `<template>` completo por:

```vue
<template>
  <div class="create-view">
    <header class="admin-header">
      <h1 class="admin-title">Nuevo Productor</h1>
    </header>

    <ProducerForm
      :cantones="cantones"
      :categorias="categorias"
      :loading="loading"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />
  </div>
</template>
```

Eliminar `import AdminSidebar ...` del script. Reemplazar `<style scoped>` completo por:

```vue
<style scoped>
.create-view {
  max-width: 800px;
}

.admin-header {
  margin-bottom: 2rem;
}

.admin-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
}
</style>
```

- [ ] **Step 11: `ProducerEditView.vue` — quitar el layout duplicado**

Reemplazar el `<template>` completo por:

```vue
<template>
  <div class="edit-view">
    <header class="admin-header">
      <h1 class="admin-title">Editar Productor</h1>
    </header>

    <!-- Cargando datos -->
    <LoadingSpinner v-if="loading && !producerData" message="Cargando datos del productor..." />

    <!-- Error -->
    <div v-else-if="error" class="error-message">
      <p>⚠️ {{ error }}</p>
    </div>

    <!-- Formulario con datos precargados -->
    <ProducerForm
      v-else-if="producerData"
      :initial-data="producerData"
      :cantones="cantones"
      :categorias="categorias"
      :loading="loading"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />
  </div>
</template>
```

Eliminar `import AdminSidebar ...` del script. Reemplazar `<style scoped>` completo por:

```vue
<style scoped>
.edit-view {
  max-width: 800px;
}

.admin-header {
  margin-bottom: 2rem;
}

.admin-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
}

.error-message {
  color: var(--color-error);
  font-weight: 500;
}
</style>
```

- [ ] **Step 12: Verificar que `AdminSidebar` ya no se importa en vistas**

Run: `grep -rn "AdminSidebar" src --include=*.vue`
Expected: solo `src/layouts/AdminLayout.vue` y el propio `src/components/admin/AdminSidebar.vue`.

- [ ] **Step 13: Tests, build, prueba manual**

Run: `npm test`
Expected: PASS, todos los archivos.

Run: `npm run build`
Expected: `✓ built`, 0 errores.

Run: `npm run dev` y abrir `http://localhost:5173/admin` sin sesión → redirige a `/login?redirect=/admin`. Iniciar sesión → panel con sidebar a la izquierda ocupando el ancho completo, sin doble margen. Navegar a "Nuevo Productor" → el sidebar permanece.

- [ ] **Step 14: Commit**

```bash
git add src/router/guard.js src/router/index.js tests/router/guard.test.js src/layouts/AdminLayout.vue src/views/ResetPasswordView.vue src/App.vue src/views/admin/AdminDashboardView.vue src/views/admin/ProducerCreateView.vue src/views/admin/ProducerEditView.vue
git commit -m "refactor(router): guard testeable, AdminLayout con rutas anidadas, sin layout duplicado

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 10: Subida diferida de imagen, formulario con teléfono validado, toasts en crear/editar

**Files:**
- Modify: `src/components/admin/ImageUploader.vue` (`<script setup>` y `<template>`; el `<style scoped>` se mantiene)
- Modify: `src/components/admin/ProducerForm.vue` (`<script setup>` y dos fragmentos del template)
- Modify: `src/views/admin/ProducerCreateView.vue` (`<script setup>`)
- Modify: `src/views/admin/ProducerEditView.vue` (`<script setup>`)

**Interfaces:**
- Consumes: `useProductores.createProductor/updateProductor` con `fotoFile` (Task 8), `useToast` (Task 4), `esTelefonoValido` (Task 1).
- Produces: `ImageUploader` props `{ currentImagePath: string }`, emits `archivo-seleccionado(File)` y `quitar()`. `ProducerForm` emite `submit` con `{ ...campos, categoria_ids, foto_url, fotoFile }`.

- [ ] **Step 1: Reescribir `<script setup>` y `<template>` de `ImageUploader.vue`**

Dejar el `<style scoped>` existente intacto. Reemplazar todo lo anterior a `<style scoped>` por:

```vue
<!--
  ImageUploader.vue - Selector de imagen con compresión en el navegador.

  NO sube nada a Supabase: comprime, muestra una vista previa y emite el
  archivo listo. La subida ocurre cuando el formulario se guarda, así
  cancelar no deja archivos huérfanos en Storage.

  Props:
  - currentImagePath (String): ruta de la imagen actual (modo edición)

  Emits:
  - archivo-seleccionado (File): imagen comprimida lista para subir
  - quitar: el usuario quitó la imagen actual
-->
<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'
import { getPublicImageUrl } from '@/lib/supabase'

const props = defineProps({
  currentImagePath: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['archivo-seleccionado', 'quitar'])

const previewUrl = ref('')
const loading = ref(false)
const dragActive = ref(false)
const errorMessage = ref('')

// URL temporal creada con createObjectURL, para liberarla al reemplazar/desmontar
let urlTemporal = ''

const TIPOS_VALIDOS = ['image/jpeg', 'image/png', 'image/webp']
const TAMANO_MAXIMO_BYTES = 15 * 1024 * 1024   // 15 MB antes de comprimir
const UMBRAL_COMPRESION_BYTES = 200 * 1024     // solo se comprime si supera 200 KB
const LADO_MAXIMO_PX = 1000
const CALIDAD_WEBP = 0.8

function liberarUrlTemporal() {
  if (urlTemporal) {
    URL.revokeObjectURL(urlTemporal)
    urlTemporal = ''
  }
}

// Mostrar la imagen actual en modo edición
watch(
  () => props.currentImagePath,
  (ruta) => {
    liberarUrlTemporal()
    previewUrl.value = ruta ? getPublicImageUrl(ruta) : ''
  },
  { immediate: true }
)

onBeforeUnmount(liberarUrlTemporal)

// --- Arrastrar y soltar ---
function handleDragEnter() {
  dragActive.value = true
}

function handleDragLeave() {
  dragActive.value = false
}

function handleDragOver(e) {
  e.preventDefault()
  dragActive.value = true
}

function handleDrop(e) {
  e.preventDefault()
  dragActive.value = false
  const archivo = e.dataTransfer?.files?.[0]
  if (archivo) procesarArchivo(archivo)
}

function handleFileChange(e) {
  const archivo = e.target.files?.[0]
  if (archivo) procesarArchivo(archivo)
  // Permitir volver a elegir el mismo archivo
  e.target.value = ''
}

/**
 * Redimensiona (máx. 1000×1000) y comprime a WebP usando Canvas.
 * Si el navegador no soporta WebP en toBlob, devuelve PNG.
 *
 * @param {File} file
 * @returns {Promise<File>}
 */
function comprimirImagen(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const urlOrigen = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(urlOrigen)

      let { width, height } = img
      const escala = Math.min(1, LADO_MAXIMO_PX / Math.max(width, height))
      width = Math.round(width * escala)
      height = Math.round(height * escala)

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('No se pudo generar la imagen comprimida'))
            return
          }
          const extension = blob.type === 'image/webp' ? 'webp' : 'png'
          const base = file.name.replace(/\.[^.]+$/, '')
          resolve(new File([blob], `${base}.${extension}`, { type: blob.type, lastModified: Date.now() }))
        },
        'image/webp',
        CALIDAD_WEBP
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(urlOrigen)
      reject(new Error('No se pudo leer la imagen'))
    }

    img.src = urlOrigen
  })
}

/** Valida, comprime, muestra la vista previa y emite el archivo listo. */
async function procesarArchivo(file) {
  errorMessage.value = ''

  if (!TIPOS_VALIDOS.includes(file.type)) {
    errorMessage.value = 'Formato inválido. Use JPEG, PNG o WebP.'
    return
  }

  if (file.size > TAMANO_MAXIMO_BYTES) {
    errorMessage.value = 'El archivo es demasiado grande (máximo 15 MB).'
    return
  }

  loading.value = true

  try {
    let archivoListo = file
    if (file.size > UMBRAL_COMPRESION_BYTES) {
      try {
        archivoListo = await comprimirImagen(file)
      } catch (err) {
        console.warn('[ImageUploader] No se pudo comprimir; se usará el original.', err)
      }
    }

    liberarUrlTemporal()
    urlTemporal = URL.createObjectURL(archivoListo)
    previewUrl.value = urlTemporal

    emit('archivo-seleccionado', archivoListo)
  } catch (err) {
    errorMessage.value = 'No se pudo procesar la imagen.'
    console.error('[ImageUploader]', err)
  } finally {
    loading.value = false
  }
}

function quitarImagen() {
  liberarUrlTemporal()
  previewUrl.value = ''
  errorMessage.value = ''
  emit('quitar')
}
</script>

<template>
  <div class="image-uploader-container">
    <label class="uploader-label">Imagen del Negocio</label>

    <div
      class="dropzone"
      :class="{ 'drag-active': dragActive, 'has-preview': previewUrl, 'loading': loading }"
      @dragenter.prevent="handleDragEnter"
      @dragleave.prevent="handleDragLeave"
      @dragover.prevent="handleDragOver"
      @drop.prevent="handleDrop"
    >
      <!-- Vista previa -->
      <div v-if="previewUrl" class="preview-container">
        <img :src="previewUrl" alt="Vista previa del productor" class="preview-img" />
        <div class="preview-overlay">
          <button type="button" class="btn btn-danger btn-sm" :disabled="loading" @click="quitarImagen">
            Quitar imagen
          </button>
        </div>
      </div>

      <!-- Procesando -->
      <div v-else-if="loading" class="uploader-status">
        <div class="spinner"></div>
        <p>Optimizando imagen...</p>
      </div>

      <!-- Zona vacía -->
      <div v-else class="uploader-placeholder">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="upload-icon">
          <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
        <p class="upload-text">Arrastra una imagen aquí o <span class="highlight">selecciona un archivo</span></p>
        <p class="upload-hint">JPG, PNG o WebP. Se optimiza automáticamente y se sube al guardar.</p>
        <input
          type="file"
          class="file-input"
          accept="image/jpeg, image/png, image/webp"
          :disabled="loading"
          @change="handleFileChange"
        />
      </div>
    </div>

    <!-- Error -->
    <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
  </div>
</template>
```

- [ ] **Step 2: `ProducerForm.vue` — script**

Reemplazar el `<script setup>` completo por:

```vue
<script setup>
import { reactive, watch } from 'vue'
import { esTelefonoValido } from '@/utils/telefono'
import ImageUploader from './ImageUploader.vue'

const props = defineProps({
  /** Datos iniciales del productor (modo edición) */
  initialData: {
    type: Object,
    default: null,
  },
  /** Cantones para el selector */
  cantones: {
    type: Array,
    default: () => [],
  },
  /** Categorías para los checkboxes */
  categorias: {
    type: Array,
    default: () => [],
  },
  /** Estado de carga del envío */
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['submit', 'cancel'])

// Estado del formulario
const form = reactive({
  nombre_negocio: '',
  nombre_contacto: '',
  telefono: '',
  email: '',
  descripcion: '',
  canton_id: '',
  direccion_detalle: '',
  foto_url: '',
  activo: true,
  categoria_ids: [],
  fotoFile: null,   // imagen nueva pendiente de subir (se sube al guardar)
})

// Mensajes de validación
const errors = reactive({
  nombre_negocio: '',
  nombre_contacto: '',
  telefono: '',
  canton_id: '',
  categorias: '',
})

// Precargar datos en modo edición
watch(
  () => props.initialData,
  (datos) => {
    if (!datos) return
    form.nombre_negocio = datos.nombre_negocio || ''
    form.nombre_contacto = datos.nombre_contacto || ''
    form.telefono = datos.telefono || ''
    form.email = datos.email || ''
    form.descripcion = datos.descripcion || ''
    form.canton_id = datos.canton_id || ''
    form.direccion_detalle = datos.direccion_detalle || ''
    form.foto_url = datos.foto_url || ''
    form.activo = datos.activo !== undefined ? datos.activo : true
    form.categoria_ids = (datos.categorias ?? [])
      .map((c) => c.categoria?.id || c.categoria_id)
      .filter(Boolean)
    form.fotoFile = null
  },
  { immediate: true }
)

// --- Imagen ---
function handleArchivoSeleccionado(archivo) {
  form.fotoFile = archivo
}

function handleQuitarImagen() {
  form.fotoFile = null
  form.foto_url = ''
}

// --- Categorías ---
function toggleCategoria(id) {
  const indice = form.categoria_ids.indexOf(id)
  if (indice === -1) {
    form.categoria_ids.push(id)
  } else {
    form.categoria_ids.splice(indice, 1)
  }
}

// --- Validación ---
function validateForm() {
  let valido = true

  for (const clave of Object.keys(errors)) errors[clave] = ''

  if (!form.nombre_negocio.trim()) {
    errors.nombre_negocio = 'El nombre del negocio es obligatorio.'
    valido = false
  }

  if (!form.nombre_contacto.trim()) {
    errors.nombre_contacto = 'El nombre de contacto es obligatorio.'
    valido = false
  }

  if (!form.telefono.trim()) {
    errors.telefono = 'El teléfono es obligatorio.'
    valido = false
  } else if (!esTelefonoValido(form.telefono)) {
    errors.telefono = 'Ingrese un número de 8 dígitos (ej: 8888-4444).'
    valido = false
  }

  if (!form.canton_id) {
    errors.canton_id = 'Debe seleccionar un cantón.'
    valido = false
  }

  if (form.categoria_ids.length === 0) {
    errors.categorias = 'Debe seleccionar al menos una categoría de alimentos.'
    valido = false
  }

  return valido
}

function onSubmit() {
  if (!validateForm()) return
  emit('submit', { ...form, categoria_ids: [...form.categoria_ids] })
}
</script>
```

- [ ] **Step 3: `ProducerForm.vue` — template (dos fragmentos)**

Campo teléfono: reemplazar `placeholder="Ej: 8888 4444"` por `placeholder="Ej: 8888-4444"`.

Uso de `ImageUploader`: reemplazar

```vue
          <ImageUploader
            :current-image-path="form.foto_url"
            @uploaded="handleImageUploaded"
          />
```
por
```vue
          <ImageUploader
            :current-image-path="form.foto_url"
            @archivo-seleccionado="handleArchivoSeleccionado"
            @quitar="handleQuitarImagen"
          />
```

- [ ] **Step 4: `ProducerCreateView.vue` — script con toasts**

Reemplazar el `<script setup>` completo por:

```vue
<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProductores } from '@/composables/useProductores'
import { useCatalogos } from '@/composables/useCatalogos'
import { useToast } from '@/composables/useToast'
import ProducerForm from '@/components/admin/ProducerForm.vue'

const router = useRouter()
const { createProductor, loading, error } = useProductores()
const { cantones, categorias, fetchCantones, fetchCategorias } = useCatalogos()
const { mostrarExito, mostrarError } = useToast()

onMounted(async () => {
  await Promise.all([fetchCantones(), fetchCategorias()])
})

/** Guardar el nuevo productor (la foto se sube dentro de createProductor) */
async function handleSubmit(formData) {
  const creado = await createProductor(formData)
  if (creado) {
    mostrarExito(`Productor "${creado.nombre_negocio}" registrado.`)
    router.push({ name: 'admin-dashboard' })
  } else {
    mostrarError(error.value || 'No se pudo registrar el productor.')
  }
}

function handleCancel() {
  router.push({ name: 'admin-dashboard' })
}
</script>
```

- [ ] **Step 5: `ProducerEditView.vue` — script con toasts**

Reemplazar el `<script setup>` completo por:

```vue
<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProductores } from '@/composables/useProductores'
import { useCatalogos } from '@/composables/useCatalogos'
import { useToast } from '@/composables/useToast'
import ProducerForm from '@/components/admin/ProducerForm.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const route = useRoute()
const router = useRouter()
const { fetchProductorById, updateProductor, loading, error } = useProductores()
const { cantones, categorias, fetchCantones, fetchCategorias } = useCatalogos()
const { mostrarExito, mostrarError } = useToast()

// Datos actuales del productor para precargar el formulario
const producerData = ref(null)

onMounted(async () => {
  const [producer] = await Promise.all([
    fetchProductorById(route.params.id),
    fetchCantones(),
    fetchCategorias(),
  ])

  if (producer) {
    producerData.value = producer
  } else {
    mostrarError('No se encontró el productor.')
    router.push({ name: 'admin-dashboard' })
  }
})

/** Guardar cambios (sube foto nueva y borra la anterior dentro de updateProductor) */
async function handleSubmit(formData) {
  const actualizado = await updateProductor(route.params.id, formData)
  if (actualizado) {
    mostrarExito('Cambios guardados.')
    router.push({ name: 'admin-dashboard' })
  } else {
    mostrarError(error.value || 'No se pudieron guardar los cambios.')
  }
}

function handleCancel() {
  router.push({ name: 'admin-dashboard' })
}
</script>
```

- [ ] **Step 6: Tests, build, prueba manual**

Run: `npm test` → PASS.
Run: `npm run build` → `✓ built`, 0 errores.

Prueba manual con `npm run dev` (requiere migración 002 aplicada y el usuario en `admin_profiles`):
1. Panel → Nuevo Productor → llenar campos, teléfono `8888 4444`, elegir una foto > 200 KB → la vista previa aparece; en Supabase Storage **todavía no hay archivo nuevo**.
2. Cancelar → Storage sigue sin archivo nuevo.
3. Repetir y Guardar → toast verde, aparece en el panel, en Storage hay un `.webp` en `productores/`.
4. Editar → cambiar foto → Guardar → el `.webp` anterior desapareció del bucket.
5. Editar → Quitar imagen → Guardar → sin foto en la tabla y sin archivo en el bucket.
6. Teléfono `123` → mensaje "Ingrese un número de 8 dígitos".

- [ ] **Step 7: Commit**

```bash
git add src/components/admin/ImageUploader.vue src/components/admin/ProducerForm.vue src/views/admin/ProducerCreateView.vue src/views/admin/ProducerEditView.vue
git commit -m "feat(admin): subida de imagen diferida al guardar, WebP, teléfono validado y toasts

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 11: `useContactos`, `WhatsAppButton` con registro, teléfono formateado, placeholder de búsqueda

**Files:**
- Create: `src/composables/useContactos.js`
- Create: `tests/composables/useContactos.test.js`
- Modify: `src/components/producers/WhatsAppButton.vue` (`<script setup>` y una línea del template)
- Modify: `src/views/ProducerDetailView.vue` (`<script setup>` y dos fragmentos del template)
- Modify: `src/components/common/SearchBar.vue:38`

**Interfaces:**
- Consumes: RPC `registrar_contacto` y vista `resumen_contactos_whatsapp` (Task 7), `generarEnlaceWhatsApp` (Task 2), `formatearTelefono` (Task 1).
- Produces: `useContactos() → { registrarContacto(productorId) → Promise<void> (nunca lanza), fetchResumenContactos() → Promise<{ porProductor: Map<string, {total, ultimos_30_dias}>, total: number, ultimos30Dias: number }> (lanza si falla) }`. `WhatsAppButton` props: `telefono`, `nombreNegocio`, `productorId`.

- [ ] **Step 1: Pruebas de `useContactos` (fallan)**

Crear `tests/composables/useContactos.test.js`:

```js
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockRef = vi.hoisted(() => ({ actual: null }))

vi.mock('@/lib/supabase', async () => {
  const { crearSupabaseMock } = await import('../helpers/supabaseMock.js')
  mockRef.actual = crearSupabaseMock()
  return { supabase: mockRef.actual.supabase }
})

import { useContactos } from '@/composables/useContactos'

describe('useContactos', () => {
  beforeEach(() => {
    mockRef.actual.reiniciar()
  })

  describe('registrarContacto', () => {
    it('llama al RPC registrar_contacto con el id del productor', async () => {
      const { registrarContacto } = useContactos()
      await registrarContacto('prod-1')
      expect(mockRef.actual.supabase.rpc).toHaveBeenCalledWith('registrar_contacto', {
        p_productor_id: 'prod-1',
      })
    })

    it('no hace nada sin id', async () => {
      const { registrarContacto } = useContactos()
      await registrarContacto(null)
      await registrarContacto('')
      expect(mockRef.actual.supabase.rpc).not.toHaveBeenCalled()
    })

    it('nunca lanza aunque el RPC falle', async () => {
      mockRef.actual.supabase.rpc.mockRejectedValueOnce(new Error('sin red'))
      const { registrarContacto } = useContactos()
      await expect(registrarContacto('prod-1')).resolves.toBeUndefined()
    })

    it('nunca lanza aunque el RPC devuelva error', async () => {
      mockRef.actual.supabase.rpc.mockResolvedValueOnce({ data: null, error: { message: 'x' } })
      const { registrarContacto } = useContactos()
      await expect(registrarContacto('prod-1')).resolves.toBeUndefined()
    })
  })

  describe('fetchResumenContactos', () => {
    it('agrupa por productor y calcula totales', async () => {
      mockRef.actual.responder('resumen_contactos_whatsapp', {
        data: [
          { productor_id: 'a', total: 5, ultimos_30_dias: 2 },
          { productor_id: 'b', total: 3, ultimos_30_dias: 3 },
        ],
        error: null,
      })
      const { fetchResumenContactos } = useContactos()
      const resumen = await fetchResumenContactos()

      expect(resumen.total).toBe(8)
      expect(resumen.ultimos30Dias).toBe(5)
      expect(resumen.porProductor.get('a')).toEqual({ productor_id: 'a', total: 5, ultimos_30_dias: 2 })
      expect(resumen.porProductor.has('zzz')).toBe(false)
    })

    it('devuelve ceros si no hay filas', async () => {
      mockRef.actual.responder('resumen_contactos_whatsapp', { data: [], error: null })
      const { fetchResumenContactos } = useContactos()
      const resumen = await fetchResumenContactos()
      expect(resumen.total).toBe(0)
      expect(resumen.ultimos30Dias).toBe(0)
      expect(resumen.porProductor.size).toBe(0)
    })

    it('lanza si Supabase devuelve error', async () => {
      mockRef.actual.responder('resumen_contactos_whatsapp', { data: null, error: { message: 'denegado' } })
      const { fetchResumenContactos } = useContactos()
      await expect(fetchResumenContactos()).rejects.toMatchObject({ message: 'denegado' })
    })
  })
})
```

- [ ] **Step 2: Ejecutar y verificar que fallan**

Run: `npm test -- tests/composables/useContactos.test.js`
Expected: FAIL por import no resuelto.

- [ ] **Step 3: Implementar `src/composables/useContactos.js`**

```js
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
```

- [ ] **Step 4: Ejecutar y verificar que pasan**

Run: `npm test -- tests/composables/useContactos.test.js`
Expected: PASS, 7 pruebas.

- [ ] **Step 5: Reescribir `<script setup>` de `WhatsAppButton.vue`**

Reemplazar el comentario de cabecera y el `<script setup>` por:

```vue
<!--
  WhatsAppButton.vue - Botón de contacto por WhatsApp.

  Abre wa.me con un mensaje predefinido y registra el clic como métrica
  (sin bloquear la apertura del enlace).

  Props:
  - telefono (String): teléfono en cualquier formato aceptado por normalizarTelefono
  - nombreNegocio (String): nombre del negocio para el mensaje
  - productorId (String): id del productor, para la métrica de contactos
-->
<script setup>
import { computed } from 'vue'
import { generarEnlaceWhatsApp } from '@/utils/whatsapp'
import { useContactos } from '@/composables/useContactos'

const props = defineProps({
  telefono: {
    type: String,
    required: true,
  },
  nombreNegocio: {
    type: String,
    required: true,
  },
  productorId: {
    type: String,
    default: '',
  },
})

const { registrarContacto } = useContactos()

const whatsappUrl = computed(() => generarEnlaceWhatsApp(props.telefono, props.nombreNegocio))

/** El enlace abre en otra pestaña, así que esta llamada termina aunque no se espere. */
function handleClick() {
  registrarContacto(props.productorId)
}
</script>
```

En el `<template>`, la etiqueta `<a>` queda:

```vue
  <a
    v-if="whatsappUrl"
    :href="whatsappUrl"
    target="_blank"
    rel="noopener noreferrer"
    class="whatsapp-button"
    :aria-label="`Contactar a ${nombreNegocio} por WhatsApp`"
    @click="handleClick"
  >
```

(El SVG y el texto interior no cambian.)

- [ ] **Step 6: `ProducerDetailView.vue` — teléfono formateado y props nuevas**

En `<script setup>`, agregar el import:
```js
import { formatearTelefono } from '@/utils/telefono'
```

En el template, reemplazar
```vue
            <p v-if="producer.telefono" class="contact-phone">
              📞 {{ producer.telefono }}
            </p>
```
por
```vue
            <p v-if="producer.telefono" class="contact-phone">
              📞 {{ formatearTelefono(producer.telefono) }}
            </p>
```

y reemplazar
```vue
          <WhatsAppButton
            v-if="producer.telefono"
            :phone="producer.telefono"
            :producer-name="producer.nombre_negocio"
          />
```
por
```vue
          <WhatsAppButton
            v-if="producer.telefono"
            :telefono="producer.telefono"
            :nombre-negocio="producer.nombre_negocio"
            :productor-id="producer.id"
          />
```

- [ ] **Step 7: `SearchBar.vue` — placeholder honesto**

Línea 38: reemplazar `placeholder="Buscar productor por nombre..."` por `placeholder="Buscar por nombre o descripción..."`.

- [ ] **Step 8: Tests, build, prueba manual**

Run: `npm test` → PASS.
Run: `npm run build` → `✓ built`.

Manual: abrir el detalle de un productor activo → el teléfono se ve como `8888-4444` → clic en "Contactar por WhatsApp" → se abre `wa.me/506...` en otra pestaña. En el SQL Editor: `SELECT count(*) FROM contactos_whatsapp;` → subió en 1. Buscar en el inicio una palabra que solo esté en la descripción de un productor → aparece.

- [ ] **Step 9: Commit**

```bash
git add src/composables/useContactos.js tests/composables/useContactos.test.js src/components/producers/WhatsAppButton.vue src/views/ProducerDetailView.vue src/components/common/SearchBar.vue
git commit -m "feat: métrica de contactos por WhatsApp y teléfono formateado en el detalle

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 12: Recuperación de contraseña

**Files:**
- Modify: `src/views/LoginView.vue` (`<script setup>`, `<template>`; se agregan estilos al final del `<style scoped>`)
- Modify: `src/views/ResetPasswordView.vue` (reescritura completa del placeholder de Task 9)

**Interfaces:**
- Consumes: `useAuth.resetPassword`, `useAuth.updatePassword`, `authReady`, `isAuthenticated` (Task 5); `useToast` (Task 4); ruta `reset-password` (Task 9).

- [ ] **Step 1: `LoginView.vue` — script**

Reemplazar el `<script setup>` completo por:

```vue
<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const route = useRoute()
const { login, resetPassword, loading, error } = useAuth()

// Campos del formulario
const email = ref('')
const password = ref('')

// Modo "olvidé mi contraseña"
const modoRecuperacion = ref(false)
const recuperacionEnviada = ref(false)

/** Iniciar sesión y volver a la ruta original (o al panel) */
async function handleLogin() {
  try {
    await login(email.value, password.value)
    router.push(route.query.redirect || '/admin')
  } catch (err) {
    // El mensaje ya quedó en `error`
    console.error('[LoginView] Error en login:', err)
  }
}

/**
 * Enviar el correo de recuperación. Siempre muestra el mismo mensaje,
 * exista o no la cuenta, para no revelar qué correos están registrados.
 */
async function handleRecuperar() {
  try {
    await resetPassword(email.value)
  } catch (err) {
    console.error('[LoginView] Error al solicitar recuperación:', err)
  } finally {
    recuperacionEnviada.value = true
  }
}

function abrirRecuperacion() {
  modoRecuperacion.value = true
  recuperacionEnviada.value = false
  error.value = null
}

function volverALogin() {
  modoRecuperacion.value = false
  recuperacionEnviada.value = false
  error.value = null
}
</script>
```

- [ ] **Step 2: `LoginView.vue` — template**

Reemplazar el `<template>` completo por:

```vue
<template>
  <div class="login-view">
    <div class="login-card">
      <!-- ===== Modo recuperación de contraseña ===== -->
      <template v-if="modoRecuperacion">
        <h1 class="login-title">Recuperar contraseña</h1>
        <p class="login-subtitle">Le enviaremos un enlace para crear una contraseña nueva</p>

        <div v-if="recuperacionEnviada" class="login-info" role="status">
          ✉️ Si el correo está registrado, recibirá un enlace en unos minutos.
          Revise también la carpeta de spam.
        </div>

        <form v-else class="login-form" @submit.prevent="handleRecuperar">
          <div class="form-group">
            <label for="email-recuperacion" class="form-label">Correo electrónico</label>
            <input
              id="email-recuperacion"
              v-model="email"
              type="email"
              class="form-input"
              placeholder="admin@ejemplo.com"
              required
              autocomplete="email"
            />
          </div>

          <button type="submit" class="login-button" :disabled="loading">
            {{ loading ? 'Enviando...' : 'Enviar enlace de recuperación' }}
          </button>
        </form>

        <button type="button" class="login-link-button" @click="volverALogin">
          ← Volver a iniciar sesión
        </button>
      </template>

      <!-- ===== Modo login ===== -->
      <template v-else>
        <h1 class="login-title">Iniciar Sesión</h1>
        <p class="login-subtitle">Panel de administración del directorio</p>

        <!-- Mensaje de error -->
        <div v-if="error" class="login-error" role="alert">
          ⚠️ {{ error }}
        </div>

        <form class="login-form" @submit.prevent="handleLogin">
          <div class="form-group">
            <label for="email" class="form-label">Correo electrónico</label>
            <input
              id="email"
              v-model="email"
              type="email"
              class="form-input"
              placeholder="admin@ejemplo.com"
              required
              autocomplete="email"
            />
          </div>

          <div class="form-group">
            <label for="password" class="form-label">Contraseña</label>
            <input
              id="password"
              v-model="password"
              type="password"
              class="form-input"
              placeholder="••••••••"
              required
              autocomplete="current-password"
            />
          </div>

          <button type="submit" class="login-button" :disabled="loading">
            {{ loading ? 'Ingresando...' : 'Ingresar' }}
          </button>
        </form>

        <button type="button" class="login-link-button" @click="abrirRecuperacion">
          ¿Olvidó su contraseña?
        </button>

        <RouterLink to="/" class="login-back-link">
          ← Volver al directorio
        </RouterLink>
      </template>
    </div>
  </div>
</template>
```

- [ ] **Step 3: `LoginView.vue` — estilos nuevos**

Al final del `<style scoped>` existente (antes de `</style>`), agregar:

```css
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
  color: var(--color-primary);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  text-align: center;
}

.login-link-button:hover {
  text-decoration: underline;
}
```

- [ ] **Step 4: Reescribir `src/views/ResetPasswordView.vue`**

```vue
<!--
  ResetPasswordView.vue - Cambio de contraseña desde el enlace del correo.

  El enlace de recuperación de Supabase trae al usuario aquí con una sesión
  temporal. Si hay sesión, se pide la nueva contraseña; si no, el enlace
  es inválido o expiró.

  Ruta: /restablecer-contrasena
-->
<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth, authReady } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const { isAuthenticated, updatePassword, loading, error } = useAuth()
const { mostrarExito } = useToast()

const verificando = ref(true)
const nuevaContrasena = ref('')
const confirmacion = ref('')
const errorLocal = ref('')

const LONGITUD_MINIMA = 8

onMounted(async () => {
  await authReady
  verificando.value = false
})

async function handleSubmit() {
  errorLocal.value = ''

  if (nuevaContrasena.value.length < LONGITUD_MINIMA) {
    errorLocal.value = `La contraseña debe tener al menos ${LONGITUD_MINIMA} caracteres.`
    return
  }

  if (nuevaContrasena.value !== confirmacion.value) {
    errorLocal.value = 'Las contraseñas no coinciden.'
    return
  }

  try {
    await updatePassword(nuevaContrasena.value)
    mostrarExito('Contraseña actualizada correctamente.')
    router.push({ name: 'admin-dashboard' })
  } catch (err) {
    // El mensaje traducido ya está en `error`
    console.error('[ResetPasswordView]', err)
  }
}
</script>

<template>
  <div class="reset-view">
    <div class="reset-card">
      <!-- Esperando a saber si hay sesión -->
      <p v-if="verificando" class="reset-subtitle">Verificando el enlace...</p>

      <!-- Enlace válido: formulario -->
      <template v-else-if="isAuthenticated">
        <h1 class="reset-title">Nueva contraseña</h1>
        <p class="reset-subtitle">Escriba y confirme su nueva contraseña</p>

        <div v-if="errorLocal || error" class="reset-error" role="alert">
          ⚠️ {{ errorLocal || error }}
        </div>

        <form class="reset-form" @submit.prevent="handleSubmit">
          <div class="form-group">
            <label for="nueva" class="form-label">Nueva contraseña</label>
            <input
              id="nueva"
              v-model="nuevaContrasena"
              type="password"
              class="form-input"
              :minlength="LONGITUD_MINIMA"
              required
              autocomplete="new-password"
            />
          </div>

          <div class="form-group">
            <label for="confirmacion" class="form-label">Confirmar contraseña</label>
            <input
              id="confirmacion"
              v-model="confirmacion"
              type="password"
              class="form-input"
              :minlength="LONGITUD_MINIMA"
              required
              autocomplete="new-password"
            />
          </div>

          <button type="submit" class="reset-button" :disabled="loading">
            {{ loading ? 'Guardando...' : 'Guardar contraseña' }}
          </button>
        </form>
      </template>

      <!-- Sin sesión: enlace inválido o expirado -->
      <template v-else>
        <h1 class="reset-title">Enlace inválido o expirado</h1>
        <p class="reset-subtitle">
          Solicite uno nuevo desde la pantalla de inicio de sesión con la opción "¿Olvidó su contraseña?".
        </p>
        <RouterLink :to="{ name: 'login' }" class="reset-button reset-button--link">
          Ir a iniciar sesión
        </RouterLink>
      </template>
    </div>
  </div>
</template>

<style scoped>
.reset-view {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: var(--spacing-12) var(--spacing-4);
}

.reset-card {
  width: 100%;
  max-width: 420px;
  background: var(--bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: var(--spacing-8);
}

.reset-title {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 var(--spacing-2);
}

.reset-subtitle {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  margin: 0 0 var(--spacing-6);
  line-height: 1.5;
}

.reset-error {
  background-color: #fef2f2;
  color: var(--color-error);
  border: 1px solid #fecaca;
  border-radius: var(--radius-md);
  padding: var(--spacing-3) var(--spacing-4);
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-4);
}

.reset-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.form-label {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-text);
}

.form-input {
  padding: 0.65rem var(--spacing-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  font-family: inherit;
}

.form-input:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 1px;
  border-color: var(--color-primary);
}

.reset-button {
  display: block;
  width: 100%;
  padding: 0.75rem;
  background-color: var(--color-primary);
  color: var(--color-white);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  font-weight: 600;
  cursor: pointer;
  text-align: center;
  text-decoration: none;
  transition: background-color var(--transition-fast);
}

.reset-button:hover:not(:disabled) {
  background-color: var(--color-primary-dark);
}

.reset-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.reset-button--link {
  margin-top: var(--spacing-2);
}
</style>
```

- [ ] **Step 5: Build y prueba manual de punta a punta**

Run: `npm test` → PASS.
Run: `npm run build` → `✓ built`.

Requisito previo en Supabase → Authentication → URL Configuration → Redirect URLs debe incluir `http://localhost:5173/restablecer-contrasena`.

Manual con `npm run dev`:
1. `/login` → "¿Olvidó su contraseña?" → correo del admin → "Enviar enlace" → mensaje verde.
2. Abrir el correo → clic en el enlace → llega a `/restablecer-contrasena` con el formulario.
3. Contraseña `123` → "al menos 8 caracteres". Dos distintas → "no coinciden".
4. Contraseña válida → toast "Contraseña actualizada" → panel admin.
5. Cerrar sesión → iniciar con la nueva contraseña → funciona.
6. Abrir `/restablecer-contrasena` directo sin enlace → "Enlace inválido o expirado".

- [ ] **Step 6: Commit**

```bash
git add src/views/LoginView.vue src/views/ResetPasswordView.vue
git commit -m "feat(auth): recuperación de contraseña por correo

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 13: KPIs de contactos en el panel y columna en la tabla

**Files:**
- Modify: `src/views/admin/AdminDashboardView.vue` (`<script setup>`, `<template>`, estilos añadidos)
- Modify: `src/components/admin/ProducerTable.vue` (`<script setup>`: prop nueva; `<template>`: columna nueva)

**Interfaces:**
- Consumes: `useContactos.fetchResumenContactos` (Task 11), `useToast` (Task 4).
- Produces: `ProducerTable` prop `contactosPorProductor: Map<string, {total, ultimos_30_dias}>` (default `new Map()`).

- [ ] **Step 1: `AdminDashboardView.vue` — script**

Reemplazar el `<script setup>` completo por:

```vue
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProductores } from '@/composables/useProductores'
import { useContactos } from '@/composables/useContactos'
import { useToast } from '@/composables/useToast'
import ProducerTable from '@/components/admin/ProducerTable.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const router = useRouter()
const { productores, loading, error, fetchProductores, deleteProductor } = useProductores()
const { fetchResumenContactos } = useContactos()
const { mostrarExito, mostrarError } = useToast()

// Resumen de contactos por WhatsApp (no bloquea la carga de la tabla si falla)
const contactos = ref({ porProductor: new Map(), total: 0, ultimos30Dias: 0 })

async function cargarContactos() {
  try {
    contactos.value = await fetchResumenContactos()
  } catch (err) {
    console.warn('[AdminDashboard] No se pudo cargar el resumen de contactos:', err?.message)
  }
}

onMounted(() => {
  fetchProductores({ onlyActive: false })
  cargarContactos()
})

// --- KPIs ---
const totalProductores = computed(() => productores.value.length)
const productoresVisibles = computed(() => productores.value.filter((p) => p.activo).length)

/** Ir a la página de edición */
function handleEdit(id) {
  router.push({ name: 'producer-edit', params: { id } })
}

/** Eliminar con confirmación */
async function handleDelete(id) {
  const confirmado = window.confirm(
    '¿Está seguro de que desea eliminar permanentemente a este productor? Esta acción no se puede deshacer.'
  )
  if (!confirmado) return

  const ok = await deleteProductor(id)
  if (ok) {
    mostrarExito('Productor eliminado.')
    await Promise.all([fetchProductores({ onlyActive: false }), cargarContactos()])
  } else {
    mostrarError(error.value || 'No se pudo eliminar el productor.')
  }
}
</script>
```

- [ ] **Step 2: `AdminDashboardView.vue` — template**

Reemplazar el `<template>` completo por:

```vue
<template>
  <div class="dashboard-view">
    <header class="admin-header">
      <h1 class="admin-title">Panel de Administración</h1>
      <RouterLink to="/admin/productores/nuevo" class="btn-create">
        ➕ Nuevo Productor
      </RouterLink>
    </header>

    <!-- Métricas -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <span class="kpi-value">{{ totalProductores }}</span>
        <span class="kpi-label">Productores registrados</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-value">{{ productoresVisibles }}</span>
        <span class="kpi-label">Visibles al público</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-value">{{ contactos.total }}</span>
        <span class="kpi-label">Contactos por WhatsApp</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-value">{{ contactos.ultimos30Dias }}</span>
        <span class="kpi-label">Contactos últimos 30 días</span>
      </div>
    </div>

    <!-- Indicador de carga -->
    <LoadingSpinner v-if="loading" message="Cargando productores..." />

    <!-- Error -->
    <div v-else-if="error" class="error-message">
      <p>⚠️ {{ error }}</p>
    </div>

    <!-- Tabla de productores -->
    <ProducerTable
      v-else
      :productores="productores"
      :contactos-por-productor="contactos.porProductor"
      @edit="handleEdit"
      @delete="handleDelete"
    />
  </div>
</template>
```

- [ ] **Step 3: `AdminDashboardView.vue` — estilos de KPIs**

Al final del `<style scoped>` (antes de `</style>`), agregar:

```css
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
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.kpi-value {
  font-size: var(--font-size-3xl);
  font-weight: 700;
  color: var(--color-primary-dark);
  line-height: 1;
}

.kpi-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}
```

- [ ] **Step 4: `ProducerTable.vue` — prop nueva**

En `defineProps`, agregar después de `productores`:

```js
  /** Resumen de contactos por productor: Map<id, { total, ultimos_30_dias }> */
  contactosPorProductor: {
    type: Map,
    default: () => new Map(),
  },
```

Y agregar debajo de `filteredProductores`:

```js
/** Total de contactos por WhatsApp de un productor (0 si no tiene) */
function contactosDe(id) {
  return props.contactosPorProductor.get(id)?.total ?? 0
}
```

- [ ] **Step 5: `ProducerTable.vue` — columna nueva**

En `<thead>`, después de `<th>Estado</th>` agregar:
```vue
            <th class="text-right">Contactos</th>
```

En `<tbody>`, después de la celda `<!-- Estado --> ... </td>` y antes de `<!-- Acciones -->`, agregar:
```vue
            <!-- Contactos por WhatsApp -->
            <td class="text-right">
              <span class="contactos-count" :title="'Clics en Contactar por WhatsApp'">
                💬 {{ contactosDe(p.id) }}
              </span>
            </td>
```

Al final del `<style scoped>`, agregar:
```css
.contactos-count {
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
}
```

- [ ] **Step 6: Tests, build, prueba manual**

Run: `npm test` → PASS.
Run: `npm run build` → `✓ built`.

Manual: panel admin → 4 tarjetas KPI con números; la columna "Contactos" muestra el total por productor. Hacer un clic de WhatsApp en el detalle público → volver al panel → el número subió.

- [ ] **Step 7: Commit**

```bash
git add src/views/admin/AdminDashboardView.vue src/components/admin/ProducerTable.vue
git commit -m "feat(admin): KPIs de productores y contactos por WhatsApp en el panel

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 14: README para el equipo receptor

**Files:**
- Create: `README.md`

- [ ] **Step 1: Escribir `README.md`**

````markdown
# Directorio MIPYMES Guanacaste

Directorio web que conecta a chefs, restaurantes y hoteles de Guanacaste con
pequeños productores locales de alimentos. Proyecto de Trabajo Comunal
Universitario (TCU) de la Universidad de Costa Rica, Sede de Guanacaste.

- **Público (sin registro):** busca productores por nombre o descripción, filtra
  por cantón y categoría, y contacta por WhatsApp con un clic.
- **Administradores (equipo TCU):** inician sesión y gestionan el directorio
  (crear, editar, ocultar y eliminar productores, con foto).

Costo de infraestructura: **$0/mes** (Supabase Free + Vercel Hobby).

---

## Tabla de contenido

1. [Requisitos](#1-requisitos)
2. [Configurar Supabase](#2-configurar-supabase)
3. [Crear el primer administrador](#3-crear-el-primer-administrador)
4. [Ejecutar en la computadora](#4-ejecutar-en-la-computadora)
5. [Publicar en Vercel](#5-publicar-en-vercel)
6. [Tareas de mantenimiento](#6-tareas-de-mantenimiento)
7. [Límites del plan gratuito](#7-límites-del-plan-gratuito)
8. [Problemas frecuentes](#8-problemas-frecuentes)
9. [Estructura del código](#9-estructura-del-código)

---

## 1. Requisitos

- [Node.js](https://nodejs.org) 18 o superior (recomendado 22).
- Una cuenta gratuita en [supabase.com](https://supabase.com).
- Una cuenta gratuita en [vercel.com](https://vercel.com) (solo para publicar).
- Una cuenta de GitHub con acceso a este repositorio.

## 2. Configurar Supabase

Solo se hace **una vez** por proyecto.

1. En Supabase: **New project** → nombre `mipymes-guanacaste`, región `East US`
   (la más cercana), contraseña de base de datos (guárdela).
2. Espere a que el proyecto termine de crearse (1-2 minutos).
3. **SQL Editor** → **New query** → pegue el contenido completo de
   `database/migrations/001_initial_schema.sql` → **Run**.
4. Repita con `database/migrations/002_seguridad_admin_y_contactos.sql`.
5. Repita con `database/seeds/001_seed_cantones_categorias.sql` (carga los 11
   cantones y 9 categorías iniciales).
6. **Storage** → **New bucket** → nombre exacto `product-images` → active
   **Public bucket** → **Save**.
7. **Authentication → Providers → Email** → desactive
   **"Allow new users to sign up"** → **Save**.
   > Sin esto, cualquier persona podría crear una cuenta. Con la migración 002
   > no podría modificar nada, pero es mejor cerrar la puerta.
8. **Authentication → URL Configuration**:
   - **Site URL:** la dirección pública del sitio (por ejemplo
     `https://mipymes-guanacaste.vercel.app`). Si aún no la tiene, ponga
     `http://localhost:5173` y cámbiela después de publicar.
   - **Redirect URLs** → **Add URL**, agregue estas dos:
     - `http://localhost:5173/restablecer-contrasena`
     - `https://SU-DOMINIO.vercel.app/restablecer-contrasena`
9. **Project Settings → API** → copie **Project URL** y **anon public** key.
   Los necesitará en los pasos 4 y 5.

## 3. Crear el primer administrador

Los administradores se crean a mano (no hay registro público) y deben estar
en la **lista blanca** `admin_profiles`.

1. **Authentication → Users → Add user → Create new user**: correo y
   contraseña; marque **Auto Confirm User** → **Create user**.
2. En la lista de usuarios, copie el **UUID** del usuario recién creado
   (columna *UID*).
3. **SQL Editor** → ejecute (reemplace el UUID y el nombre):

   ```sql
   INSERT INTO public.admin_profiles (id, nombre_completo, rol)
   VALUES ('PEGUE-AQUI-EL-UUID', 'Nombre Apellido', 'superadmin');
   ```

4. Verifique:

   ```sql
   SELECT u.email, p.nombre_completo, p.rol
   FROM public.admin_profiles p
   JOIN auth.users u ON u.id = p.id;
   ```

Para cada administrador adicional, repita los pasos 1-3 con `rol = 'editor'`.
(Hoy ambos roles tienen los mismos permisos; la distinción queda para el futuro.)

## 4. Ejecutar en la computadora

```bash
git clone https://github.com/HeinnerV/tcu-mipymes-guanacaste.git
cd tcu-mipymes-guanacaste
npm install
```

Copie `.env.example` a `.env` y complete con los valores del paso 2.9:

```
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

Luego:

```bash
npm run dev
```

Abra `http://localhost:5173`. El panel de administración está en `/login`.

Otros comandos:

| Comando | Qué hace |
|---|---|
| `npm test` | Ejecuta las pruebas automáticas (deben pasar todas) |
| `npm run build` | Genera la versión de producción en `dist/` |
| `npm run preview` | Sirve `dist/` localmente para revisarlo |

## 5. Publicar en Vercel

1. En Vercel: **Add New → Project** → **Import** este repositorio de GitHub.
2. Framework: se detecta **Vite** automáticamente. No cambie nada más.
3. **Environment Variables** → agregue las dos mismas variables del `.env`:
   `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
4. **Deploy**. En 1-2 minutos tendrá una URL `https://....vercel.app`.
5. Vuelva a Supabase → **Authentication → URL Configuration** y ponga esa URL
   como **Site URL** y agregue `https://....vercel.app/restablecer-contrasena`
   a **Redirect URLs** (paso 2.8).

Cada `git push` a la rama `main` vuelve a publicar automáticamente.

El archivo `vercel.json` del repositorio hace que todas las rutas
(`/productor/...`, `/admin`) carguen la aplicación; sin él, refrescar la
página daría error 404.

## 6. Tareas de mantenimiento

Todas se hacen desde **Supabase → SQL Editor**.

**Agregar un administrador:** ver sección 3.

**Quitar un administrador** (pierde permisos de inmediato; la cuenta sigue
existiendo y puede borrarse en Authentication → Users):

```sql
DELETE FROM public.admin_profiles WHERE id = 'UUID-DEL-USUARIO';
```

**Agregar una categoría de alimentos:**

```sql
INSERT INTO public.categorias (nombre, icono) VALUES ('Café', '☕');
```

**Agregar un cantón** (los 11 de Guanacaste ya están; solo si cambia la
división territorial):

```sql
INSERT INTO public.cantones (nombre) VALUES ('Nombre del cantón');
```

**Contactos por WhatsApp por mes** (para informes del TCU):

```sql
SELECT to_char(created_at, 'YYYY-MM') AS mes, count(*) AS contactos
FROM public.contactos_whatsapp
GROUP BY mes ORDER BY mes;
```

**Contactos por productor:**

```sql
SELECT p.nombre_negocio, c.nombre AS canton, r.total, r.ultimos_30_dias
FROM public.resumen_contactos_whatsapp r
JOIN public.productores p ON p.id = r.productor_id
LEFT JOIN public.cantones c ON c.id = p.canton_id
ORDER BY r.total DESC;
```

**Un administrador olvidó su contraseña:** en la pantalla de inicio de sesión
hay un enlace "¿Olvidó su contraseña?" que envía un correo de recuperación.
Si prefiere hacerlo a mano: **Authentication → Users → (usuario) → Reset
password**.

## 7. Límites del plan gratuito

| Recurso | Límite Free | Qué significa aquí |
|---|---|---|
| Base de datos | 500 MB | Miles de productores; sin riesgo real |
| Storage | 1 GB | Las fotos se comprimen a ~100-200 KB → ~5.000 fotos |
| Correos de Auth | 2-4 por hora | Suficiente para recuperar contraseñas; no para envíos masivos |
| Inactividad | 7 días sin uso pausa el proyecto | Entrar a `supabase.com` y **Restore** lo reactiva en 1-2 min |
| Vercel | 100 GB de transferencia/mes | Muy por encima del tráfico esperado |

Si el proyecto se pausa por inactividad, el sitio muestra un error de conexión
hasta que alguien lo restaure desde el panel de Supabase.

## 8. Problemas frecuentes

**Pantalla en blanco al abrir el sitio.**
Faltan las variables de entorno. En local: revise `.env`. En Vercel:
*Settings → Environment Variables* y vuelva a hacer **Redeploy**. Abra la
consola del navegador (F12): verá el mensaje `[Supabase] Faltan las variables...`.

**Puedo iniciar sesión pero al guardar dice que no se pudo.**
El usuario no está en `admin_profiles`. Ver sección 3.

**No llega el correo de recuperación.**
1. Revise spam. 2. Espere: el límite es 2-4 correos por hora. 3. Verifique que
la URL del sitio esté en **Redirect URLs** (sección 2.8).

**Al hacer clic en el enlace del correo dice "Enlace inválido o expirado".**
El enlace dura 1 hora y sirve una sola vez. Pida uno nuevo. Si vuelve a fallar,
revise **Redirect URLs**.

**Refrescar `/admin` o `/productor/...` da 404 en Vercel.**
Falta `vercel.json` en el repositorio o el deploy es anterior a ese archivo.
Haga **Redeploy**.

**El botón de WhatsApp no aparece en un productor.**
Su teléfono no es válido (no tiene 8 dígitos). Edítelo desde el panel.

**El sitio dice "Error al obtener los productores".**
El proyecto de Supabase está pausado (sección 7) o la clave `anon` cambió.

## 9. Estructura del código

```
src/
├── lib/supabase.js          Cliente de Supabase (lanza error si faltan variables)
├── utils/                   Funciones puras, sin Supabase, con pruebas
│   ├── telefono.js          Normalizar/validar/formatear teléfonos de CR
│   ├── whatsapp.js          Enlace wa.me con mensaje predefinido
│   └── busqueda.js          Limpieza del texto de búsqueda
├── composables/             Estado reactivo + una responsabilidad cada uno
│   ├── useAuth.js           Sesión, login, logout, recuperar contraseña
│   ├── useProductores.js    CRUD de productores (usa useStorage para fotos)
│   ├── useStorage.js        Subir/eliminar imágenes del bucket
│   ├── useCatalogos.js      Cantones y categorías
│   ├── useContactos.js      Métrica de contactos por WhatsApp
│   └── useToast.js          Notificaciones de éxito/error
├── router/
│   ├── index.js             Rutas (públicas, login, /admin con hijos)
│   └── guard.js             Protección de rutas admin
├── layouts/AdminLayout.vue  Barra lateral + contenido del panel
├── components/              Piezas de interfaz reutilizables
└── views/                   Una vista por ruta

database/
├── migrations/001_...sql    Tablas, índices y RLS iniciales
├── migrations/002_...sql    Lista blanca de admins, contactos, Storage
└── seeds/001_...sql         Cantones y categorías iniciales

tests/                       Pruebas con Vitest (npm test)
docs/superpowers/            Especificación y plan de la refactorización
```

Convenciones: Vue 3 con `<script setup>`, todo en español, sin TypeScript ni
gestores de estado externos, para que cualquier estudiante pueda mantenerlo.
````

- [ ] **Step 2: Verificar que los enlaces internos funcionan**

Abrir el archivo en la vista previa de Markdown del editor y hacer clic en cada
entrada de la tabla de contenido. Todas deben saltar a su sección.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: README de instalación, despliegue y mantenimiento para el equipo TCU

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 15: Verificación final

**Files:** ninguno nuevo.

- [ ] **Step 1: Suite completa y build limpio**

```bash
npm test
```
Expected: PASS en 9 archivos (`telefono`, `whatsapp`, `busqueda`, `useToast`, `useAuth`, `useStorage`, `useProductores`, `useContactos`, `guard`) — 0 fallos.

```bash
npm run build
```
Expected: `✓ built`, 0 errores, 0 warnings de imports no resueltos.

- [ ] **Step 2: Sin residuos**

```bash
grep -rn "generateWhatsAppLink\|@vueuse\|uploadImage" src --include=*.vue --include=*.js
```
Expected: `uploadImage` solo en `useStorage.js` y `useProductores.js`; los otros dos sin resultados.

```bash
grep -rhoE 'var\(--[a-z0-9-]+' src --include=*.vue | sed 's/var(//' | sort -u > /tmp/used.txt; grep -oE '^\s*--[a-z0-9-]+' src/assets/styles/main.css | sed 's/^\s*//' | sort -u > /tmp/def.txt; comm -23 /tmp/used.txt /tmp/def.txt
```
Expected: sin salida.

- [ ] **Step 3: Smoke test manual completo (sección 9 de la spec)**

Con `npm run dev`, migración 002 aplicada y el admin en `admin_profiles`:

| # | Acción | Resultado esperado |
|---|---|---|
| 1 | Abrir `/` | Lista de productores activos; footer con fondo oscuro y texto claro; botón "Buscar" con fondo verde |
| 2 | Buscar una palabra que solo está en una descripción | Ese productor aparece |
| 3 | Filtrar por categoría | Solo productores de esa categoría; cada tarjeta muestra **todas** sus categorías |
| 4 | Abrir un detalle → clic en WhatsApp | Abre `wa.me/506...`; `SELECT count(*) FROM contactos_whatsapp` sube en 1 |
| 5 | `/admin` sin sesión | Redirige a `/login?redirect=/admin` |
| 6 | Login con contraseña incorrecta | "Correo o contraseña incorrectos." |
| 7 | Login correcto | Panel con 4 KPIs y tabla con columna "Contactos" |
| 8 | Nuevo productor con foto > 200 KB, teléfono `8888 4444` | Toast verde; en Storage hay un `.webp`; en la tabla el teléfono es `50688884444` |
| 9 | Editar → cambiar foto → guardar | La foto vieja desapareció del bucket |
| 10 | Editar → desmarcar "activo" → guardar | Ya no aparece en `/`; `SET ROLE anon; SELECT count(*) FROM productores WHERE activo=false;` → 0 |
| 11 | Eliminar | Toast verde; foto desaparecida del bucket; contactos de ese productor borrados (CASCADE) |
| 12 | Cerrar sesión → "¿Olvidó su contraseña?" → correo → enlace → nueva contraseña | Toast "Contraseña actualizada"; login con la nueva funciona |
| 13 | Refrescar el navegador en `/admin` | Sigue en el panel (sesión persistida) |
| 14 | Renombrar `.env` temporalmente y abrir `/` | Consola: `[Supabase] Faltan las variables...`; restaurar `.env` |

- [ ] **Step 4: Estado del repositorio**

```bash
git status
git log --oneline main..refactorizacion
```
Expected: árbol limpio; ~15 commits sobre `main`.

- [ ] **Step 5: Publicar la rama**

```bash
git push -u origin refactorizacion
```

Luego decidir con el usuario si se abre PR a `main` o se merge directo (ver skill `superpowers:finishing-a-development-branch`).

---

## Auto-revisión del plan (hecha al escribirlo)

**Cobertura de la spec:**
- §4.2 utils → Tasks 1-2. §4.3 supabase.js → Task 3. §4.4 useAuth/useStorage/useProductores/useContactos/useToast → Tasks 5, 6, 8, 11, 4. §4.5 layout y rutas → Task 9. §4.6 tokens → Task 3 (con desviación documentada). §4.7 dependencias → Tasks 1 y 3.
- §5 migración → Task 7 completa. §5.5 configuración manual → Task 7 Steps 2-4 + README.
- §6.1 formulario/uploader → Task 10. §6.2 vistas admin → Tasks 9, 10, 13. §6.3 vista pública → Task 11. §6.4 recuperación → Task 12. §6.5 despliegue → Task 3.
- §7 pruebas → los 6 archivos de la spec más `useStorage`, `useToast` y `useContactos` (9 en total). §8 README → Task 14. §9 verificación → Task 15.

**Consistencia de nombres entre tareas:** `normalizarTelefono`/`esTelefonoValido`/`formatearTelefono` (T1) usados en T8, T10, T11. `generarEnlaceWhatsApp` (T2) en T3, T11. `sanitizarBusqueda` (T2) en T8. `BUCKET_IMAGENES` (T3) en T6. `useStorage().uploadImage/deleteImage` (T6) en T8. `useToast().mostrarExito/mostrarError` (T4) en T10, T12, T13. `authReady` (T5) en T12. `guardiaAutenticacion` (T9). `useContactos().registrarContacto/fetchResumenContactos` (T11) en T13. `ImageUploader` emits `archivo-seleccionado`/`quitar` (T10). `ProducerTable` prop `contactosPorProductor` (T13). Ruta `reset-password` (T9) en T12.
