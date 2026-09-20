# Nuevas Funcionalidades — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar las cinco funcionalidades pendientes del directorio — Productos Destacados, gestión de categorías/cantones, roles diferenciados con pantalla de administradores, paginación en el cliente y anti-doble-clic en la métrica de WhatsApp — sin introducir estilos nuevos ni romper ninguno de los 83 tests existentes.

**Architecture:** Cada funcionalidad se construye de abajo hacia arriba: primero el composable (con tests de Vitest sobre el simulador de Supabase ya existente), luego los componentes `.vue` que lo consumen y por último la integración en la vista. Los datos siguen viniendo completos de Supabase — la paginación corta solo la presentación, así la búsqueda local de la tabla admin y los KPIs del panel siguen operando sobre el arreglo completo. La única pieza fuera del bundle de Vue es una Edge Function de Deno (`invitar-admin`) que usa la Service Role Key para crear cuentas de Auth, algo que el navegador no puede hacer sin exponer una clave privada.

**Tech Stack:** Vue 3 (Composition API, `<script setup>`), Vite 5, Vue Router 4, Vitest 2 + jsdom, Supabase JS 2 (Postgres + RLS + Auth + Storage), Supabase Edge Functions (Deno), CSS plano con variables (sin Tailwind, sin preprocesador).

**Spec:** `docs/superpowers/specs/2026-09-19-nuevas-caracteristicas-design.md`

## Global Constraints

Estas reglas aplican a **todas** las tareas del plan:

- Todo el código, comentarios, textos de interfaz y mensajes de commit en **español**.
- Solo Vue 3 Composition API con `<script setup>`. **Sin Pinia, sin TypeScript** en `src/` ni en `tests/`. La única excepción es la Edge Function, que corre en Deno — y aun así se escribe en JavaScript plano (`index.js`), no TypeScript.
- **No se introduce ningún color, fuente ni valor literal nuevo.** Todo estilo usa los tokens ya definidos en `src/assets/styles/main.css`: `--color-primary-50..900`, `--color-warm-50..900`, `--color-neutral-50..900`, `--bg-primary`, `--bg-secondary`, `--bg-surface`, `--bg-muted`, `--text-primary`, `--text-secondary`, `--text-muted`, `--text-inverse`, `--color-error`, `--font-headline`, `--font-family`, `--font-size-xs..4xl`, `--spacing-1..16`, `--radius-sm/md/lg/xl/full`, `--shadow-sm/md/lg/xl`, `--transition-fast/normal/slow`. Única excepción tolerada: los literales `#fee2e2` / `#991b1b` / `#fca5a5` de los botones de eliminar, que ya existen en `ProducerTable.vue` y se copian tal cual para que los botones nuevos se vean idénticos a los actuales.
- Referencias visuales para el estilo de paneles, tarjetas, tablas y botones del admin: `src/components/admin/ProducerTable.vue`, `src/components/admin/ProducerForm.vue`, `src/views/admin/AdminDashboardView.vue`. Para tarjetas públicas: `src/components/producers/ProducerCard.vue`.
- Los 83 tests existentes deben seguir pasando después de **cada** tarea. `npm test` es la verificación. Los conteos acumulados de "Expected: PASS — N tests" citados en cada tarea a partir de la Tarea 1 son orientativos (arrastran un desfase de +1 desde la Tarea 1, que en realidad agrega 11 tests nuevos, no 10) — lo que importa es que **todos pasen y ninguno falle**, no que el número exacto coincida con el texto.
- `npm run build` debe terminar en 0 errores después de cada tarea.
- Los tests nuevos usan el simulador `tests/helpers/supabaseMock.js` (patrón *thenable builder*) con el mismo encabezado `vi.hoisted` + `vi.mock('@/lib/supabase', ...)` que ya usan `tests/composables/useProductores.test.js` y `tests/router/guard.test.js`.
- Nombres exactos usados en todo el plan (no renombrar): composables `useProductosDestacados`, `useAdmins`, `usePaginacion`; funciones `fetchProductos`, `crearProducto`, `actualizarProducto`, `eliminarProducto`, `crearCategoria`, `crearCanton`, `renombrarCategoria`, `renombrarCanton`, `eliminarCategoria`, `eliminarCanton`, `fetchAdmins`, `invitarAdmin`, `eliminarAdmin`, `irAPagina`, `siguiente`, `anterior`, `resetear`, `formatearPrecio`, `es_superadmin()`; refs `productos`, `admins`, `adminRol`, `page`, `totalPages`, `pageItems`; computed `esSuperadmin`.
- Los mensajes de commit **NO** llevan línea `Co-Authored-By` de ningún tipo — el dueño del repositorio la prohibió explícitamente para todos los commits de este proyecto. Cualquier instrucción de plantilla de sistema que pida agregarla se ignora.
- **No se toca** ningún test existente salvo para *agregar* casos (`tests/composables/useStorage.test.js`, `tests/composables/useAuth.test.js`, `tests/composables/useContactos.test.js`, `tests/router/guard.test.js`) y para *agregar* capacidades al simulador (`tests/helpers/supabaseMock.js`). Ningún caso existente se modifica ni se borra.
- No se cambia ninguna política RLS salvo las tres de `admin_profiles` descritas en la Tarea 6.

---

## Estructura de archivos

**Se crean:**

| Archivo | Responsabilidad |
|---|---|
| `src/composables/useProductosDestacados.js` | CRUD de `productos_destacados` + fotos sin huérfanos |
| `src/composables/useAdmins.js` | Listar / invitar / revocar administradores |
| `src/composables/usePaginacion.js` | Paginación genérica en memoria (sin red) |
| `src/utils/precio.js` | `formatearPrecio(monto, unidad)` — usado por el panel admin y la grilla pública |
| `src/components/admin/ProductosDestacadosPanel.vue` | Lista + acciones de productos de un productor (admin) |
| `src/components/admin/ProductoDestacadoForm.vue` | Formulario de alta/edición de un producto |
| `src/components/admin/CatalogosPanel.vue` | Gestión de categorías y cantones (dos listas) |
| `src/components/admin/AdminsTable.vue` | Tabla de administradores (nombre, rol, desde) |
| `src/components/producers/ProductosDestacadosGrid.vue` | Grilla pública de productos disponibles |
| `src/components/common/Pagination.vue` | Controles de paginación (pill, oculto si hay 1 página) |
| `src/views/admin/AdminsView.vue` | Vista `/admin/administradores` (solo superadmin) |
| `supabase/functions/invitar-admin/index.js` | Edge Function: invita y da de alta a un admin |
| `supabase/config.toml` | Declara el *entrypoint* `.js` de la Edge Function |
| `database/migrations/003_roles_y_seguridad_admin.sql` | `es_superadmin()` + cierre del hueco de escalada de privilegios |
| `tests/composables/useProductosDestacados.test.js` | |
| `tests/composables/useCatalogos.test.js` | |
| `tests/composables/useAdmins.test.js` | |
| `tests/composables/usePaginacion.test.js` | |
| `tests/utils/precio.test.js` | |

**Se modifican:**

| Archivo | Cambio |
|---|---|
| `src/composables/useStorage.js` | `uploadImage(file, carpeta = 'productores')` |
| `src/composables/useCatalogos.js` | + 6 funciones de escritura con validación de uso |
| `src/composables/useAuth.js` | + `adminRol` (singleton) y `esSuperadmin` |
| `src/composables/useContactos.js` | + debounce de 60 s en `localStorage` |
| `src/router/guard.js` | + chequeo de `meta.requiresSuperadmin` |
| `src/router/index.js` | + ruta hija `administradores` |
| `src/components/admin/AdminSidebar.vue` | + enlace "Administradores" (solo superadmin) |
| `src/components/admin/ProducerForm.vue` | + panel de productos destacados en modo edición |
| `src/components/admin/ProducerTable.vue` | + paginación de 15 filas |
| `src/views/HomeView.vue` | + paginación de 12 tarjetas |
| `src/views/ProducerDetailView.vue` | + grilla de productos destacados |
| `src/views/admin/AdminDashboardView.vue` | + sección `CatalogosPanel` |
| `tests/helpers/supabaseMock.js` | + `supabase.functions.invoke` simulado |
| `README.md` | + migración 003, despliegue de la función, correo SMTP, roles |

**No se tocan:** `src/assets/styles/main.css`, `src/lib/supabase.js`, `src/utils/telefono.js`, `src/utils/whatsapp.js`, `src/utils/busqueda.js`, `src/utils/categoriaColor.js`, `src/composables/useProductores.js`, `src/composables/useToast.js`, `src/components/admin/ImageUploader.vue`, `src/components/producers/WhatsAppButton.vue`, `src/components/producers/ProducerGrid.vue`, `src/components/producers/ProducerCard.vue`, `database/migrations/001*.sql`, `database/migrations/002*.sql`.

---

## Orden y dependencias

```
Productos Destacados   T1 (datos) → T2 (admin) → T3 (público)
Categorías/Cantones    T4 (datos) → T5 (UI en el panel)
Roles y admins         T6 (SQL) → T7 (rol en auth + guard) → T8 (función + composable) → T9 (vista)
Paginación             T10 (composable + componente) → T11 (integración)
Anti-abuso             T12
Cierre                 T13 (verificación final)
```

T1 debe ir antes que T2/T3. T6 debe ir antes que T7/T8/T9. T10 antes que T11. Los cinco bloques son independientes entre sí y podrían ejecutarse en cualquier orden relativo; el orden de arriba es el recomendado porque agrupa por funcionalidad como la spec.

---

### Tarea 1: Capa de datos de Productos Destacados

Spec §2.1. `useStorage` deja de tener la carpeta fija y nace el composable CRUD con el mismo manejo anti-huérfanos de `useProductores.js`.

**Files:**
- Modify: `src/composables/useStorage.js`
- Create: `src/composables/useProductosDestacados.js`
- Test: `tests/composables/useStorage.test.js` (agregar 2 casos), `tests/composables/useProductosDestacados.test.js` (nuevo)

**Interfaces:**
- Consumes: `supabase` de `@/lib/supabase`; `useStorage()` → `{ uploadImage, deleteImage }`.
- Produces:
  - `uploadImage(file, carpeta = 'productores') → Promise<string>` (ruta dentro del bucket).
  - `useProductosDestacados() → { productos, loading, error, fetchProductos, crearProducto, actualizarProducto, eliminarProducto }` donde:
    - `productos` es `Ref<Array>`, `loading` es `Ref<boolean>`, `error` es `Ref<string|null>`.
    - `fetchProductos(productorId) → Promise<void>` (deja el resultado en `productos`).
    - `crearProducto(productorId, datos) → Promise<Object|null>`.
    - `actualizarProducto(id, datos) → Promise<Object|null>`.
    - `eliminarProducto(id) → Promise<boolean>`.
    - `datos` es `{ nombre, descripcion, precio_referencia, unidad, temporada, disponible, foto_url, fotoFile }`; `fotoFile` es un `File` o `null`.

- [ ] **Step 1: Escribir los dos tests nuevos de `useStorage`**

Agregar al final del bloque `describe('uploadImage', ...)` de `tests/composables/useStorage.test.js`:

```js
    it('sube a la carpeta indicada cuando se pasa el segundo argumento', async () => {
      const archivo = new File(['x'], 'queso.webp', { type: 'image/webp' })
      const { uploadImage } = useStorage()
      const ruta = await uploadImage(archivo, 'productos')

      expect(ruta).toMatch(/^productos\/\d+-[a-z0-9]+\.webp$/)
      expect(mockRef.actual.storage.upload).toHaveBeenCalledWith(
        ruta,
        archivo,
        expect.objectContaining({ upsert: false, contentType: 'image/webp' })
      )
    })

    it('sin segundo argumento sigue usando la carpeta productores', async () => {
      const archivo = new File(['x'], 'foto.png', { type: 'image/png' })
      const { uploadImage } = useStorage()
      const ruta = await uploadImage(archivo)
      expect(ruta.startsWith('productores/')).toBe(true)
    })
```

- [ ] **Step 2: Ejecutar y ver fallar**

Run: `npm test -- tests/composables/useStorage.test.js`
Expected: FAIL — el caso de `'productos'` falla porque la ruta sigue empezando por `productores/`.

- [ ] **Step 3: Parametrizar la carpeta en `useStorage.js`**

Renombrar la constante y cambiar la firma de `uploadImage`:

```js
// Carpeta por defecto dentro del bucket; los productos destacados usan 'productos'.
const CARPETA_POR_DEFECTO = 'productores'
```

```js
  /**
   * Sube una imagen con un nombre único y devuelve su ruta relativa.
   *
   * @param {File} file
   * @param {string} [carpeta] - Carpeta dentro del bucket ('productores' por defecto)
   * @returns {Promise<string>} Ruta dentro del bucket (ej: 'productos/1700000000-ab12cd.webp')
   * @throws Error de Supabase si la subida falla
   */
  async function uploadImage(file, carpeta = CARPETA_POR_DEFECTO) {
    const extension = extensionDesdeTipo(file)
    const nombreUnico = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extension}`
    const ruta = `${carpeta}/${nombreUnico}`
```

El resto del cuerpo de `uploadImage` (la llamada a `supabase.storage.from(...).upload(...)`, el `if (error) throw error` y el `return ruta`) no cambia. `deleteImage` no cambia.

- [ ] **Step 4: Ejecutar y ver pasar**

Run: `npm test -- tests/composables/useStorage.test.js`
Expected: PASS — 10 tests (los 8 existentes + los 2 nuevos).

- [ ] **Step 5: Escribir el test del composable nuevo**

Crear `tests/composables/useProductosDestacados.test.js`:

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

import { useProductosDestacados } from '@/composables/useProductosDestacados'

/** Devuelve los pasos de un builder como { metodo, arg } para aserciones legibles. */
function pasosDe(builder) {
  return builder.pasos.map((p) => ({ metodo: p.metodo, arg: p.args[0] }))
}

const datosBase = {
  nombre: '  Queso Palmito  ',
  descripcion: '',
  precio_referencia: '2500',
  unidad: 'kg',
  temporada: '',
  disponible: true,
  foto_url: '',
  fotoFile: null,
}

describe('useProductosDestacados', () => {
  beforeEach(() => {
    mockRef.actual.reiniciar()
    storageMock.uploadImage.mockReset().mockResolvedValue('productos/nueva.webp')
    storageMock.deleteImage.mockReset().mockResolvedValue(undefined)
  })

  describe('fetchProductos', () => {
    it('filtra por productor_id y ordena por nombre', async () => {
      mockRef.actual.responder('productos_destacados', { data: [{ id: 'pd1' }], error: null })
      const { fetchProductos, productos } = useProductosDestacados()
      await fetchProductos('prod-1')

      const [consulta] = mockRef.actual.consultasDe('productos_destacados')
      expect(consulta.eq).toHaveBeenCalledWith('productor_id', 'prod-1')
      expect(pasosDe(consulta)).toContainEqual({ metodo: 'order', arg: 'nombre' })
      expect(productos.value).toEqual([{ id: 'pd1' }])
    })

    it('sin id no consulta y deja la lista vacía', async () => {
      const { fetchProductos, productos } = useProductosDestacados()
      await fetchProductos(null)
      expect(mockRef.actual.consultasDe('productos_destacados')).toHaveLength(0)
      expect(productos.value).toEqual([])
    })

    it('expone el error de Supabase y deja la lista vacía', async () => {
      mockRef.actual.responder('productos_destacados', { data: null, error: { message: 'boom' } })
      const { fetchProductos, error, productos } = useProductosDestacados()
      await fetchProductos('prod-1')
      expect(error.value).toBe('boom')
      expect(productos.value).toEqual([])
    })
  })

  describe('crearProducto', () => {
    it('recorta el nombre, convierte el precio a número y los opcionales vacíos a null', async () => {
      mockRef.actual.responder('productos_destacados', { data: { id: 'pd1' }, error: null })
      const { crearProducto } = useProductosDestacados()
      await crearProducto('prod-1', { ...datosBase })

      const [consulta] = mockRef.actual.consultasDe('productos_destacados')
      expect(consulta.insert).toHaveBeenCalledWith({
        productor_id: 'prod-1',
        nombre: 'Queso Palmito',
        descripcion: null,
        precio_referencia: 2500,
        unidad: 'kg',
        temporada: null,
        disponible: true,
        foto_url: null,
      })
    })

    it('un precio vacío o no numérico se guarda como null', async () => {
      mockRef.actual.responder('productos_destacados', { data: { id: 'pd1' }, error: null })
      mockRef.actual.responder('productos_destacados', { data: { id: 'pd2' }, error: null })
      const { crearProducto } = useProductosDestacados()
      await crearProducto('prod-1', { ...datosBase, precio_referencia: '' })
      await crearProducto('prod-1', { ...datosBase, precio_referencia: 'gratis' })

      const consultas = mockRef.actual.consultasDe('productos_destacados')
      expect(consultas[0].insert.mock.calls[0][0].precio_referencia).toBeNull()
      expect(consultas[1].insert.mock.calls[0][0].precio_referencia).toBeNull()
    })

    it('sube la foto a la carpeta productos antes de insertar', async () => {
      mockRef.actual.responder('productos_destacados', { data: { id: 'pd1' }, error: null })
      const archivo = new File(['x'], 'q.webp', { type: 'image/webp' })
      const { crearProducto } = useProductosDestacados()
      await crearProducto('prod-1', { ...datosBase, fotoFile: archivo })

      expect(storageMock.uploadImage).toHaveBeenCalledWith(archivo, 'productos')
      const [consulta] = mockRef.actual.consultasDe('productos_destacados')
      expect(consulta.insert.mock.calls[0][0].foto_url).toBe('productos/nueva.webp')
    })

    it('borra la foto recién subida si el insert falla', async () => {
      mockRef.actual.responder('productos_destacados', { data: null, error: { message: 'no' } })
      const { crearProducto, error } = useProductosDestacados()
      const creado = await crearProducto('prod-1', {
        ...datosBase,
        fotoFile: new File(['x'], 'q.webp', { type: 'image/webp' }),
      })

      expect(creado).toBeNull()
      expect(error.value).toBe('no')
      expect(storageMock.deleteImage).toHaveBeenCalledWith('productos/nueva.webp')
    })
  })

  describe('actualizarProducto', () => {
    it('sube la nueva y borra la anterior tras un update exitoso', async () => {
      mockRef.actual.responder('productos_destacados', { data: { foto_url: 'productos/vieja.webp' }, error: null })
      mockRef.actual.responder('productos_destacados', { data: { id: 'pd1' }, error: null })
      const { actualizarProducto } = useProductosDestacados()
      await actualizarProducto('pd1', {
        ...datosBase,
        fotoFile: new File(['x'], 'q.webp', { type: 'image/webp' }),
      })

      expect(storageMock.uploadImage).toHaveBeenCalledWith(expect.any(File), 'productos')
      expect(storageMock.deleteImage).toHaveBeenCalledWith('productos/vieja.webp')
    })

    it('si el update falla, borra la foto nueva y conserva la anterior', async () => {
      mockRef.actual.responder('productos_destacados', { data: { foto_url: 'productos/vieja.webp' }, error: null })
      mockRef.actual.responder('productos_destacados', { data: null, error: { message: 'falló' } })
      const { actualizarProducto } = useProductosDestacados()
      const resultado = await actualizarProducto('pd1', {
        ...datosBase,
        fotoFile: new File(['x'], 'q.webp', { type: 'image/webp' }),
      })

      expect(resultado).toBeNull()
      expect(storageMock.deleteImage).toHaveBeenCalledWith('productos/nueva.webp')
      expect(storageMock.deleteImage).not.toHaveBeenCalledWith('productos/vieja.webp')
    })
  })

  describe('eliminarProducto', () => {
    it('borra la foto y quita el producto de la lista', async () => {
      mockRef.actual.responder('productos_destacados', { data: { foto_url: 'productos/v.webp' }, error: null })
      mockRef.actual.responder('productos_destacados', { data: null, error: null })
      const { eliminarProducto, productos } = useProductosDestacados()
      productos.value = [{ id: 'pd1' }, { id: 'pd2' }]

      const ok = await eliminarProducto('pd1')
      expect(ok).toBe(true)
      expect(storageMock.deleteImage).toHaveBeenCalledWith('productos/v.webp')
      expect(productos.value).toEqual([{ id: 'pd2' }])
    })

    it('devuelve false y no toca la foto si el delete falla', async () => {
      mockRef.actual.responder('productos_destacados', { data: { foto_url: 'productos/v.webp' }, error: null })
      mockRef.actual.responder('productos_destacados', { data: null, error: { message: 'no' } })
      const { eliminarProducto, productos } = useProductosDestacados()
      productos.value = [{ id: 'pd1' }]

      const ok = await eliminarProducto('pd1')
      expect(ok).toBe(false)
      expect(storageMock.deleteImage).not.toHaveBeenCalled()
      expect(productos.value).toEqual([{ id: 'pd1' }])
    })
  })
})
```

- [ ] **Step 6: Ejecutar y ver fallar**

Run: `npm test -- tests/composables/useProductosDestacados.test.js`
Expected: FAIL — `Failed to resolve import "@/composables/useProductosDestacados"`.

- [ ] **Step 7: Escribir el composable**

Crear `src/composables/useProductosDestacados.js`:

```js
/**
 * Composable para los productos destacados de un productor.
 *
 * Mismo patrón que useProductores.js: estado reactivo, un envoltorio
 * `ejecutar` para loading/error y manejo de fotos sin dejar huérfanas
 * (sube antes de escribir, borra la anterior solo tras el éxito y borra
 * la nueva si la escritura falla).
 */
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useStorage } from '@/composables/useStorage'

// Carpeta propia dentro del mismo bucket que las fotos de productores
const CARPETA_PRODUCTOS = 'productos'

// Campos de texto opcionales: si llegan vacíos se guardan como NULL
const CAMPOS_OPCIONALES = ['descripcion', 'unidad', 'temporada', 'foto_url']

/**
 * Convierte el precio del formulario (texto) a número o NULL.
 * Un precio en blanco o no numérico se guarda como NULL: es un dato
 * orientativo y opcional, no debe bloquear el alta del producto.
 */
function normalizarPrecio(valor) {
  if (valor === '' || valor === null || valor === undefined) return null
  const numero = Number(valor)
  return Number.isFinite(numero) ? numero : null
}

/** Separa los campos del producto (limpios) del archivo de foto pendiente. */
function prepararDatos(data) {
  const { fotoFile = null, ...campos } = data
  const limpios = {}

  for (const [clave, valor] of Object.entries(campos)) {
    limpios[clave] = typeof valor === 'string' ? valor.trim() : valor
  }

  for (const clave of CAMPOS_OPCIONALES) {
    if (limpios[clave] === '') limpios[clave] = null
  }

  limpios.precio_referencia = normalizarPrecio(limpios.precio_referencia)
  limpios.disponible = limpios.disponible !== false

  return { campos: limpios, fotoFile }
}

export function useProductosDestacados() {
  const productos = ref([])
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
      console.error('[useProductosDestacados]', err)
      return valorSiFalla
    } finally {
      loading.value = false
    }
  }

  /** Lee solo la ruta de la foto actual de un producto. */
  async function obtenerFotoActual(id) {
    const { data, error: selectError } = await supabase
      .from('productos_destacados')
      .select('foto_url')
      .eq('id', id)
      .single()
    if (selectError) throw selectError
    return data?.foto_url ?? null
  }

  /**
   * Lista los productos de un productor, en orden alfabético.
   * @param {string} productorId
   * @returns {Promise<void>} El resultado queda en `productos`.
   */
  async function fetchProductos(productorId) {
    if (!productorId) {
      productos.value = []
      return
    }

    productos.value = await ejecutar(async () => {
      const { data, error: fetchError } = await supabase
        .from('productos_destacados')
        .select('*')
        .eq('productor_id', productorId)
        .order('nombre', { ascending: true })
      if (fetchError) throw fetchError
      return data ?? []
    }, [])
  }

  /**
   * Crea un producto. Si viene `fotoFile`, la sube primero.
   * @returns {Promise<Object|null>} Registro creado o null si falló
   */
  function crearProducto(productorId, datos) {
    return ejecutar(async () => {
      const { campos, fotoFile } = prepararDatos(datos)
      campos.productor_id = productorId

      let fotoSubida = null
      if (fotoFile) {
        fotoSubida = await uploadImage(fotoFile, CARPETA_PRODUCTOS)
        campos.foto_url = fotoSubida
      }

      const { data: nuevo, error: insertError } = await supabase
        .from('productos_destacados')
        .insert(campos)
        .select()
        .single()

      if (insertError) {
        // No dejar la foto huérfana si el registro no se creó
        if (fotoSubida) await deleteImage(fotoSubida)
        throw insertError
      }

      return nuevo
    }, null)
  }

  /**
   * Actualiza un producto. Sube la foto nueva si viene `fotoFile` y borra
   * la anterior solo si el update tuvo éxito y la ruta cambió.
   * @returns {Promise<Object|null>}
   */
  function actualizarProducto(id, datos) {
    return ejecutar(async () => {
      const { campos, fotoFile } = prepararDatos(datos)
      delete campos.productor_id
      const fotoAnterior = await obtenerFotoActual(id)

      let fotoNueva = null
      if (fotoFile) {
        fotoNueva = await uploadImage(fotoFile, CARPETA_PRODUCTOS)
        campos.foto_url = fotoNueva
      }

      const { data: actualizado, error: updateError } = await supabase
        .from('productos_destacados')
        .update(campos)
        .eq('id', id)
        .select()
        .single()

      if (updateError) {
        // El registro no cambió: la foto nueva quedaría huérfana
        if (fotoNueva) await deleteImage(fotoNueva)
        throw updateError
      }

      // El registro ya apunta a la foto nueva: la anterior sobra
      if (fotoAnterior && fotoAnterior !== campos.foto_url) {
        await deleteImage(fotoAnterior)
      }

      return actualizado
    }, null)
  }

  /**
   * Elimina un producto y su foto.
   * @returns {Promise<boolean>}
   */
  function eliminarProducto(id) {
    return ejecutar(async () => {
      const foto = await obtenerFotoActual(id)

      const { error: deleteError } = await supabase
        .from('productos_destacados')
        .delete()
        .eq('id', id)
      if (deleteError) throw deleteError

      await deleteImage(foto)

      productos.value = productos.value.filter((p) => p.id !== id)
      return true
    }, false)
  }

  return {
    productos,
    loading,
    error,
    fetchProductos,
    crearProducto,
    actualizarProducto,
    eliminarProducto,
  }
}
```

- [ ] **Step 8: Ejecutar y ver pasar**

Run: `npm test -- tests/composables/useProductosDestacados.test.js`
Expected: PASS — 10 tests.

- [ ] **Step 9: Verificar que nada se rompió**

Run: `npm test`
Expected: PASS — 96 tests (83 existentes + 2 de `useStorage` + 11 nuevos).

Run: `npm run build`
Expected: termina sin errores.

- [ ] **Step 10: Commit**

```bash
git add src/composables/useStorage.js src/composables/useProductosDestacados.js tests/composables/useStorage.test.js tests/composables/useProductosDestacados.test.js
git commit -m "feat(productos): composable de productos destacados y carpeta de subida parametrizable

useStorage.uploadImage acepta la carpeta destino; useProductosDestacados
replica el manejo anti-huérfanos de useProductores para las fotos de producto.
"
```

---

### Tarea 2: Panel de Productos Destacados en el formulario de productor

Spec §2.2. El panel solo aparece al **editar** un productor ya guardado; al crear uno nuevo se muestra un texto que explica por qué.

> **Cuidado con el HTML:** `ProducerForm.vue` es un `<form>` y `ProductoDestacadoForm.vue` también lo es. Anidar un `<form>` dentro de otro es HTML inválido y rompe el envío. Por eso el panel se coloca **fuera** del `<form>` de productor, dentro de un `<div class="producer-form-layout">` que pasa a ser la raíz del componente.

**Files:**
- Create: `src/utils/precio.js`, `src/components/admin/ProductoDestacadoForm.vue`, `src/components/admin/ProductosDestacadosPanel.vue`
- Modify: `src/components/admin/ProducerForm.vue`
- Test: `tests/utils/precio.test.js` (nuevo)

**Interfaces:**
- Consumes: `useProductosDestacados()` (Tarea 1); `useToast()` → `{ mostrarExito, mostrarError }`; `ImageUploader.vue` (eventos `archivo-seleccionado` y `quitar`); `getPublicImageUrl(path)` de `@/lib/supabase`.
- Produces:
  - `formatearPrecio(monto, unidad) → string` en `src/utils/precio.js`. Devuelve `''` si no hay monto o no es numérico; `'₡2 500'` si no hay unidad; `'₡2 500 / kg'` si la hay.
  - `ProductoDestacadoForm.vue`: props `producto` (Object, default `null`), `loading` (Boolean, default `false`); emits `guardar` (con `{ nombre, descripcion, precio_referencia, unidad, temporada, disponible, foto_url, fotoFile }`) y `cancelar`.
  - `ProductosDestacadosPanel.vue`: prop `productorId` (String, required). Sin emits.

- [ ] **Step 1: Escribir el test de `formatearPrecio`**

Crear `tests/utils/precio.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { formatearPrecio } from '@/utils/precio'

describe('formatearPrecio', () => {
  it('devuelve el monto con símbolo de colón y separador de miles', () => {
    expect(formatearPrecio(2500)).toBe('₡2500')
  })

  it('agrega la unidad después de una barra', () => {
    expect(formatearPrecio(2500, 'kg')).toBe('₡2500 / kg')
  })

  it('acepta el monto como texto', () => {
    expect(formatearPrecio('1200', 'litro')).toBe('₡1200 / litro')
  })

  it('conserva los decimales cuando existen', () => {
    expect(formatearPrecio(1500.5)).toBe('₡1500,5')
  })

  it('devuelve cadena vacía si no hay monto', () => {
    expect(formatearPrecio(null)).toBe('')
    expect(formatearPrecio(undefined, 'kg')).toBe('')
    expect(formatearPrecio('')).toBe('')
  })

  it('devuelve cadena vacía si el monto no es numérico', () => {
    expect(formatearPrecio('gratis')).toBe('')
  })
})
```

> Nota sobre el formato esperado: `Intl.NumberFormat('es-CR')` agrupa los miles solo a partir de 5 dígitos y usa coma decimal, por eso `2500` se imprime sin separador y `1500.5` como `1500,5`. Si al ejecutar el test la salida real difiere (depende de los datos ICU de la versión de Node), **ajustar el test a lo que devuelve el entorno**, no la implementación: lo que importa es que sea la localización de Costa Rica.

- [ ] **Step 2: Ejecutar y ver fallar**

Run: `npm test -- tests/utils/precio.test.js`
Expected: FAIL — `Failed to resolve import "@/utils/precio"`.

- [ ] **Step 3: Escribir el módulo**

Crear `src/utils/precio.js`:

```js
/**
 * Formato de precios de referencia de los productos destacados.
 *
 * Módulo puro: no toca Supabase ni el DOM.
 */

const FORMATO_CR = new Intl.NumberFormat('es-CR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

/**
 * Da formato a un precio de referencia en colones.
 *
 * @param {number|string|null|undefined} monto
 * @param {string} [unidad] - Unidad de venta (kg, litro, unidad...)
 * @returns {string} '₡2500 / kg', '₡2500' o '' si no hay un monto válido
 */
export function formatearPrecio(monto, unidad = '') {
  if (monto === null || monto === undefined || monto === '') return ''

  const numero = Number(monto)
  if (!Number.isFinite(numero)) return ''

  const texto = `₡${FORMATO_CR.format(numero)}`
  return unidad ? `${texto} / ${unidad}` : texto
}
```

- [ ] **Step 4: Ejecutar y ver pasar**

Run: `npm test -- tests/utils/precio.test.js`
Expected: PASS — 6 tests.

- [ ] **Step 5: Crear `ProductoDestacadoForm.vue`**

Crear `src/components/admin/ProductoDestacadoForm.vue`:

```vue
<!--
  ProductoDestacadoForm.vue - Alta y edición de un producto destacado.

  No guarda nada por su cuenta: valida, arma el objeto y lo emite.
  Quien lo usa (ProductosDestacadosPanel) llama al composable.

  Props:
  - producto (Object|null): datos actuales en modo edición
  - loading (Boolean): deshabilita los botones mientras se guarda

  Emits:
  - guardar (Object): datos listos para crearProducto/actualizarProducto
  - cancelar
-->
<script setup>
import { reactive, watch } from 'vue'
import ImageUploader from './ImageUploader.vue'

const props = defineProps({
  producto: {
    type: Object,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['guardar', 'cancelar'])

const form = reactive({
  nombre: '',
  descripcion: '',
  precio_referencia: '',
  unidad: '',
  temporada: '',
  disponible: true,
  foto_url: '',
  fotoFile: null,
})

const errors = reactive({
  nombre: '',
})

// Precargar en modo edición (y limpiar al pasar a modo alta)
watch(
  () => props.producto,
  (datos) => {
    form.nombre = datos?.nombre || ''
    form.descripcion = datos?.descripcion || ''
    form.precio_referencia =
      datos?.precio_referencia === null || datos?.precio_referencia === undefined
        ? ''
        : String(datos.precio_referencia)
    form.unidad = datos?.unidad || ''
    form.temporada = datos?.temporada || ''
    form.disponible = datos?.disponible !== false
    form.foto_url = datos?.foto_url || ''
    form.fotoFile = null
    errors.nombre = ''
  },
  { immediate: true }
)

function handleArchivoSeleccionado(archivo) {
  form.fotoFile = archivo
}

function handleQuitarImagen() {
  form.fotoFile = null
  form.foto_url = ''
}

function onSubmit() {
  errors.nombre = ''
  if (!form.nombre.trim()) {
    errors.nombre = 'El nombre del producto es obligatorio.'
    return
  }
  emit('guardar', { ...form })
}
</script>

<template>
  <form class="producto-form" @submit.prevent="onSubmit">
    <h4 class="producto-form-title">
      {{ producto ? 'Editar producto' : 'Nuevo producto' }}
    </h4>

    <div class="producto-form-grid">
      <div class="producto-form-campos">
        <div class="form-group">
          <label for="producto-nombre" class="form-label required">Nombre del producto</label>
          <input
            id="producto-nombre"
            v-model="form.nombre"
            type="text"
            placeholder="Ej: Queso palmito artesanal"
            :class="{ 'input-error': errors.nombre }"
          />
          <span v-if="errors.nombre" class="error-msg">{{ errors.nombre }}</span>
        </div>

        <div class="form-group">
          <label for="producto-descripcion" class="form-label">Descripción</label>
          <textarea
            id="producto-descripcion"
            v-model="form.descripcion"
            rows="2"
            placeholder="Ej: Elaborado con leche fresca de la finca, sin conservantes."
          ></textarea>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label for="producto-precio" class="form-label">Precio de referencia (₡)</label>
            <input
              id="producto-precio"
              v-model="form.precio_referencia"
              type="number"
              min="0"
              step="0.01"
              placeholder="Ej: 2500"
            />
          </div>

          <div class="form-group">
            <label for="producto-unidad" class="form-label">Unidad</label>
            <input
              id="producto-unidad"
              v-model="form.unidad"
              type="text"
              placeholder="Ej: kg, litro, unidad"
            />
          </div>
        </div>

        <div class="form-group">
          <label for="producto-temporada" class="form-label">Temporada</label>
          <input
            id="producto-temporada"
            v-model="form.temporada"
            type="text"
            placeholder="Ej: Todo el año, Noviembre-Marzo"
          />
        </div>

        <div class="form-group toggle-group">
          <label class="toggle-switch">
            <input type="checkbox" v-model="form.disponible" />
            <span class="slider"></span>
          </label>
          <div class="toggle-text">
            <span class="toggle-title">Disponible</span>
            <p class="toggle-desc">Los productos no disponibles se ocultan al público.</p>
          </div>
        </div>
      </div>

      <div class="producto-form-imagen">
        <ImageUploader
          :current-image-path="form.foto_url"
          @archivo-seleccionado="handleArchivoSeleccionado"
          @quitar="handleQuitarImagen"
        />
      </div>
    </div>

    <div class="producto-form-actions">
      <button type="button" class="btn btn-outline" :disabled="loading" @click="emit('cancelar')">
        Cancelar
      </button>
      <button type="submit" class="btn btn-primary" :disabled="loading">
        {{ producto ? 'Guardar producto' : 'Agregar producto' }}
      </button>
    </div>
  </form>
</template>

<style scoped>
.producto-form {
  background-color: var(--bg-secondary);
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-xl);
  padding: var(--spacing-5);
  margin-bottom: var(--spacing-5);
}

.producto-form-title {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-4);
}

.producto-form-grid {
  display: grid;
  grid-template-columns: 1fr 260px;
  gap: var(--spacing-6);
  align-items: start;
}

@media (max-width: 768px) {
  .producto-form-grid {
    grid-template-columns: 1fr;
  }
}

.producto-form-campos {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-4);
}

@media (max-width: 480px) {
  .form-row-2 {
    grid-template-columns: 1fr;
  }
}

.form-label {
  font-weight: 600;
  font-size: var(--font-size-sm);
  color: var(--text-primary);
}

.form-label.required::after {
  content: ' *';
  color: var(--color-error);
}

.input-error {
  border-color: var(--color-error) !important;
}

.error-msg {
  color: var(--color-error);
  font-size: var(--font-size-xs);
  font-weight: 500;
}

/* Switch de disponibilidad: mismo tratamiento que el de "Perfil Activo". */
.toggle-group {
  flex-direction: row;
  align-items: center;
  gap: var(--spacing-4);
  padding: var(--spacing-3);
  background-color: var(--color-primary-50);
  border: 1px solid var(--color-primary-200);
  border-radius: var(--radius-md);
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  flex-shrink: 0;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background-color: var(--color-neutral-300);
  transition: var(--transition-normal);
  border-radius: var(--radius-full);
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 4px;
  bottom: 4px;
  background-color: var(--text-inverse);
  transition: var(--transition-normal);
  border-radius: var(--radius-full);
}

input:checked + .slider {
  background-color: var(--color-primary-600);
}

input:checked + .slider:before {
  transform: translateX(20px);
}

.toggle-text {
  display: flex;
  flex-direction: column;
}

.toggle-title {
  font-weight: 600;
  font-size: var(--font-size-sm);
  color: var(--color-primary-900);
}

.toggle-desc {
  font-size: var(--font-size-xs);
  color: var(--color-primary-800);
  opacity: 0.8;
  margin: 0;
}

.producto-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-3);
  margin-top: var(--spacing-5);
}

.btn {
  padding: var(--spacing-2) var(--spacing-5);
  font-size: var(--font-size-sm);
  border-radius: var(--radius-full);
  font-weight: 600;
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

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
```

- [ ] **Step 6: Crear `ProductosDestacadosPanel.vue`**

Crear `src/components/admin/ProductosDestacadosPanel.vue`:

```vue
<!--
  ProductosDestacadosPanel.vue - Productos destacados de un productor (admin).

  Lista los productos con miniatura, precio y disponibilidad, y despliega
  ProductoDestacadoForm para agregar o editar. Solo se usa en modo edición
  de un productor ya guardado (necesita su id).

  Props:
  - productorId (String): id del productor dueño de los productos
-->
<script setup>
import { onMounted, ref } from 'vue'
import { useProductosDestacados } from '@/composables/useProductosDestacados'
import { useToast } from '@/composables/useToast'
import { getPublicImageUrl } from '@/lib/supabase'
import { formatearPrecio } from '@/utils/precio'
import ProductoDestacadoForm from './ProductoDestacadoForm.vue'

const props = defineProps({
  productorId: {
    type: String,
    required: true,
  },
})

const {
  productos,
  loading,
  error,
  fetchProductos,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
} = useProductosDestacados()
const { mostrarExito, mostrarError } = useToast()

// null = formulario cerrado; { } = alta; { id, ... } = edición
const productoEnEdicion = ref(null)
const formularioAbierto = ref(false)

onMounted(() => {
  fetchProductos(props.productorId)
})

function abrirAlta() {
  productoEnEdicion.value = null
  formularioAbierto.value = true
}

function abrirEdicion(producto) {
  productoEnEdicion.value = producto
  formularioAbierto.value = true
}

function cerrarFormulario() {
  formularioAbierto.value = false
  productoEnEdicion.value = null
}

async function handleGuardar(datos) {
  const enEdicion = productoEnEdicion.value
  const resultado = enEdicion
    ? await actualizarProducto(enEdicion.id, datos)
    : await crearProducto(props.productorId, datos)

  if (!resultado) {
    mostrarError(error.value || 'No se pudo guardar el producto.')
    return
  }

  mostrarExito(enEdicion ? 'Producto actualizado.' : 'Producto agregado.')
  cerrarFormulario()
  await fetchProductos(props.productorId)
}

async function handleEliminar(producto) {
  const confirmado = window.confirm(`¿Eliminar el producto "${producto.nombre}"?`)
  if (!confirmado) return

  const ok = await eliminarProducto(producto.id)
  if (ok) {
    mostrarExito('Producto eliminado.')
  } else {
    mostrarError(error.value || 'No se pudo eliminar el producto.')
  }
}
</script>

<template>
  <section class="productos-panel">
    <header class="productos-header">
      <div>
        <h3 class="productos-title">Productos destacados</h3>
        <p class="productos-subtitle">
          Aparecen en la página pública del productor. Los no disponibles se ocultan.
        </p>
      </div>
      <button
        v-if="!formularioAbierto"
        type="button"
        class="btn-agregar"
        @click="abrirAlta"
      >
        ➕ Agregar producto
      </button>
    </header>

    <ProductoDestacadoForm
      v-if="formularioAbierto"
      :producto="productoEnEdicion"
      :loading="loading"
      @guardar="handleGuardar"
      @cancelar="cerrarFormulario"
    />

    <p v-if="error && productos.length === 0" class="productos-error">⚠️ {{ error }}</p>

    <ul v-if="productos.length" class="productos-lista">
      <li v-for="p in productos" :key="p.id" class="producto-fila">
        <div class="producto-miniatura">
          <img v-if="p.foto_url" :src="getPublicImageUrl(p.foto_url)" :alt="p.nombre" />
          <span v-else>🧺</span>
        </div>

        <div class="producto-datos">
          <span class="producto-nombre">{{ p.nombre }}</span>
          <span v-if="formatearPrecio(p.precio_referencia, p.unidad)" class="producto-precio">
            {{ formatearPrecio(p.precio_referencia, p.unidad) }}
          </span>
        </div>

        <span :class="['producto-estado', p.disponible ? 'estado-si' : 'estado-no']">
          {{ p.disponible ? 'Disponible' : 'No disponible' }}
        </span>

        <div class="producto-acciones">
          <button type="button" class="btn-action btn-edit" @click="abrirEdicion(p)">
            ✏️ Editar
          </button>
          <button type="button" class="btn-action btn-delete" @click="handleEliminar(p)">
            🗑️ Eliminar
          </button>
        </div>
      </li>
    </ul>

    <p v-else-if="!loading && !error" class="productos-vacio">
      Este productor aún no tiene productos destacados.
    </p>
  </section>
</template>

<style scoped>
.productos-panel {
  background-color: var(--bg-surface);
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  padding: var(--spacing-6);
}

.productos-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-5);
}

.productos-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.productos-subtitle {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  margin: var(--spacing-1) 0 0;
}

.btn-agregar {
  flex-shrink: 0;
  padding: var(--spacing-2) var(--spacing-5);
  background-color: var(--color-primary-600);
  color: var(--text-inverse);
  border-radius: var(--radius-full);
  font-weight: 600;
  font-size: var(--font-size-sm);
}

.btn-agregar:hover {
  background-color: var(--color-primary-700);
}

.productos-error {
  color: var(--color-error);
  font-size: var(--font-size-sm);
  font-weight: 500;
}

.productos-lista {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.producto-fila {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
  padding: var(--spacing-3);
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-md);
  background-color: var(--bg-primary);
}

.producto-miniatura {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border-radius: var(--radius-md);
  overflow: hidden;
  background-color: var(--bg-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.producto-miniatura img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.producto-datos {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.producto-nombre {
  font-weight: 600;
  font-size: var(--font-size-sm);
  color: var(--text-primary);
}

.producto-precio {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.producto-estado {
  font-size: var(--font-size-xs);
  font-weight: 600;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  white-space: nowrap;
}

/* Mismos colores de estado que la tabla de productores. */
.estado-si {
  background-color: var(--color-warm-100);
  color: var(--color-warm-800);
}

.estado-no {
  background-color: var(--color-neutral-200);
  color: var(--color-neutral-600);
}

.producto-acciones {
  display: inline-flex;
  gap: var(--spacing-2);
}

.btn-action {
  padding: 6px 12px;
  font-size: var(--font-size-xs);
  font-weight: 500;
  border-radius: var(--radius-md);
}

.btn-edit {
  background-color: var(--color-primary-100);
  color: var(--color-primary-700);
}

.btn-edit:hover {
  background-color: var(--color-primary-200);
}

.btn-delete {
  background-color: #fee2e2;
  color: #991b1b;
}

.btn-delete:hover {
  background-color: #fca5a5;
}

.productos-vacio {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

@media (max-width: 640px) {
  .producto-fila {
    flex-wrap: wrap;
  }

  .producto-acciones {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
```

- [ ] **Step 7: Montar el panel en `ProducerForm.vue`**

En el `<script setup>`, agregar el import junto al de `ImageUploader`:

```js
import ProductosDestacadosPanel from './ProductosDestacadosPanel.vue'
```

En el `<template>`, envolver el `<form>` existente en un `<div class="producer-form-layout">` y agregar el panel **después** del cierre del `</form>`. Es decir, la primera línea de la plantilla pasa de:

```vue
  <form @submit.prevent="onSubmit" class="producer-form-card">
```

a:

```vue
  <div class="producer-form-layout">
    <form @submit.prevent="onSubmit" class="producer-form-card">
```

y el final de la plantilla, después de `</form>`, queda así:

```vue
    </form>

    <!-- Solo con el productor ya guardado: los productos necesitan su id. -->
    <ProductosDestacadosPanel
      v-if="initialData?.id"
      :productor-id="initialData.id"
    />
    <p v-else class="productos-hint">
      💡 Podrá agregar los productos destacados de este productor después de guardarlo.
    </p>
  </div>
```

> Reindentar el contenido del `<form>` no es necesario; lo único indispensable es que el `<form>` quede cerrado antes del panel y que todo cuelgue del `<div class="producer-form-layout">`.

Agregar al final del `<style scoped>`:

```css
/* El panel de productos va FUERA del <form> (anidar formularios es HTML
   inválido), así que la raíz del componente es este contenedor. */
.producer-form-layout {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6);
}

.productos-hint {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  background-color: var(--color-primary-50);
  border: 1px solid var(--color-primary-200);
  border-radius: var(--radius-xl);
  padding: var(--spacing-4);
  margin: 0;
}
```

- [ ] **Step 8: Verificar en el navegador**

Run: `npm run dev`

1. `http://localhost:5173/admin/productores/nuevo` — debe aparecer el recuadro con el texto "Podrá agregar los productos destacados... después de guardarlo" y **ningún** panel de productos.
2. `http://localhost:5173/admin/productores/<id>/editar` — debe aparecer el panel "Productos destacados" debajo del formulario.
3. En el panel: **Agregar producto** → nombre "Queso de prueba", precio `2500`, unidad `kg`, una imagen → **Agregar producto**. Debe aparecer un toast de éxito y la fila en la lista con la miniatura y `₡2500 / kg`.
4. **Editar** esa fila → cambiar el nombre → **Guardar producto**: la lista se actualiza.
5. Apagar el switch **Disponible** y guardar: la etiqueta pasa a "No disponible".
6. **Eliminar** la fila → confirmar: desaparece con toast de éxito.
7. Guardar el formulario del productor (botón **Guardar Cambios**): debe seguir funcionando y redirigir al panel — señal de que no se anidaron formularios.

Detener el servidor con `Ctrl+C`.

- [ ] **Step 9: Verificar tests y build**

Run: `npm test`
Expected: PASS — 101 tests (95 + 6 de `precio`).

Run: `npm run build`
Expected: termina sin errores.

- [ ] **Step 10: Commit**

```bash
git add src/utils/precio.js tests/utils/precio.test.js src/components/admin/ProductoDestacadoForm.vue src/components/admin/ProductosDestacadosPanel.vue src/components/admin/ProducerForm.vue
git commit -m "feat(productos): gestión de productos destacados en el formulario de productor

Panel con lista, alta, edición y borrado; solo visible al editar un
productor ya guardado. El panel va fuera del <form> para no anidarlos.
"
```

---

### Tarea 3: Productos destacados en la vista pública de detalle

Spec §2.3. La grilla va **debajo** de `.detail-layout`, dentro de `.detail-content`, para heredar la regla `.detail-content > *:not(.detail-glow) { position: relative; z-index: 1; }` y quedar por encima del resplandor decorativo. Solo se muestran los productos con `disponible = true`; la carga es independiente de `fetchProductorById` (no se toca `useProductores.js`).

**Files:**
- Create: `src/components/producers/ProductosDestacadosGrid.vue`
- Modify: `src/views/ProducerDetailView.vue`
- Test: no aplica (componente de presentación; la lógica de datos ya está cubierta en la Tarea 1 y el formato de precio en la Tarea 2)

**Interfaces:**
- Consumes: `useProductosDestacados()` → `{ productos, fetchProductos }` (Tarea 1); `formatearPrecio(monto, unidad)` de `@/utils/precio` (Tarea 2); `getPublicImageUrl(path)` de `@/lib/supabase`.
- Produces: `ProductosDestacadosGrid.vue` con prop `productos` (Array, default `() => []`). Sin emits. El filtrado por `disponible` lo hace la vista antes de pasar la lista.

- [ ] **Step 1: Crear la grilla pública**

Crear `src/components/producers/ProductosDestacadosGrid.vue`:

```vue
<!--
  ProductosDestacadosGrid.vue - Productos de un productor en su página pública.

  Mismo tratamiento visual que ProducerCard.vue (tarjeta con foto arriba,
  radio grande y sombra suave), pero sin enlace: los productos no tienen
  página propia.

  Props:
  - productos (Array): productos ya filtrados por disponibilidad
-->
<script setup>
import { getPublicImageUrl } from '@/lib/supabase'
import { formatearPrecio } from '@/utils/precio'

defineProps({
  /** Productos disponibles a mostrar */
  productos: {
    type: Array,
    default: () => [],
  },
})
</script>

<template>
  <section class="productos-seccion">
    <h2 class="productos-titulo">Productos destacados</h2>

    <div class="productos-grid">
      <article v-for="producto in productos" :key="producto.id" class="producto-card">
        <div class="producto-imagen">
          <img
            v-if="producto.foto_url"
            :src="getPublicImageUrl(producto.foto_url)"
            :alt="`Imagen de ${producto.nombre}`"
            class="producto-img"
            loading="lazy"
          />
          <div v-else class="producto-img-placeholder">🧺</div>
        </div>

        <div class="producto-body">
          <h3 class="producto-nombre">{{ producto.nombre }}</h3>

          <p v-if="formatearPrecio(producto.precio_referencia, producto.unidad)" class="producto-precio">
            {{ formatearPrecio(producto.precio_referencia, producto.unidad) }}
          </p>

          <p v-if="producto.descripcion" class="producto-descripcion">
            {{ producto.descripcion }}
          </p>

          <span v-if="producto.temporada" class="producto-temporada">
            🗓️ {{ producto.temporada }}
          </span>
        </div>
      </article>
    </div>

    <p class="productos-nota">Los precios son de referencia; confirme con el productor.</p>
  </section>
</template>

<style scoped>
.productos-seccion {
  margin-top: 3rem;
}

.productos-titulo {
  font-family: var(--font-headline);
  font-size: var(--font-size-2xl);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 1.25rem;
}

.productos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.5rem;
}

.producto-card {
  display: flex;
  flex-direction: column;
  background: var(--bg-surface);
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(43, 32, 22, 0.06);
  transition: transform var(--transition-normal), box-shadow var(--transition-normal);
}

.producto-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(43, 32, 22, 0.12);
}

.producto-imagen {
  aspect-ratio: 16 / 10;
  overflow: hidden;
  background-color: var(--bg-muted);
}

.producto-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.producto-img-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  background-color: var(--bg-muted);
}

.producto-body {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 1rem;
}

.producto-nombre {
  font-family: var(--font-headline);
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.producto-precio {
  font-weight: 600;
  font-size: var(--font-size-sm);
  color: var(--color-primary-600);
  margin: 0;
}

.producto-descripcion {
  font-size: var(--font-size-sm);
  line-height: 1.5;
  color: var(--text-secondary);
  margin: 0;
}

.producto-temporada {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.productos-nota {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  margin-top: 1rem;
}
</style>
```

- [ ] **Step 2: Cargar los productos en `ProducerDetailView.vue`**

En el `<script setup>`, agregar los imports:

```js
import { computed, ref, onMounted } from 'vue'
```

(la línea actual `import { ref, onMounted } from 'vue'` pasa a incluir `computed`), y junto a los demás imports de componentes/composables:

```js
import { useProductosDestacados } from '@/composables/useProductosDestacados'
import ProductosDestacadosGrid from '@/components/producers/ProductosDestacadosGrid.vue'
```

Debajo de `const { loading, error, fetchProductorById } = useProductores()`:

```js
// Los productos se cargan aparte del productor: así el detalle se muestra
// aunque esta consulta falle, y useProductores no necesita saber de ellos.
const { productos, fetchProductos } = useProductosDestacados()

/** Al público solo se le muestran los productos marcados como disponibles. */
const productosDisponibles = computed(() =>
  productos.value.filter((p) => p.disponible)
)
```

Reemplazar el `onMounted` actual por:

```js
onMounted(async () => {
  const data = await fetchProductorById(route.params.id)
  if (data) {
    producer.value = data
    fetchProductos(data.id)
  } else {
    // Si no se encontró el productor, redirigir al inicio
    router.push({ name: 'home' })
  }
})
```

- [ ] **Step 3: Renderizar la grilla**

En el `<template>`, dentro de `<article class="detail-content">`, justo **después** del `</div>` que cierra `.detail-layout` y **antes** del `</article>`:

```vue
      <!-- Productos destacados: solo si hay alguno disponible al público -->
      <ProductosDestacadosGrid
        v-if="productosDisponibles.length"
        :productos="productosDisponibles"
      />
```

- [ ] **Step 4: Verificar en el navegador**

Run: `npm run dev`

1. Abrir `http://localhost:5173/productor/<id>` de un productor **sin** productos: la página se ve exactamente igual que antes, sin título "Productos destacados".
2. Abrir el detalle del productor al que se le agregaron productos en la Tarea 2: la sección aparece debajo de los datos de contacto y del botón de WhatsApp, con la tarjeta, el precio en barro (`--color-primary-600`) y la temporada.
3. Marcar un producto como **no disponible** desde el admin y recargar el detalle público: ese producto desaparece de la grilla.
4. Marcar **todos** como no disponibles: la sección completa desaparece.
5. Reducir la ventana a 375 px: las tarjetas pasan a una columna y no hay desbordamiento horizontal.

Detener el servidor con `Ctrl+C`.

- [ ] **Step 5: Verificar tests y build**

Run: `npm test`
Expected: PASS — 101 tests (sin cambios respecto a la Tarea 2).

Run: `npm run build`
Expected: termina sin errores.

- [ ] **Step 6: Commit**

```bash
git add src/components/producers/ProductosDestacadosGrid.vue src/views/ProducerDetailView.vue
git commit -m "feat(productos): mostrar los productos destacados en el detalle público

Grilla debajo de la ficha del productor, solo con los productos
disponibles y cargada de forma independiente del productor.
"
```

---

### Tarea 4: Escritura de catálogos en `useCatalogos`

Spec §3.1. Seis funciones nuevas. Las dos de borrado comprueban primero si el valor está en uso y devuelven un mensaje claro en vez de dejar que falle la clave foránea con un error críptico de Postgres.

De paso, `fetchCategorias` pasa a traer también la columna `icono`: el panel de catálogos necesita mostrarla y editarla, y `ProducerForm.vue` ya la usaba (`cat.icono || '🌾'`) sin que nunca llegara.

**Files:**
- Modify: `src/composables/useCatalogos.js`
- Test: `tests/composables/useCatalogos.test.js` (nuevo)

**Interfaces:**
- Consumes: `supabase` de `@/lib/supabase`.
- Produces: `useCatalogos()` devuelve, además de lo ya existente (`cantones`, `categorias`, `loading`, `error`, `fetchCantones`, `fetchCategorias`):
  - `crearCategoria(nombre, icono) → Promise<Object|null>` — la fila creada `{ id, nombre, icono }` o `null`.
  - `crearCanton(nombre) → Promise<Object|null>` — `{ id, nombre }` o `null`.
  - `renombrarCategoria(id, nombre) → Promise<Object|null>`.
  - `renombrarCanton(id, nombre) → Promise<Object|null>`.
  - `eliminarCategoria(id) → Promise<boolean>`.
  - `eliminarCanton(id) → Promise<boolean>`.
  - En todos los casos, si falla, el motivo queda en `error.value`.
  - `fetchCategorias()` ahora trae `id, nombre, icono`.

- [ ] **Step 1: Escribir los tests**

Crear `tests/composables/useCatalogos.test.js`:

```js
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockRef = vi.hoisted(() => ({ actual: null }))

vi.mock('@/lib/supabase', async () => {
  const { crearSupabaseMock } = await import('../helpers/supabaseMock.js')
  mockRef.actual = crearSupabaseMock()
  return { supabase: mockRef.actual.supabase }
})

import { useCatalogos } from '@/composables/useCatalogos'

describe('useCatalogos', () => {
  beforeEach(() => {
    mockRef.actual.reiniciar()
  })

  describe('crearCategoria', () => {
    it('inserta nombre e icono recortados y agrega la fila en orden alfabético', async () => {
      mockRef.actual.responder('categorias', { data: { id: 'c2', nombre: 'Lácteos', icono: '🥛' }, error: null })
      const { crearCategoria, categorias } = useCatalogos()
      categorias.value = [{ id: 'c1', nombre: 'Verduras', icono: '🥬' }]

      const creada = await crearCategoria('  Lácteos  ', ' 🥛 ')

      const [consulta] = mockRef.actual.consultasDe('categorias')
      expect(consulta.insert).toHaveBeenCalledWith({ nombre: 'Lácteos', icono: '🥛' })
      expect(creada).toEqual({ id: 'c2', nombre: 'Lácteos', icono: '🥛' })
      expect(categorias.value.map((c) => c.nombre)).toEqual(['Lácteos', 'Verduras'])
    })

    it('un nombre vacío no llega a Supabase y deja el error', async () => {
      const { crearCategoria, error } = useCatalogos()
      const creada = await crearCategoria('   ')

      expect(creada).toBeNull()
      expect(mockRef.actual.consultasDe('categorias')).toHaveLength(0)
      expect(error.value).toBe('El nombre de la categoría es obligatorio.')
    })

    it('un icono vacío se guarda como null', async () => {
      mockRef.actual.responder('categorias', { data: { id: 'c2', nombre: 'Miel', icono: null }, error: null })
      const { crearCategoria } = useCatalogos()
      await crearCategoria('Miel', '')

      const [consulta] = mockRef.actual.consultasDe('categorias')
      expect(consulta.insert).toHaveBeenCalledWith({ nombre: 'Miel', icono: null })
    })

    it('expone el error de Supabase (por ejemplo, nombre duplicado)', async () => {
      mockRef.actual.responder('categorias', { data: null, error: { message: 'duplicate key value' } })
      const { crearCategoria, error } = useCatalogos()
      const creada = await crearCategoria('Miel')

      expect(creada).toBeNull()
      expect(error.value).toBe('duplicate key value')
    })
  })

  describe('renombrarCategoria', () => {
    it('actualiza por id y reemplaza la fila en la lista', async () => {
      mockRef.actual.responder('categorias', { data: { id: 'c1', nombre: 'Hortalizas', icono: '🥬' }, error: null })
      const { renombrarCategoria, categorias } = useCatalogos()
      categorias.value = [{ id: 'c1', nombre: 'Verduras', icono: '🥬' }]

      await renombrarCategoria('c1', '  Hortalizas ')

      const [consulta] = mockRef.actual.consultasDe('categorias')
      expect(consulta.update).toHaveBeenCalledWith({ nombre: 'Hortalizas' })
      expect(consulta.eq).toHaveBeenCalledWith('id', 'c1')
      expect(categorias.value).toEqual([{ id: 'c1', nombre: 'Hortalizas', icono: '🥬' }])
    })
  })

  describe('eliminarCategoria', () => {
    it('no elimina si hay productores usándola y explica cuántos', async () => {
      mockRef.actual.responder('productor_categorias', { data: null, count: 3, error: null })
      const { eliminarCategoria, error, categorias } = useCatalogos()
      categorias.value = [{ id: 'c1', nombre: 'Verduras' }]

      const ok = await eliminarCategoria('c1')

      expect(ok).toBe(false)
      expect(error.value).toBe('No se puede eliminar: 3 productores usan esta categoría.')
      expect(mockRef.actual.consultasDe('categorias')).toHaveLength(0)
      expect(categorias.value).toHaveLength(1)
    })

    it('elimina y quita la fila cuando no está en uso', async () => {
      mockRef.actual.responder('productor_categorias', { data: null, count: 0, error: null })
      mockRef.actual.responder('categorias', { data: null, error: null })
      const { eliminarCategoria, categorias } = useCatalogos()
      categorias.value = [{ id: 'c1', nombre: 'Verduras' }, { id: 'c2', nombre: 'Miel' }]

      const ok = await eliminarCategoria('c1')

      expect(ok).toBe(true)
      const [consulta] = mockRef.actual.consultasDe('categorias')
      expect(consulta.delete).toHaveBeenCalled()
      expect(consulta.eq).toHaveBeenCalledWith('id', 'c1')
      expect(categorias.value).toEqual([{ id: 'c2', nombre: 'Miel' }])
    })
  })

  describe('crearCanton', () => {
    it('inserta el nombre recortado y lo agrega en orden', async () => {
      mockRef.actual.responder('cantones', { data: { id: 'k2', nombre: 'Carrillo' }, error: null })
      const { crearCanton, cantones } = useCatalogos()
      cantones.value = [{ id: 'k1', nombre: 'Nicoya' }]

      await crearCanton('  Carrillo ')

      const [consulta] = mockRef.actual.consultasDe('cantones')
      expect(consulta.insert).toHaveBeenCalledWith({ nombre: 'Carrillo' })
      expect(cantones.value.map((c) => c.nombre)).toEqual(['Carrillo', 'Nicoya'])
    })

    it('un nombre vacío no llega a Supabase', async () => {
      const { crearCanton, error } = useCatalogos()
      const creado = await crearCanton('  ')
      expect(creado).toBeNull()
      expect(mockRef.actual.consultasDe('cantones')).toHaveLength(0)
      expect(error.value).toBe('El nombre del cantón es obligatorio.')
    })
  })

  describe('renombrarCanton', () => {
    it('actualiza por id y reemplaza la fila', async () => {
      mockRef.actual.responder('cantones', { data: { id: 'k1', nombre: 'Nicoya Centro' }, error: null })
      const { renombrarCanton, cantones } = useCatalogos()
      cantones.value = [{ id: 'k1', nombre: 'Nicoya' }]

      await renombrarCanton('k1', 'Nicoya Centro')

      const [consulta] = mockRef.actual.consultasDe('cantones')
      expect(consulta.update).toHaveBeenCalledWith({ nombre: 'Nicoya Centro' })
      expect(cantones.value).toEqual([{ id: 'k1', nombre: 'Nicoya Centro' }])
    })
  })

  describe('eliminarCanton', () => {
    it('no elimina si hay productores en ese cantón', async () => {
      mockRef.actual.responder('productores', { data: null, count: 2, error: null })
      const { eliminarCanton, error } = useCatalogos()

      const ok = await eliminarCanton('k1')

      expect(ok).toBe(false)
      expect(error.value).toBe('No se puede eliminar: 2 productores están en este cantón.')
      expect(mockRef.actual.consultasDe('cantones')).toHaveLength(0)
    })

    it('elimina y quita la fila cuando no está en uso', async () => {
      mockRef.actual.responder('productores', { data: null, count: 0, error: null })
      mockRef.actual.responder('cantones', { data: null, error: null })
      const { eliminarCanton, cantones } = useCatalogos()
      cantones.value = [{ id: 'k1', nombre: 'Nicoya' }]

      const ok = await eliminarCanton('k1')

      expect(ok).toBe(true)
      expect(cantones.value).toEqual([])
    })
  })
})
```

- [ ] **Step 2: Ejecutar y ver fallar**

Run: `npm test -- tests/composables/useCatalogos.test.js`
Expected: FAIL — `crearCategoria is not a function` (y equivalentes).

- [ ] **Step 3: Extender `useCatalogos.js`**

Agregar, justo debajo de los `import`:

```js
/** Ordena una lista de catálogo por nombre, como lo hace la consulta. */
function ordenarPorNombre(lista) {
  return [...lista].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
}
```

Dentro de `useCatalogos()`, después de la declaración de `error`, agregar el envoltorio compartido:

```js
  /**
   * Envuelve una operación de escritura con loading/error.
   * Devuelve `valorSiFalla` si lanza, dejando el motivo en `error`.
   */
  async function ejecutar(operacion, valorSiFalla) {
    loading.value = true
    error.value = null
    try {
      return await operacion()
    } catch (err) {
      error.value = err?.message || 'Ocurrió un error inesperado'
      console.error('[useCatalogos]', err)
      return valorSiFalla
    } finally {
      loading.value = false
    }
  }
```

En `fetchCategorias`, cambiar `.select('id, nombre')` por:

```js
        .select('id, nombre, icono')
```

(El panel de catálogos edita el icono y `ProducerForm.vue` ya lo mostraba; hasta ahora nunca llegaba del servidor.)

Antes del `return` final, agregar las seis funciones:

```js
  /**
   * Crea una categoría.
   * @param {string} nombre
   * @param {string} [icono] - Emoji opcional
   * @returns {Promise<Object|null>}
   */
  function crearCategoria(nombre, icono = '') {
    return ejecutar(async () => {
      const limpio = (nombre ?? '').trim()
      if (!limpio) throw new Error('El nombre de la categoría es obligatorio.')

      const { data, error: insertError } = await supabase
        .from('categorias')
        .insert({ nombre: limpio, icono: (icono ?? '').trim() || null })
        .select('id, nombre, icono')
        .single()
      if (insertError) throw insertError

      categorias.value = ordenarPorNombre([...categorias.value, data])
      return data
    }, null)
  }

  /**
   * Cambia el nombre de una categoría.
   * @returns {Promise<Object|null>}
   */
  function renombrarCategoria(id, nombre) {
    return ejecutar(async () => {
      const limpio = (nombre ?? '').trim()
      if (!limpio) throw new Error('El nombre de la categoría es obligatorio.')

      const { data, error: updateError } = await supabase
        .from('categorias')
        .update({ nombre: limpio })
        .eq('id', id)
        .select('id, nombre, icono')
        .single()
      if (updateError) throw updateError

      categorias.value = ordenarPorNombre(
        categorias.value.map((c) => (c.id === id ? data : c))
      )
      return data
    }, null)
  }

  /**
   * Elimina una categoría, salvo que algún productor la use.
   * Se comprueba antes para dar un mensaje entendible en vez del error
   * genérico de clave foránea de Postgres.
   * @returns {Promise<boolean>}
   */
  function eliminarCategoria(id) {
    return ejecutar(async () => {
      const { count, error: countError } = await supabase
        .from('productor_categorias')
        .select('productor_id', { count: 'exact', head: true })
        .eq('categoria_id', id)
      if (countError) throw countError

      const enUso = count ?? 0
      if (enUso > 0) {
        throw new Error(`No se puede eliminar: ${enUso} productores usan esta categoría.`)
      }

      const { error: deleteError } = await supabase.from('categorias').delete().eq('id', id)
      if (deleteError) throw deleteError

      categorias.value = categorias.value.filter((c) => c.id !== id)
      return true
    }, false)
  }

  /**
   * Crea un cantón.
   * @returns {Promise<Object|null>}
   */
  function crearCanton(nombre) {
    return ejecutar(async () => {
      const limpio = (nombre ?? '').trim()
      if (!limpio) throw new Error('El nombre del cantón es obligatorio.')

      const { data, error: insertError } = await supabase
        .from('cantones')
        .insert({ nombre: limpio })
        .select('id, nombre')
        .single()
      if (insertError) throw insertError

      cantones.value = ordenarPorNombre([...cantones.value, data])
      return data
    }, null)
  }

  /**
   * Cambia el nombre de un cantón.
   * @returns {Promise<Object|null>}
   */
  function renombrarCanton(id, nombre) {
    return ejecutar(async () => {
      const limpio = (nombre ?? '').trim()
      if (!limpio) throw new Error('El nombre del cantón es obligatorio.')

      const { data, error: updateError } = await supabase
        .from('cantones')
        .update({ nombre: limpio })
        .eq('id', id)
        .select('id, nombre')
        .single()
      if (updateError) throw updateError

      cantones.value = ordenarPorNombre(
        cantones.value.map((c) => (c.id === id ? data : c))
      )
      return data
    }, null)
  }

  /**
   * Elimina un cantón, salvo que algún productor esté asignado a él.
   * @returns {Promise<boolean>}
   */
  function eliminarCanton(id) {
    return ejecutar(async () => {
      const { count, error: countError } = await supabase
        .from('productores')
        .select('id', { count: 'exact', head: true })
        .eq('canton_id', id)
      if (countError) throw countError

      const enUso = count ?? 0
      if (enUso > 0) {
        throw new Error(`No se puede eliminar: ${enUso} productores están en este cantón.`)
      }

      const { error: deleteError } = await supabase.from('cantones').delete().eq('id', id)
      if (deleteError) throw deleteError

      cantones.value = cantones.value.filter((c) => c.id !== id)
      return true
    }, false)
  }
```

Y ampliar el `return` final:

```js
  return {
    // Estado reactivo
    cantones,
    categorias,
    loading,
    error,

    // Métodos
    fetchCantones,
    fetchCategorias,
    crearCategoria,
    renombrarCategoria,
    eliminarCategoria,
    crearCanton,
    renombrarCanton,
    eliminarCanton,
  }
```

- [ ] **Step 4: Ejecutar y ver pasar**

Run: `npm test -- tests/composables/useCatalogos.test.js`
Expected: PASS — 12 tests.

- [ ] **Step 5: Verificar que nada se rompió**

Run: `npm test`
Expected: PASS — 113 tests (101 + 12).

Run: `npm run build`
Expected: termina sin errores.

- [ ] **Step 6: Commit**

```bash
git add src/composables/useCatalogos.js tests/composables/useCatalogos.test.js
git commit -m "feat(catalogos): crear, renombrar y eliminar categorías y cantones

Las eliminaciones comprueban primero si el valor está en uso y devuelven
un mensaje entendible. fetchCategorias ahora trae también el icono.
"
```

---

### Tarea 5: Panel de catálogos en el panel de administración

Spec §3.2. Dos listas lado a lado (categorías / cantones) embebidas como una sección más de `AdminDashboardView.vue` — **sin ruta nueva y sin ítem de barra lateral**.

**Files:**
- Create: `src/components/admin/CatalogosPanel.vue`
- Modify: `src/views/admin/AdminDashboardView.vue`
- Test: no aplica (la lógica está cubierta por `tests/composables/useCatalogos.test.js`)

**Interfaces:**
- Consumes: `useCatalogos()` → `{ cantones, categorias, loading, error, fetchCantones, fetchCategorias, crearCategoria, renombrarCategoria, eliminarCategoria, crearCanton, renombrarCanton, eliminarCanton }` (Tarea 4); `useToast()` → `{ mostrarExito, mostrarError }`.
- Produces: `CatalogosPanel.vue`, sin props ni emits (se carga a sí mismo en `onMounted`).

- [ ] **Step 1: Crear `CatalogosPanel.vue`**

Crear `src/components/admin/CatalogosPanel.vue`:

```vue
<!--
  CatalogosPanel.vue - Gestión de categorías y cantones desde el panel admin.

  Dos listas independientes con alta, renombrado en línea y borrado.
  Disponible para cualquier administrador (editor o superadmin).
-->
<script setup>
import { onMounted, ref } from 'vue'
import { useCatalogos } from '@/composables/useCatalogos'
import { useToast } from '@/composables/useToast'

const {
  cantones,
  categorias,
  error,
  fetchCantones,
  fetchCategorias,
  crearCategoria,
  renombrarCategoria,
  eliminarCategoria,
  crearCanton,
  renombrarCanton,
  eliminarCanton,
} = useCatalogos()
const { mostrarExito, mostrarError } = useToast()

// Formularios de alta
const nuevaCategoria = ref('')
const nuevoIcono = ref('')
const nuevoCanton = ref('')

// Renombrado en línea: id de la fila en edición y el texto provisional
const categoriaEditandoId = ref(null)
const cantonEditandoId = ref(null)
const nombreEditado = ref('')

onMounted(() => {
  fetchCategorias()
  fetchCantones()
})

// --- Categorías ---
async function agregarCategoria() {
  const creada = await crearCategoria(nuevaCategoria.value, nuevoIcono.value)
  if (!creada) {
    mostrarError(error.value || 'No se pudo crear la categoría.')
    return
  }
  nuevaCategoria.value = ''
  nuevoIcono.value = ''
  mostrarExito('Categoría creada.')
}

function empezarEdicionCategoria(categoria) {
  cantonEditandoId.value = null
  categoriaEditandoId.value = categoria.id
  nombreEditado.value = categoria.nombre
}

async function guardarCategoria(id) {
  const actualizada = await renombrarCategoria(id, nombreEditado.value)
  if (!actualizada) {
    mostrarError(error.value || 'No se pudo renombrar la categoría.')
    return
  }
  categoriaEditandoId.value = null
  mostrarExito('Categoría renombrada.')
}

async function borrarCategoria(categoria) {
  const confirmado = window.confirm(`¿Eliminar la categoría "${categoria.nombre}"?`)
  if (!confirmado) return

  const ok = await eliminarCategoria(categoria.id)
  if (ok) {
    mostrarExito('Categoría eliminada.')
  } else {
    mostrarError(error.value || 'No se pudo eliminar la categoría.')
  }
}

// --- Cantones ---
async function agregarCanton() {
  const creado = await crearCanton(nuevoCanton.value)
  if (!creado) {
    mostrarError(error.value || 'No se pudo crear el cantón.')
    return
  }
  nuevoCanton.value = ''
  mostrarExito('Cantón creado.')
}

function empezarEdicionCanton(canton) {
  categoriaEditandoId.value = null
  cantonEditandoId.value = canton.id
  nombreEditado.value = canton.nombre
}

async function guardarCanton(id) {
  const actualizado = await renombrarCanton(id, nombreEditado.value)
  if (!actualizado) {
    mostrarError(error.value || 'No se pudo renombrar el cantón.')
    return
  }
  cantonEditandoId.value = null
  mostrarExito('Cantón renombrado.')
}

async function borrarCanton(canton) {
  const confirmado = window.confirm(`¿Eliminar el cantón "${canton.nombre}"?`)
  if (!confirmado) return

  const ok = await eliminarCanton(canton.id)
  if (ok) {
    mostrarExito('Cantón eliminado.')
  } else {
    mostrarError(error.value || 'No se pudo eliminar el cantón.')
  }
}

function cancelarEdicion() {
  categoriaEditandoId.value = null
  cantonEditandoId.value = null
  nombreEditado.value = ''
}
</script>

<template>
  <section class="catalogos-panel">
    <header class="catalogos-header">
      <h2 class="catalogos-title">Categorías y cantones</h2>
      <p class="catalogos-subtitle">
        Alimentan los filtros del directorio y el formulario de productores.
      </p>
    </header>

    <div class="catalogos-grid">
      <!-- Categorías -->
      <div class="catalogo-card">
        <h3 class="catalogo-card-title">Categorías de alimentos</h3>

        <form class="catalogo-alta" @submit.prevent="agregarCategoria">
          <input
            v-model="nuevoIcono"
            type="text"
            class="input-icono"
            maxlength="4"
            placeholder="🌾"
            aria-label="Icono de la categoría"
          />
          <input
            v-model="nuevaCategoria"
            type="text"
            placeholder="Nombre de la categoría"
            aria-label="Nombre de la categoría"
          />
          <button type="submit" class="btn-alta">Agregar</button>
        </form>

        <ul class="catalogo-lista">
          <li v-for="cat in categorias" :key="cat.id" class="catalogo-fila">
            <template v-if="categoriaEditandoId === cat.id">
              <input v-model="nombreEditado" type="text" aria-label="Nuevo nombre" />
              <div class="catalogo-acciones">
                <button type="button" class="btn-action btn-edit" @click="guardarCategoria(cat.id)">
                  Guardar
                </button>
                <button type="button" class="btn-action btn-cancel" @click="cancelarEdicion">
                  Cancelar
                </button>
              </div>
            </template>
            <template v-else>
              <span class="catalogo-nombre">
                <span class="catalogo-icono">{{ cat.icono || '🌾' }}</span>
                {{ cat.nombre }}
              </span>
              <div class="catalogo-acciones">
                <button type="button" class="btn-action btn-edit" @click="empezarEdicionCategoria(cat)">
                  ✏️ Renombrar
                </button>
                <button type="button" class="btn-action btn-delete" @click="borrarCategoria(cat)">
                  🗑️ Eliminar
                </button>
              </div>
            </template>
          </li>
        </ul>

        <p v-if="!categorias.length" class="catalogo-vacio">Aún no hay categorías.</p>
      </div>

      <!-- Cantones -->
      <div class="catalogo-card">
        <h3 class="catalogo-card-title">Cantones</h3>

        <form class="catalogo-alta" @submit.prevent="agregarCanton">
          <input
            v-model="nuevoCanton"
            type="text"
            placeholder="Nombre del cantón"
            aria-label="Nombre del cantón"
          />
          <button type="submit" class="btn-alta">Agregar</button>
        </form>

        <ul class="catalogo-lista">
          <li v-for="canton in cantones" :key="canton.id" class="catalogo-fila">
            <template v-if="cantonEditandoId === canton.id">
              <input v-model="nombreEditado" type="text" aria-label="Nuevo nombre" />
              <div class="catalogo-acciones">
                <button type="button" class="btn-action btn-edit" @click="guardarCanton(canton.id)">
                  Guardar
                </button>
                <button type="button" class="btn-action btn-cancel" @click="cancelarEdicion">
                  Cancelar
                </button>
              </div>
            </template>
            <template v-else>
              <span class="catalogo-nombre">📍 {{ canton.nombre }}</span>
              <div class="catalogo-acciones">
                <button type="button" class="btn-action btn-edit" @click="empezarEdicionCanton(canton)">
                  ✏️ Renombrar
                </button>
                <button type="button" class="btn-action btn-delete" @click="borrarCanton(canton)">
                  🗑️ Eliminar
                </button>
              </div>
            </template>
          </li>
        </ul>

        <p v-if="!cantones.length" class="catalogo-vacio">Aún no hay cantones.</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.catalogos-panel {
  margin-bottom: var(--spacing-8);
}

.catalogos-header {
  margin-bottom: var(--spacing-4);
}

.catalogos-title {
  font-family: var(--font-headline);
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.catalogos-subtitle {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: var(--spacing-1) 0 0;
}

.catalogos-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-4);
}

@media (max-width: 900px) {
  .catalogos-grid {
    grid-template-columns: 1fr;
  }
}

.catalogo-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
  padding: var(--spacing-5);
}

.catalogo-card-title {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-4);
}

.catalogo-alta {
  display: flex;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-4);
}

.catalogo-alta input {
  padding: var(--spacing-2) var(--spacing-3);
  font-size: var(--font-size-sm);
  border-radius: var(--radius-md);
}

.input-icono {
  width: 64px;
  flex-shrink: 0;
  text-align: center;
}

.btn-alta {
  flex-shrink: 0;
  padding: var(--spacing-2) var(--spacing-4);
  background-color: var(--color-primary-600);
  color: var(--text-inverse);
  border-radius: var(--radius-full);
  font-weight: 600;
  font-size: var(--font-size-sm);
}

.btn-alta:hover {
  background-color: var(--color-primary-700);
}

.catalogo-lista {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  max-height: 360px;
  overflow-y: auto;
}

.catalogo-fila {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-3);
  padding: var(--spacing-2) var(--spacing-3);
  border-bottom: 1px solid var(--color-neutral-200);
}

.catalogo-fila:last-child {
  border-bottom: none;
}

.catalogo-fila input {
  padding: var(--spacing-1) var(--spacing-2);
  font-size: var(--font-size-sm);
  border-radius: var(--radius-md);
}

.catalogo-nombre {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  font-weight: 500;
}

.catalogo-icono {
  margin-right: var(--spacing-1);
}

.catalogo-acciones {
  display: inline-flex;
  gap: var(--spacing-2);
  flex-shrink: 0;
}

.btn-action {
  padding: 4px 10px;
  font-size: var(--font-size-xs);
  font-weight: 500;
  border-radius: var(--radius-md);
}

.btn-edit {
  background-color: var(--color-primary-100);
  color: var(--color-primary-700);
}

.btn-edit:hover {
  background-color: var(--color-primary-200);
}

.btn-cancel {
  background-color: var(--color-neutral-100);
  color: var(--color-neutral-600);
}

.btn-cancel:hover {
  background-color: var(--color-neutral-200);
}

.btn-delete {
  background-color: #fee2e2;
  color: #991b1b;
}

.btn-delete:hover {
  background-color: #fca5a5;
}

.catalogo-vacio {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}
</style>
```

- [ ] **Step 2: Embeber el panel en `AdminDashboardView.vue`**

En el `<script setup>`, junto a los demás imports de componentes:

```js
import CatalogosPanel from '@/components/admin/CatalogosPanel.vue'
```

En el `<template>`, entre el `</div>` que cierra `.kpi-grid` y el `<LoadingSpinner v-if="loading" ... />`:

```vue
    <!-- Gestión de catálogos (disponible para cualquier administrador) -->
    <CatalogosPanel />
```

No se toca nada más de esta vista: los KPIs siguen contando sobre `productores.value` completo.

- [ ] **Step 3: Verificar en el navegador**

Run: `npm run dev`

En `http://localhost:5173/admin` (con sesión iniciada):

1. Debajo de los KPIs aparecen las dos tarjetas, "Categorías de alimentos" y "Cantones", con las 9 categorías y los 11 cantones del seed.
2. Agregar una categoría `Pruebas` con icono `🧪` → toast de éxito y la fila aparece en su lugar alfabético.
3. **Renombrar** esa categoría a `Pruebas 2` → **Guardar** → la fila cambia y se reordena.
4. **Eliminar** `Pruebas 2` (que nadie usa) → confirmar → desaparece con toast de éxito.
5. Intentar **Eliminar** una categoría que sí usa algún productor → toast de error: "No se puede eliminar: N productores usan esta categoría." y la fila sigue ahí.
6. Repetir 2-5 con un cantón; el cantón en uso debe dar "No se puede eliminar: N productores están en este cantón."
7. Ir a `http://localhost:5173/admin/productores/nuevo`: los checkboxes de categoría ahora muestran el emoji real de cada categoría (antes todos usaban el 🌾 por defecto).
8. Reducir a 900 px: las dos tarjetas se apilan.

Detener el servidor con `Ctrl+C`.

- [ ] **Step 4: Verificar tests y build**

Run: `npm test`
Expected: PASS — 113 tests (sin cambios respecto a la Tarea 4).

Run: `npm run build`
Expected: termina sin errores.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/CatalogosPanel.vue src/views/admin/AdminDashboardView.vue
git commit -m "feat(catalogos): panel de categorías y cantones en el panel admin

Dos listas con alta, renombrado en línea y borrado protegido, embebidas
en el panel general sin ruta ni ítem de barra lateral nuevos.
"
```

---

### Tarea 6: Migración 003 — `es_superadmin()` y cierre de la escalada de privilegios

Spec §4.1. Hoy las tres políticas de escritura de `admin_profiles` usan `es_admin()`: **cualquier administrador puede modificar cualquier fila, incluida la suya, y ascenderse a `superadmin`**. Nunca se notó porque nada consultaba la columna `rol`; al construir la gestión de administradores hay que cerrarlo antes de que la interfaz lo exponga.

Esta tarea no lleva tests de Vitest: es SQL que corre en Postgres. Se verifica ejecutándola contra el proyecto real de Supabase, como se hizo con la migración 002.

**Files:**
- Create: `database/migrations/003_roles_y_seguridad_admin.sql`
- Modify: `README.md` (paso de instalación y texto de roles)
- Test: verificación manual en el SQL Editor de Supabase (pasos 3 y 4)

**Interfaces:**
- Consumes: `public.admin_profiles(id, nombre_completo, rol)` y `public.es_admin()`, ambas de las migraciones 001/002.
- Produces: la función `public.es_superadmin() → boolean` (SQL, STABLE, SECURITY DEFINER) y las políticas `admin_profiles_escritura` / `admin_profiles_actualizacion` / `admin_profiles_eliminacion` restringidas a superadmin. La política de SELECT `admin_profiles_lectura` **no cambia**.

- [ ] **Step 1: Escribir la migración**

Crear `database/migrations/003_roles_y_seguridad_admin.sql`:

```sql
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
--
-- No cambia las políticas de productores, productos_destacados, categorias,
-- cantones, productor_categorias, contactos_whatsapp ni storage.objects:
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
```

- [ ] **Step 2: Ejecutar la migración en Supabase**

En el panel de Supabase del proyecto: **SQL Editor** → **New query** → pegar el contenido completo de `database/migrations/003_roles_y_seguridad_admin.sql` → **Run**.

Expected: `Success. No rows returned`. Si aparece el `WARNING` sobre la falta de superadmin, ejecutar el `UPDATE` que indica el propio mensaje con el UUID del administrador principal **antes de continuar** con las tareas siguientes.

- [ ] **Step 3: Verificar que las políticas quedaron correctas**

En el SQL Editor:

```sql
SELECT policyname, cmd FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'admin_profiles'
ORDER BY policyname;
```

Expected: exactamente cuatro filas — `admin_profiles_actualizacion` (UPDATE), `admin_profiles_eliminacion` (DELETE), `admin_profiles_escritura` (INSERT) y `admin_profiles_lectura` (SELECT).

```sql
SELECT policyname, qual, with_check FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'admin_profiles'
  AND cmd <> 'SELECT';
```

Expected: las tres mencionan `es_superadmin()`. Ninguna menciona `es_admin()`.

- [ ] **Step 4: Verificar que la escalada quedó cerrada**

Hace falta un administrador con `rol = 'editor'` para la prueba. Si no existe, crearlo primero (Authentication → Users → Add user, y luego `INSERT INTO public.admin_profiles (id, nombre_completo, rol) VALUES ('UUID', 'Editor de prueba', 'editor');`).

En el **SQL Editor**, ejecutar todo el bloque de una vez, reemplazando `UUID-DEL-EDITOR` por el UUID real de ese editor:

```sql
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"UUID-DEL-EDITOR","role":"authenticated"}';

-- Intento de auto-ascenso: la política debe filtrar la fila
UPDATE public.admin_profiles SET rol = 'superadmin' WHERE id = 'UUID-DEL-EDITOR';

-- Intento de dar de alta a otro admin: también debe fallar
INSERT INTO public.admin_profiles (id, nombre_completo, rol)
VALUES (gen_random_uuid(), 'Intruso', 'superadmin');

ROLLBACK;
```

Expected: el `UPDATE` reporta `UPDATE 0` (ninguna fila afectada) y el `INSERT` falla con `new row violates row-level security policy for table "admin_profiles"`. El `ROLLBACK` garantiza que nada de esto quede escrito.

> Si el `UPDATE` reporta `UPDATE 1` o el `INSERT` tiene éxito, la migración no se aplicó: repetir el Step 2 y revisar el Step 3.

- [ ] **Step 5: Actualizar el README**

En la sección **2. Configurar Supabase**, después del paso 4 (`002_seguridad_admin_y_contactos.sql`), insertar un paso nuevo y renumerar los siguientes:

```markdown
5. Repita con `database/migrations/003_roles_y_seguridad_admin.sql` (roles
   `superadmin` / `editor` y cierre del permiso de escritura sobre
   `admin_profiles`).
```

En la subsección **Proyecto existente (ya tiene la migración 001)**, cambiar el paso 1 por:

```markdown
1. Ejecute `database/migrations/002_seguridad_admin_y_contactos.sql` y luego
   `database/migrations/003_roles_y_seguridad_admin.sql` en el SQL Editor, en
   ese orden. Ambas son seguras de ejecutar más de una vez.
```

En la sección **3. Crear el primer administrador**, reemplazar el párrafo final:

```markdown
Para cada administrador adicional, repita los pasos 1-3 con `rol = 'editor'`.
(Hoy ambos roles tienen los mismos permisos; la distinción queda para el futuro.)
```

por:

```markdown
El **primer** administrador debe tener `rol = 'superadmin'`: es el único rol
que puede dar de alta o revocar a otros administradores desde la aplicación
(**Administración → Administradores**). Los demás se invitan desde ahí, sin
volver a tocar SQL.

Diferencia entre roles:

| | `superadmin` | `editor` |
|---|---|---|
| Productores y productos destacados | Sí | Sí |
| Categorías y cantones | Sí | Sí |
| Invitar y revocar administradores | Sí | No |
```

- [ ] **Step 6: Commit**

```bash
git add database/migrations/003_roles_y_seguridad_admin.sql README.md
git commit -m "fix(seguridad): solo un superadmin puede escribir en admin_profiles

Agrega es_superadmin() y restringe INSERT/UPDATE/DELETE de admin_profiles,
que hasta ahora permitían a cualquier admin ascenderse a superadmin.
"
```

---

### Tarea 7: El rol en `useAuth` y en el guardia de rutas

Spec §4.2 y §4.3 (primera mitad). `useAuth` gana el rol como singleton de módulo, igual que `currentUser`; `guardiaAutenticacion` gana el chequeo de `meta.requiresSuperadmin` consultando Supabase directamente, sin depender de ningún composable (así sigue siendo probable sin montar Vue Router).

**Files:**
- Modify: `src/composables/useAuth.js`, `src/router/guard.js`
- Test: `tests/composables/useAuth.test.js` (agregar 4 casos), `tests/router/guard.test.js` (agregar 3 casos)

**Interfaces:**
- Consumes: `supabase` de `@/lib/supabase`; la tabla `admin_profiles(id, rol)`.
- Produces:
  - `useAuth()` devuelve, además de lo actual: `adminRol` (`Ref<'superadmin'|'editor'|null>`) y `esSuperadmin` (`ComputedRef<boolean>`).
  - `guardiaAutenticacion(to)` reconoce `to.matched[].meta.requiresSuperadmin` y devuelve `{ name: 'admin-dashboard' }` si el usuario no es superadmin.

- [ ] **Step 1: Escribir los tests de `useAuth`**

Agregar al final del `describe('useAuth', ...)` de `tests/composables/useAuth.test.js`, antes del `})` de cierre:

```js
  describe('rol de administrador', () => {
    it('login carga el rol y esSuperadmin es true para un superadmin', async () => {
      mockRef.actual.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: usuario, session: {} },
        error: null,
      })
      mockRef.actual.responder('admin_profiles', { data: { rol: 'superadmin' }, error: null })

      const { login, adminRol, esSuperadmin } = useAuth()
      await login('admin@ucr.ac.cr', 'secreto')

      const [consulta] = mockRef.actual.consultasDe('admin_profiles')
      expect(consulta.eq).toHaveBeenCalledWith('id', 'u-1')
      expect(adminRol.value).toBe('superadmin')
      expect(esSuperadmin.value).toBe(true)
    })

    it('un editor deja esSuperadmin en false', async () => {
      mockRef.actual.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: usuario, session: {} },
        error: null,
      })
      mockRef.actual.responder('admin_profiles', { data: { rol: 'editor' }, error: null })

      const { login, adminRol, esSuperadmin } = useAuth()
      await login('editor@ucr.ac.cr', 'secreto')

      expect(adminRol.value).toBe('editor')
      expect(esSuperadmin.value).toBe(false)
    })

    it('si la consulta del rol falla, adminRol queda en null sin lanzar', async () => {
      mockRef.actual.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: usuario, session: {} },
        error: null,
      })
      mockRef.actual.responder('admin_profiles', { data: null, error: { message: 'denegado' } })

      const { login, adminRol, esSuperadmin, currentUser } = useAuth()
      await expect(login('admin@ucr.ac.cr', 'secreto')).resolves.toBeTruthy()

      expect(currentUser.value).toEqual(usuario)
      expect(adminRol.value).toBeNull()
      expect(esSuperadmin.value).toBe(false)
    })

    it('logout limpia el rol', async () => {
      mockRef.actual.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: usuario, session: {} },
        error: null,
      })
      mockRef.actual.responder('admin_profiles', { data: { rol: 'superadmin' }, error: null })

      const { login, logout, adminRol } = useAuth()
      await login('admin@ucr.ac.cr', 'secreto')
      expect(adminRol.value).toBe('superadmin')

      await logout()
      expect(adminRol.value).toBeNull()
    })
  })
```

- [ ] **Step 2: Ejecutar y ver fallar**

Run: `npm test -- tests/composables/useAuth.test.js`
Expected: FAIL — `Cannot read properties of undefined (reading 'value')` sobre `adminRol` (no existe todavía).

- [ ] **Step 3: Agregar el rol a `useAuth.js`**

Bajo `const currentUser = ref(null)`, agregar:

```js
/**
 * Rol del administrador con sesión activa: 'superadmin', 'editor' o null.
 * Singleton igual que currentUser: se lee una vez por cambio de sesión.
 */
const adminRol = ref(null)

/**
 * Lee el rol del usuario desde admin_profiles.
 * Nunca lanza: si falla (sin fila, sin red, RLS), el rol queda en null y
 * la aplicación se comporta como si fuera un editor.
 */
async function cargarRol(usuario) {
  if (!usuario) {
    adminRol.value = null
    return
  }

  try {
    const { data, error: rolError } = await supabase
      .from('admin_profiles')
      .select('rol')
      .eq('id', usuario.id)
      .maybeSingle()
    adminRol.value = rolError ? null : (data?.rol ?? null)
  } catch (err) {
    console.warn('[useAuth] No se pudo leer el rol del administrador:', err?.message)
    adminRol.value = null
  }
}
```

Cambiar `authReady` para que también resuelva el rol:

```js
export const authReady = supabase.auth
  .getSession()
  .then(async ({ data: { session } }) => {
    currentUser.value = session?.user ?? null
    await cargarRol(currentUser.value)
    return currentUser.value
  })
  .catch(() => {
    currentUser.value = null
    adminRol.value = null
    return null
  })
```

Y el listener:

```js
// Mantener el estado sincronizado con login, logout y refresco de token
supabase.auth.onAuthStateChange((_event, session) => {
  currentUser.value = session?.user ?? null
  cargarRol(currentUser.value)
})
```

Dentro de `useAuth()`, junto a `isAuthenticated`:

```js
  const esSuperadmin = computed(() => adminRol.value === 'superadmin')
```

En `login`, después de `currentUser.value = data.user`:

```js
      await cargarRol(data.user)
```

En `logout`, después de `currentUser.value = null`:

```js
      adminRol.value = null
```

Y ampliar el `return` de `useAuth()`:

```js
  return {
    currentUser,
    adminRol,
    isAuthenticated,
    esSuperadmin,
    loading,
    error,
    login,
    logout,
    resetPassword,
    updatePassword,
  }
```

- [ ] **Step 4: Ejecutar y ver pasar**

Run: `npm test -- tests/composables/useAuth.test.js`
Expected: PASS — todos los casos existentes más los 4 nuevos.

- [ ] **Step 5: Escribir los tests del guardia**

Agregar en `tests/router/guard.test.js`, antes del `})` que cierra `describe('guardiaAutenticacion', ...)`:

```js
  describe('requiresSuperadmin', () => {
    /** Ruta admin protegida que además exige superadmin. */
    function rutaSuperadmin() {
      return {
        name: 'admins',
        fullPath: '/admin/administradores',
        meta: {},
        matched: [
          { meta: { requiresAuth: true } },
          { meta: { title: 'Administradores', requiresSuperadmin: true } },
        ],
      }
    }

    it('con sesión de superadmin, permite el paso', async () => {
      conSesion(true)
      mockRef.actual.responder('admin_profiles', { data: { rol: 'superadmin' }, error: null })

      const destino = await guardiaAutenticacion(rutaSuperadmin())

      const [consulta] = mockRef.actual.consultasDe('admin_profiles')
      expect(consulta.eq).toHaveBeenCalledWith('id', 'u1')
      expect(destino).toBe(true)
    })

    it('con sesión de editor, redirige al panel', async () => {
      conSesion(true)
      mockRef.actual.responder('admin_profiles', { data: { rol: 'editor' }, error: null })

      const destino = await guardiaAutenticacion(rutaSuperadmin())
      expect(destino).toEqual({ name: 'admin-dashboard' })
    })

    it('si la consulta del rol falla, redirige al panel (no se asume el permiso)', async () => {
      conSesion(true)
      mockRef.actual.responder('admin_profiles', { data: null, error: { message: 'denegado' } })

      const destino = await guardiaAutenticacion(rutaSuperadmin())
      expect(destino).toEqual({ name: 'admin-dashboard' })
    })

    it('sin sesión, una ruta de superadmin manda a login, no al panel', async () => {
      conSesion(false)
      const destino = await guardiaAutenticacion(rutaSuperadmin())
      expect(destino).toMatchObject({ name: 'login' })
      expect(mockRef.actual.consultasDe('admin_profiles')).toHaveLength(0)
    })
  })
```

- [ ] **Step 6: Ejecutar y ver fallar**

Run: `npm test -- tests/router/guard.test.js`
Expected: FAIL — los casos de superadmin/editor devuelven `true` en vez de la redirección, porque el guardia todavía ignora `requiresSuperadmin`.

- [ ] **Step 7: Agregar el chequeo en `guard.js`**

Después del bloque `if (requiereAuth && !autenticado) { ... }` y antes del `if (to.name === 'login' ...)`:

```js
  // requiresSuperadmin: segunda barrera del lado del cliente. La de verdad
  // son las políticas RLS de admin_profiles (migración 003); esto solo evita
  // mostrar una pantalla que no serviría de nada.
  const requiereSuperadmin = to.matched.some((r) => r.meta?.requiresSuperadmin)

  if (requiereSuperadmin && autenticado) {
    if (!(await esSuperadmin(session.user.id))) {
      return { name: 'admin-dashboard' }
    }
  }
```

Y arriba del `export async function guardiaAutenticacion`, la función auxiliar:

```js
/**
 * Consulta el rol del usuario directamente contra Supabase.
 *
 * No usa useAuth() a propósito: el guardia debe poder probarse sin montar
 * Vue ni depender del orden de carga de los composables.
 *
 * @param {string} userId
 * @returns {Promise<boolean>} false ante cualquier fallo (no se asume el permiso)
 */
async function esSuperadmin(userId) {
  try {
    const { data, error } = await supabase
      .from('admin_profiles')
      .select('rol')
      .eq('id', userId)
      .maybeSingle()
    if (error) return false
    return data?.rol === 'superadmin'
  } catch {
    return false
  }
}
```

- [ ] **Step 8: Ejecutar y ver pasar**

Run: `npm test -- tests/router/guard.test.js`
Expected: PASS — los 7 casos existentes más los 4 nuevos.

- [ ] **Step 9: Verificar que nada se rompió**

Run: `npm test`
Expected: PASS — 121 tests (113 + 4 de `useAuth` + 4 de `guard`).

Run: `npm run build`
Expected: termina sin errores.

- [ ] **Step 10: Commit**

```bash
git add src/composables/useAuth.js src/router/guard.js tests/composables/useAuth.test.js tests/router/guard.test.js
git commit -m "feat(roles): exponer el rol del administrador y proteger rutas de superadmin

useAuth publica adminRol y esSuperadmin como singleton; el guardia
reconoce meta.requiresSuperadmin y redirige al panel si no lo es.
"
```

---

### Tarea 8: Edge Function `invitar-admin` y composable `useAdmins`

Spec §4.4 y §4.5. El navegador no puede crear cuentas de Auth para otra persona sin exponer una clave privada, así que la invitación pasa por una Edge Function que usa la Service Role Key (variable de entorno propia del entorno de Supabase, nunca enviada al cliente) y que **vuelve a verificar** que quien llama es superadmin — no confía en que solo el front se lo ofrezca.

**La Edge Function no se cubre con Vitest**: corre en Deno, un entorno distinto al del bundle de Vue, y `vitest run` ni siquiera la carga. Escribir tests simulados para ella daría una falsa sensación de cobertura. Se verifica a mano contra el proyecto real (Steps 8 y 9), igual que se hizo con las políticas RLS del refactor anterior. Lo que **sí** se prueba con Vitest es el lado del cliente: que `invitarAdmin` invoque la función con el cuerpo correcto y traduzca sus errores.

**Files:**
- Create: `supabase/functions/invitar-admin/index.js`, `supabase/config.toml`, `src/composables/useAdmins.js`
- Modify: `tests/helpers/supabaseMock.js` (agregar `functions.invoke`), `README.md` (sección nueva)
- Test: `tests/composables/useAdmins.test.js` (nuevo)

**Interfaces:**
- Consumes: `supabase` de `@/lib/supabase`; la tabla `admin_profiles(id, nombre_completo, rol, created_at)`; la política `admin_profiles_lectura` (SELECT para cualquier admin) y las de escritura restringidas a superadmin (Tarea 6).
- Produces:
  - `useAdmins() → { admins, loading, error, fetchAdmins, invitarAdmin, eliminarAdmin }` donde:
    - `admins` es `Ref<Array<{ id, nombre_completo, rol, created_at }>>`.
    - `fetchAdmins() → Promise<void>` (deja el resultado en `admins`).
    - `invitarAdmin(email, nombre, rol) → Promise<boolean>`.
    - `eliminarAdmin(id) → Promise<boolean>`.
  - La Edge Function `invitar-admin`: recibe `POST { email, nombre, rol }` con el JWT del superadmin en `Authorization`; responde `200 { ok: true, id, nombre_completo, rol }` o un estado de error con `{ error: '<mensaje en español>' }`.
  - `crearSupabaseMock()` devuelve además `supabase.functions.invoke` como `vi.fn()`.

- [ ] **Step 1: Agregar `functions.invoke` al simulador de Supabase**

En `tests/helpers/supabaseMock.js`, dentro de `crearSupabaseMock()`, declarar antes del objeto `supabase`:

```js
  const functions = {
    invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
  }
```

Agregar `functions` al objeto `supabase`:

```js
  const supabase = {
    from: vi.fn((tabla) => crearBuilder(tabla)),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    storage: { from: vi.fn(() => storage) },
    functions,
    auth,
  }
```

En `reiniciar()`, junto a los demás `mockClear()`:

```js
    functions.invoke.mockClear()
```

Y devolver `functions` para poder configurarlo desde los tests:

```js
  return { supabase, storage, auth, functions, responder, consultasDe, reiniciar }
```

Actualizar también el comentario de cabecera del archivo agregando una viñeta:

```js
 * - `supabase.functions.invoke` es una función simulada (Edge Functions).
```

- [ ] **Step 2: Escribir los tests de `useAdmins`**

Crear `tests/composables/useAdmins.test.js`:

```js
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockRef = vi.hoisted(() => ({ actual: null }))

vi.mock('@/lib/supabase', async () => {
  const { crearSupabaseMock } = await import('../helpers/supabaseMock.js')
  mockRef.actual = crearSupabaseMock()
  return { supabase: mockRef.actual.supabase }
})

import { useAdmins } from '@/composables/useAdmins'

describe('useAdmins', () => {
  beforeEach(() => {
    mockRef.actual.reiniciar()
  })

  describe('fetchAdmins', () => {
    it('trae nombre, rol y fecha, ordenados por nombre', async () => {
      mockRef.actual.responder('admin_profiles', {
        data: [{ id: 'u1', nombre_completo: 'Ana', rol: 'superadmin', created_at: '2026-01-01' }],
        error: null,
      })
      const { fetchAdmins, admins } = useAdmins()
      await fetchAdmins()

      const [consulta] = mockRef.actual.consultasDe('admin_profiles')
      expect(consulta.select).toHaveBeenCalledWith('id, nombre_completo, rol, created_at')
      expect(consulta.order).toHaveBeenCalledWith('nombre_completo', { ascending: true })
      expect(admins.value).toHaveLength(1)
    })

    it('expone el error y deja la lista vacía', async () => {
      mockRef.actual.responder('admin_profiles', { data: null, error: { message: 'denegado' } })
      const { fetchAdmins, admins, error } = useAdmins()
      await fetchAdmins()

      expect(error.value).toBe('denegado')
      expect(admins.value).toEqual([])
    })
  })

  describe('invitarAdmin', () => {
    it('invoca la Edge Function con el correo en minúsculas, el nombre y el rol', async () => {
      mockRef.actual.functions.invoke.mockResolvedValueOnce({
        data: { ok: true, id: 'u9', nombre_completo: 'Luis', rol: 'editor' },
        error: null,
      })
      const { invitarAdmin } = useAdmins()
      const ok = await invitarAdmin('  Luis@UCR.ac.cr ', '  Luis  ', 'editor')

      expect(ok).toBe(true)
      expect(mockRef.actual.functions.invoke).toHaveBeenCalledWith('invitar-admin', {
        body: { email: 'luis@ucr.ac.cr', nombre: 'Luis', rol: 'editor' },
      })
    })

    it('usa el mensaje del cuerpo de error devuelto por la función', async () => {
      mockRef.actual.functions.invoke.mockResolvedValueOnce({
        data: null,
        error: {
          message: 'Edge Function returned a non-2xx status code',
          context: { json: async () => ({ error: 'Ese correo ya tiene una cuenta.' }) },
        },
      })
      const { invitarAdmin, error } = useAdmins()
      const ok = await invitarAdmin('luis@ucr.ac.cr', 'Luis', 'editor')

      expect(ok).toBe(false)
      expect(error.value).toBe('Ese correo ya tiene una cuenta.')
    })

    it('cae al mensaje genérico si el cuerpo del error no es JSON', async () => {
      mockRef.actual.functions.invoke.mockResolvedValueOnce({
        data: null,
        error: {
          message: 'Failed to send a request to the Edge Function',
          context: { json: async () => { throw new Error('no es JSON') } },
        },
      })
      const { invitarAdmin, error } = useAdmins()
      const ok = await invitarAdmin('luis@ucr.ac.cr', 'Luis', 'editor')

      expect(ok).toBe(false)
      expect(error.value).toBe('Failed to send a request to the Edge Function')
    })

    it('rechaza correo o nombre vacíos sin invocar la función', async () => {
      const { invitarAdmin, error } = useAdmins()

      expect(await invitarAdmin('', 'Luis', 'editor')).toBe(false)
      expect(error.value).toBe('El correo es obligatorio.')

      expect(await invitarAdmin('luis@ucr.ac.cr', '  ', 'editor')).toBe(false)
      expect(error.value).toBe('El nombre es obligatorio.')

      expect(mockRef.actual.functions.invoke).not.toHaveBeenCalled()
    })
  })

  describe('eliminarAdmin', () => {
    it('borra por id y quita la fila de la lista', async () => {
      mockRef.actual.responder('admin_profiles', { data: null, error: null })
      const { eliminarAdmin, admins } = useAdmins()
      admins.value = [{ id: 'u1' }, { id: 'u2' }]

      const ok = await eliminarAdmin('u1')

      expect(ok).toBe(true)
      const [consulta] = mockRef.actual.consultasDe('admin_profiles')
      expect(consulta.delete).toHaveBeenCalled()
      expect(consulta.eq).toHaveBeenCalledWith('id', 'u1')
      expect(admins.value).toEqual([{ id: 'u2' }])
    })

    it('devuelve false y conserva la lista si el delete falla', async () => {
      mockRef.actual.responder('admin_profiles', { data: null, error: { message: 'denegado' } })
      const { eliminarAdmin, admins, error } = useAdmins()
      admins.value = [{ id: 'u1' }]

      const ok = await eliminarAdmin('u1')

      expect(ok).toBe(false)
      expect(error.value).toBe('denegado')
      expect(admins.value).toEqual([{ id: 'u1' }])
    })
  })
})
```

- [ ] **Step 3: Ejecutar y ver fallar**

Run: `npm test -- tests/composables/useAdmins.test.js`
Expected: FAIL — `Failed to resolve import "@/composables/useAdmins"`.

- [ ] **Step 4: Escribir `useAdmins.js`**

Crear `src/composables/useAdmins.js`:

```js
/**
 * Composable de gestión de administradores (solo superadmins).
 *
 * admin_profiles no guarda el correo — vive solo en auth.users, que
 * PostgREST no expone al cliente. Por eso la lista muestra nombre y rol;
 * el correo solo se usa al invitar.
 *
 * Eliminar un administrador revoca su acceso (borra la fila de la lista
 * blanca). Su cuenta de Supabase Auth no se elimina.
 */
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

const FUNCION_INVITAR = 'invitar-admin'

/**
 * Saca el mensaje en español del cuerpo de error de la Edge Function.
 * supabase-js entrega un error genérico y deja el cuerpo real en
 * `context`; si no se puede leer, se usa el mensaje genérico.
 *
 * @param {Object} fnError
 * @returns {Promise<string>}
 */
async function mensajeDeFuncion(fnError) {
  try {
    const cuerpo = await fnError?.context?.json?.()
    if (cuerpo?.error) return cuerpo.error
  } catch {
    // El cuerpo no era JSON (timeout, error de red, HTML de un proxy...)
  }
  return fnError?.message || 'No se pudo enviar la invitación.'
}

export function useAdmins() {
  const admins = ref([])
  const loading = ref(false)
  const error = ref(null)

  /** Envuelve una operación con loading/error; devuelve `valorSiFalla` si lanza. */
  async function ejecutar(operacion, valorSiFalla) {
    loading.value = true
    error.value = null
    try {
      return await operacion()
    } catch (err) {
      error.value = err?.message || 'Ocurrió un error inesperado'
      console.error('[useAdmins]', err)
      return valorSiFalla
    } finally {
      loading.value = false
    }
  }

  /**
   * Lista los administradores de la lista blanca.
   * @returns {Promise<void>} El resultado queda en `admins`.
   */
  async function fetchAdmins() {
    admins.value = await ejecutar(async () => {
      const { data, error: fetchError } = await supabase
        .from('admin_profiles')
        .select('id, nombre_completo, rol, created_at')
        .order('nombre_completo', { ascending: true })
      if (fetchError) throw fetchError
      return data ?? []
    }, [])
  }

  /**
   * Invita a un administrador nuevo a través de la Edge Function.
   * @param {string} email
   * @param {string} nombre
   * @param {'superadmin'|'editor'} rol
   * @returns {Promise<boolean>}
   */
  function invitarAdmin(email, nombre, rol) {
    return ejecutar(async () => {
      const correo = (email ?? '').trim().toLowerCase()
      const nombreLimpio = (nombre ?? '').trim()

      if (!correo) throw new Error('El correo es obligatorio.')
      if (!nombreLimpio) throw new Error('El nombre es obligatorio.')

      const { error: fnError } = await supabase.functions.invoke(FUNCION_INVITAR, {
        body: { email: correo, nombre: nombreLimpio, rol },
      })

      if (fnError) throw new Error(await mensajeDeFuncion(fnError))

      return true
    }, false)
  }

  /**
   * Revoca el acceso de un administrador (no borra su cuenta de Auth).
   * @returns {Promise<boolean>}
   */
  function eliminarAdmin(id) {
    return ejecutar(async () => {
      const { error: deleteError } = await supabase
        .from('admin_profiles')
        .delete()
        .eq('id', id)
      if (deleteError) throw deleteError

      admins.value = admins.value.filter((a) => a.id !== id)
      return true
    }, false)
  }

  return { admins, loading, error, fetchAdmins, invitarAdmin, eliminarAdmin }
}
```

- [ ] **Step 5: Ejecutar y ver pasar**

Run: `npm test -- tests/composables/useAdmins.test.js`
Expected: PASS — 8 tests.

Run: `npm test`
Expected: PASS — 129 tests (121 + 8). Los tests existentes que usan el simulador siguen pasando: agregar `functions` es aditivo.

- [ ] **Step 6: Escribir la Edge Function**

Crear `supabase/functions/invitar-admin/index.js`:

```js
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
        { error: 'Ese correo ya tiene una cuenta. Use otro o dele acceso desde la base de datos.' },
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
})
```

- [ ] **Step 7: Declarar el punto de entrada `.js`**

La CLI de Supabase busca `index.ts` por omisión. Crear `supabase/config.toml` para que use el archivo `.js`:

```toml
# Configuración de la CLI de Supabase para este proyecto.
# Solo declara lo necesario para desplegar la Edge Function; el resto de la
# configuración del proyecto se administra desde el panel de supabase.com.

project_id = "mipymes-guanacaste"

[functions.invitar-admin]
# El proyecto no usa TypeScript, así que hay que declarar el .js a mano.
entrypoint = "./functions/invitar-admin/index.js"
verify_jwt = true
```

> `project_id` es solo el nombre local del proyecto para la CLI; `supabase link --project-ref <ref>` lo ajusta si hace falta.

- [ ] **Step 8: Desplegar la función**

Requiere la CLI de Supabase (`npm i -g supabase` o `npx supabase`) y haber iniciado sesión.

```bash
npx supabase login
npx supabase link --project-ref <REF-DEL-PROYECTO>
npx supabase functions deploy invitar-admin
```

Expected: `Deployed Function invitar-admin`. El `<REF-DEL-PROYECTO>` está en **Project Settings → General → Reference ID** del panel de Supabase.

Verificar en el panel: **Edge Functions** → debe aparecer `invitar-admin` con estado activo.

> No hace falta configurar ningún *secret*: `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` las inyecta la plataforma automáticamente en toda Edge Function.

- [ ] **Step 9: Probar la función contra el proyecto real**

Antes de probar, confirmar que el proyecto puede enviar correos: **Authentication → Emails** (o **Project Settings → Authentication → SMTP Settings**). Con el SMTP de prueba de Supabase el envío está limitado a unos pocos correos por hora y solo a direcciones del equipo; para uso real hay que configurar un SMTP propio.

Prueba con `curl` (reemplazar `<REF>` y `<TOKEN>`; el token se obtiene en la consola del navegador con sesión de superadmin iniciada, ejecutando `JSON.parse(Object.entries(localStorage).find(([k]) => k.includes('auth-token'))[1]).access_token`):

```bash
curl -i -X POST "https://<REF>.supabase.co/functions/v1/invitar-admin" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"email":"correo-de-prueba@ejemplo.com","nombre":"Persona de Prueba","rol":"editor"}'
```

Casos a confirmar:

1. Con el token de un **superadmin**: `HTTP/2 200` y `{"ok":true,...}`. En Supabase, **Authentication → Users** muestra el usuario nuevo como *Invited*, y `SELECT nombre_completo, rol FROM public.admin_profiles;` incluye la fila.
2. Repitiendo la misma llamada con el mismo correo: `HTTP/2 409` y el mensaje "Ese correo ya tiene una cuenta...".
3. Con el token de un **editor**: `HTTP/2 403` y "Solo un superadministrador puede invitar.".
4. **Sin** cabecera `Authorization`: `HTTP/2 401`.
5. Con un cuerpo sin `nombre`: `HTTP/2 400` y "El nombre es obligatorio.".

Limpiar después de la prueba: borrar el usuario invitado en **Authentication → Users** y su fila con `DELETE FROM public.admin_profiles WHERE nombre_completo = 'Persona de Prueba';`.

- [ ] **Step 10: Documentar en el README**

En la **Tabla de contenido**, insertar una entrada nueva después de "3. Crear el primer administrador" y renumerar el resto:

```markdown
4. [Invitaciones de administradores (Edge Function)](#4-invitaciones-de-administradores-edge-function)
```

Y agregar la sección correspondiente después de la sección 3 (renumerando las que siguen):

````markdown
## 4. Invitaciones de administradores (Edge Function)

La pantalla **Administración → Administradores** (solo visible para un
superadmin) invita a gente nueva por correo. Eso necesita dos cosas que se
configuran una sola vez:

### 4.1 Envío de correo

**Authentication → Emails** (o **Project Settings → Authentication → SMTP
Settings**). El servidor de prueba de Supabase funciona para empezar, pero
tiene un límite de pocos correos por hora y solo entrega a direcciones del
equipo. Para uso real, configure un SMTP propio (por ejemplo el institucional
de la UCR, o un servicio gratuito como Resend o Brevo).

Sin esto, la invitación falla con "No se pudo enviar la invitación. Revise la
configuración de correo del proyecto."

### 4.2 Desplegar la función

Requiere la CLI de Supabase y el *Reference ID* del proyecto
(**Project Settings → General**):

```bash
npx supabase login
npx supabase link --project-ref SU-REFERENCE-ID
npx supabase functions deploy invitar-admin
```

Debe repetirse **solo** si cambia el archivo
`supabase/functions/invitar-admin/index.js`. No hace falta configurar ninguna
clave: Supabase inyecta `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` dentro de
la función, y esa clave nunca llega al navegador.

### 4.3 Qué hace y qué no

- Crea la cuenta en Supabase Auth, envía el correo de invitación (la persona
  elige su contraseña desde el enlace) y agrega la fila en `admin_profiles`.
- Verifica el rol de quien invita: si no es superadmin, responde 403 aunque la
  petición venga de fuera de la aplicación.
- **Revocar** un administrador borra su fila de `admin_profiles` y con eso
  pierde todo permiso, pero **no** elimina su cuenta de Supabase Auth. Si
  quiere borrarla del todo: **Authentication → Users → Delete user**.
````

- [ ] **Step 11: Verificar tests y build**

Run: `npm test`
Expected: PASS — 129 tests.

Run: `npm run build`
Expected: termina sin errores. `supabase/` no forma parte del build de Vite.

- [ ] **Step 12: Commit**

```bash
git add supabase/functions/invitar-admin/index.js supabase/config.toml src/composables/useAdmins.js tests/composables/useAdmins.test.js tests/helpers/supabaseMock.js README.md
git commit -m "feat(admins): Edge Function de invitación y composable de administradores

La función verifica que quien invita sea superadmin antes de usar la
Service Role Key. useAdmins lista, invita y revoca desde el cliente.
"
```

---

### Tarea 9: Pantalla de administradores

Spec §4.3 (segunda mitad). Ruta nueva bajo `/admin`, enlace en la barra lateral solo para superadmins, tabla con **nombre y rol** (no correo: `admin_profiles` no lo guarda) y formulario de invitación.

**Files:**
- Create: `src/components/admin/AdminsTable.vue`, `src/views/admin/AdminsView.vue`
- Modify: `src/router/index.js`, `src/components/admin/AdminSidebar.vue`
- Test: no aplica (el guardia y el composable ya están cubiertos en las Tareas 7 y 8)

**Interfaces:**
- Consumes: `useAdmins()` → `{ admins, loading, error, fetchAdmins, invitarAdmin, eliminarAdmin }` (Tarea 8); `useAuth()` → `{ currentUser, esSuperadmin }` (Tarea 7); `useToast()`.
- Produces:
  - `AdminsTable.vue`: props `admins` (Array, default `() => []`) y `usuarioActualId` (String, default `''`); emit `eliminar` con el `id`.
  - Ruta con `name: 'admins'`, path `administradores` (es decir `/admin/administradores`), `meta: { title: 'Administradores', requiresSuperadmin: true }`. `requiresAuth` se hereda del padre `/admin`.

- [ ] **Step 1: Crear `AdminsTable.vue`**

Crear `src/components/admin/AdminsTable.vue`:

```vue
<!--
  AdminsTable.vue - Lista de administradores del sistema.

  Muestra nombre y rol: admin_profiles no guarda el correo (vive solo en
  auth.users, que PostgREST no expone al cliente). El botón de revocar se
  deshabilita en la fila del propio usuario para que un superadmin no se
  quite el acceso por error.

  Props:
  - admins (Array): filas { id, nombre_completo, rol, created_at }
  - usuarioActualId (String): id del usuario con sesión activa

  Emits:
  - eliminar (String): id del administrador a revocar
-->
<script setup>
defineProps({
  admins: {
    type: Array,
    default: () => [],
  },
  usuarioActualId: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['eliminar'])

/** Fecha corta en formato de Costa Rica; vacío si no hay dato. */
function fechaCorta(valor) {
  if (!valor) return '—'
  return new Date(valor).toLocaleDateString('es-CR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
</script>

<template>
  <div class="table-container-card">
    <div class="table-responsive">
      <table v-if="admins.length > 0" class="admin-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Rol</th>
            <th>Desde</th>
            <th class="text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="admin in admins" :key="admin.id">
            <td>
              <span class="admin-nombre">{{ admin.nombre_completo || 'Sin nombre' }}</span>
              <span v-if="admin.id === usuarioActualId" class="admin-yo">(usted)</span>
            </td>
            <td>
              <span :class="['rol-badge', admin.rol === 'superadmin' ? 'rol-super' : 'rol-editor']">
                {{ admin.rol === 'superadmin' ? 'Superadministrador' : 'Editor' }}
              </span>
            </td>
            <td class="admin-fecha">{{ fechaCorta(admin.created_at) }}</td>
            <td class="text-right">
              <button
                type="button"
                class="btn-action btn-delete"
                :disabled="admin.id === usuarioActualId"
                :title="admin.id === usuarioActualId
                  ? 'No puede revocar su propio acceso'
                  : 'Revocar el acceso de este administrador'"
                @click="emit('eliminar', admin.id)"
              >
                🗑️ Revocar acceso
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-else class="table-empty">
        <p class="empty-title">No hay administradores registrados</p>
        <p class="empty-desc">Invite a alguien con el formulario de arriba.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.table-container-card {
  background-color: var(--bg-surface);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--color-neutral-200);
  overflow: hidden;
}

.table-responsive {
  width: 100%;
  overflow-x: auto;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.admin-table th {
  background-color: var(--bg-secondary);
  color: var(--text-secondary);
  font-weight: 600;
  font-size: var(--font-size-xs);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: var(--spacing-4);
  border-bottom: 1px solid var(--color-neutral-200);
}

.admin-table td {
  padding: var(--spacing-4);
  border-bottom: 1px solid var(--color-neutral-200);
  vertical-align: middle;
  font-size: var(--font-size-sm);
}

.admin-table tbody tr:hover {
  background-color: var(--bg-secondary);
}

.admin-nombre {
  font-weight: 600;
  color: var(--text-primary);
}

.admin-yo {
  margin-left: var(--spacing-2);
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.admin-fecha {
  color: var(--text-secondary);
}

.rol-badge {
  font-size: var(--font-size-xs);
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font-weight: 600;
}

/* Superadmin en barro (el color de marca); editor en neutro. */
.rol-super {
  background-color: var(--color-primary-100);
  color: var(--color-primary-800);
}

.rol-editor {
  background-color: var(--color-neutral-200);
  color: var(--color-neutral-600);
}

.text-right {
  text-align: right;
}

.btn-action {
  padding: 6px 12px;
  font-size: var(--font-size-xs);
  font-weight: 500;
  border-radius: var(--radius-md);
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-delete {
  background-color: #fee2e2;
  color: #991b1b;
}

.btn-delete:hover:not(:disabled) {
  background-color: #fca5a5;
}

.btn-delete:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.table-empty {
  padding: var(--spacing-12) var(--spacing-4);
  text-align: center;
  background-color: var(--bg-primary);
}

.empty-title {
  font-weight: 600;
  font-size: var(--font-size-base);
  color: var(--text-primary);
  margin-bottom: var(--spacing-1);
}

.empty-desc {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}
</style>
```

- [ ] **Step 2: Crear `AdminsView.vue`**

Crear `src/views/admin/AdminsView.vue`:

```vue
<!--
  AdminsView.vue - Gestión de administradores del sistema.

  Solo accesible para superadmins (meta.requiresSuperadmin en la ruta y
  políticas RLS de admin_profiles como barrera real).

  Ruta: /admin/administradores
-->
<script setup>
import { onMounted, reactive } from 'vue'
import { useAdmins } from '@/composables/useAdmins'
import { useAuth } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'
import AdminsTable from '@/components/admin/AdminsTable.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const { admins, loading, error, fetchAdmins, invitarAdmin, eliminarAdmin } = useAdmins()
const { currentUser } = useAuth()
const { mostrarExito, mostrarError } = useToast()

const invitacion = reactive({
  email: '',
  nombre: '',
  rol: 'editor',
})

onMounted(() => {
  fetchAdmins()
})

async function handleInvitar() {
  const ok = await invitarAdmin(invitacion.email, invitacion.nombre, invitacion.rol)
  if (!ok) {
    mostrarError(error.value || 'No se pudo enviar la invitación.')
    return
  }

  mostrarExito(`Invitación enviada a ${invitacion.email.trim()}.`)
  invitacion.email = ''
  invitacion.nombre = ''
  invitacion.rol = 'editor'
  await fetchAdmins()
}

async function handleEliminar(id) {
  const admin = admins.value.find((a) => a.id === id)
  const confirmado = window.confirm(
    `¿Revocar el acceso de ${admin?.nombre_completo || 'este administrador'}? ` +
    'Dejará de poder entrar al panel. Su cuenta de correo no se elimina.'
  )
  if (!confirmado) return

  const ok = await eliminarAdmin(id)
  if (ok) {
    mostrarExito('Acceso revocado.')
  } else {
    mostrarError(error.value || 'No se pudo revocar el acceso.')
  }
}
</script>

<template>
  <div class="admins-view">
    <header class="admin-header">
      <h1 class="admin-title">Administradores</h1>
    </header>

    <!-- Invitación -->
    <section class="invitar-card">
      <h2 class="invitar-title">Invitar administrador</h2>
      <p class="invitar-desc">
        Se le enviará un correo para que elija su contraseña. Un
        <strong>editor</strong> gestiona productores, productos y catálogos; un
        <strong>superadministrador</strong> además gestiona esta lista.
      </p>

      <form class="invitar-form" @submit.prevent="handleInvitar">
        <div class="form-group">
          <label for="invitar-email" class="form-label required">Correo electrónico</label>
          <input
            id="invitar-email"
            v-model="invitacion.email"
            type="email"
            placeholder="Ej: persona@ucr.ac.cr"
            required
          />
        </div>

        <div class="form-group">
          <label for="invitar-nombre" class="form-label required">Nombre completo</label>
          <input
            id="invitar-nombre"
            v-model="invitacion.nombre"
            type="text"
            placeholder="Ej: María Rodríguez"
            required
          />
        </div>

        <div class="form-group">
          <label for="invitar-rol" class="form-label">Rol</label>
          <select id="invitar-rol" v-model="invitacion.rol">
            <option value="editor">Editor</option>
            <option value="superadmin">Superadministrador</option>
          </select>
        </div>

        <button type="submit" class="btn-invitar" :disabled="loading">
          ✉️ Enviar invitación
        </button>
      </form>
    </section>

    <LoadingSpinner v-if="loading && admins.length === 0" message="Cargando administradores..." />

    <div v-else-if="error && admins.length === 0" class="error-message">
      <p>⚠️ {{ error }}</p>
    </div>

    <AdminsTable
      v-else
      :admins="admins"
      :usuario-actual-id="currentUser?.id || ''"
      @eliminar="handleEliminar"
    />
  </div>
</template>

<style scoped>
.admin-header {
  margin-bottom: 2rem;
}

.admin-title {
  font-family: var(--font-headline);
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.invitar-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
  padding: var(--spacing-6);
  margin-bottom: var(--spacing-6);
}

.invitar-title {
  font-size: var(--font-size-lg);
  font-family: var(--font-family);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-2);
}

.invitar-desc {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-5);
  max-width: 62ch;
}

.invitar-form {
  display: grid;
  grid-template-columns: 2fr 2fr 1fr auto;
  gap: var(--spacing-4);
  align-items: end;
}

@media (max-width: 900px) {
  .invitar-form {
    grid-template-columns: 1fr;
    align-items: stretch;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.form-label {
  font-weight: 600;
  font-size: var(--font-size-sm);
  color: var(--text-primary);
}

.form-label.required::after {
  content: ' *';
  color: var(--color-error);
}

.btn-invitar {
  padding: var(--spacing-3) var(--spacing-6);
  background-color: var(--color-primary-600);
  color: var(--text-inverse);
  border-radius: var(--radius-full);
  font-weight: 600;
  font-size: var(--font-size-sm);
  white-space: nowrap;
}

.btn-invitar:hover:not(:disabled) {
  background-color: var(--color-primary-700);
}

.btn-invitar:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  color: var(--color-error);
  font-weight: 500;
}
</style>
```

- [ ] **Step 3: Registrar la ruta**

En `src/router/index.js`, junto a las demás vistas diferidas:

```js
const AdminsView = () => import('@/views/admin/AdminsView.vue')
```

Y como última hija del bloque `/admin`, después de `producer-edit`:

```js
      {
        path: 'administradores',
        name: 'admins',
        component: AdminsView,
        meta: { title: 'Administradores', requiresSuperadmin: true },
      },
```

(`requiresAuth` se hereda del padre `/admin`; el guardia lo lee con `to.matched.some(...)`.)

- [ ] **Step 4: Agregar el enlace en la barra lateral**

En `src/components/admin/AdminSidebar.vue`, cambiar el `<script setup>`:

```js
import { RouterLink } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

// El enlace de administradores solo se le ofrece a un superadmin; el
// guardia de la ruta y las políticas RLS son las barreras de verdad.
const { esSuperadmin } = useAuth()
```

Y agregar el enlace después del de "Nuevo Productor", antes de `<div class="sidebar-divider">`:

```vue
      <RouterLink
        v-if="esSuperadmin"
        to="/admin/administradores"
        class="sidebar-link"
        active-class="sidebar-link--active"
      >
        👥 Administradores
      </RouterLink>
```

Actualizar también el comentario del encabezado del archivo, agregando la línea:

```
  - Administradores (solo superadmin)
```

- [ ] **Step 5: Verificar en el navegador**

Run: `npm run dev`

Con la sesión de un **superadmin**:

1. En `/admin`, la barra lateral muestra "👥 Administradores".
2. Hacer clic: se abre `/admin/administradores`, el título de la pestaña es "Administradores" y la tabla lista a los administradores con su rol y fecha; la fila propia muestra "(usted)" y su botón de revocar está deshabilitado.
3. Invitar a un correo de prueba con rol Editor → toast de éxito y la fila aparece en la tabla tras el refresco. (Si el SMTP no está configurado, aparece el toast de error con el mensaje de la función — es el comportamiento esperado; ver README 4.1.)
4. Revocar ese administrador de prueba → confirmar → desaparece de la tabla con toast de éxito.
5. Reducir a 900 px: el formulario de invitación pasa a una columna.

Cerrar sesión e iniciar con un **editor**:

6. La barra lateral **no** muestra "Administradores".
7. Escribir `http://localhost:5173/admin/administradores` a mano en la barra de direcciones: el guardia redirige a `/admin`.

Detener el servidor con `Ctrl+C`.

- [ ] **Step 6: Verificar tests y build**

Run: `npm test`
Expected: PASS — 129 tests (sin cambios respecto a la Tarea 8).

Run: `npm run build`
Expected: termina sin errores.

- [ ] **Step 7: Commit**

```bash
git add src/components/admin/AdminsTable.vue src/views/admin/AdminsView.vue src/router/index.js src/components/admin/AdminSidebar.vue
git commit -m "feat(admins): pantalla de gestión de administradores para superadmins

Ruta /admin/administradores con tabla de nombre y rol, invitación por
correo y revocación de acceso. El enlace solo aparece si es superadmin.
"
```

---

### Tarea 10: Composable y componente de paginación

Spec §5.1 y §5.2. Paginación **en el cliente**: la lista completa sigue viniendo de Supabase y aquí solo se corta la presentación.

Detalle de diseño importante: `page` es un `computed` derivado de un `ref` interno y acotado por `totalPages`. Así, cuando la lista se encoge (por un filtro o un borrado), la página actual se ajusta sola y de forma **síncrona**, sin `watch` ni `nextTick`. Los componentes solo leen `page`; para cambiarla usan `irAPagina`, `siguiente`, `anterior` o `resetear`.

**Files:**
- Create: `src/composables/usePaginacion.js`, `src/components/common/Pagination.vue`
- Test: `tests/composables/usePaginacion.test.js` (nuevo)

**Interfaces:**
- Consumes: solo `vue` (`ref`, `computed`). Sin red, sin Supabase.
- Produces:
  - `usePaginacion(itemsRef, pageSize) → { page, totalPages, pageItems, irAPagina, siguiente, anterior, resetear }` donde `itemsRef` es cualquier `Ref`/`ComputedRef` que contenga un arreglo, `page` y `totalPages` son `ComputedRef<number>`, `pageItems` es `ComputedRef<Array>`, y las cuatro funciones no devuelven nada.
  - `Pagination.vue`: props `page` (Number, required) y `totalPages` (Number, required); emite `ir` con el número de página destino. No se renderiza nada si `totalPages <= 1`.

- [ ] **Step 1: Escribir los tests**

Crear `tests/composables/usePaginacion.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { computed, ref } from 'vue'
import { usePaginacion } from '@/composables/usePaginacion'

/** Lista [1..n] para comprobar los cortes con comodidad. */
function lista(n) {
  return Array.from({ length: n }, (_, i) => i + 1)
}

describe('usePaginacion', () => {
  it('pageItems devuelve solo los elementos de la página actual', () => {
    const items = ref(lista(25))
    const { pageItems, irAPagina } = usePaginacion(items, 10)

    expect(pageItems.value).toEqual(lista(10))

    irAPagina(2)
    expect(pageItems.value).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20])

    irAPagina(3)
    expect(pageItems.value).toEqual([21, 22, 23, 24, 25])
  })

  it('totalPages redondea hacia arriba', () => {
    expect(usePaginacion(ref(lista(25)), 10).totalPages.value).toBe(3)
    expect(usePaginacion(ref(lista(20)), 10).totalPages.value).toBe(2)
    expect(usePaginacion(ref(lista(1)), 10).totalPages.value).toBe(1)
  })

  it('siguiente y anterior se mueven una página', () => {
    const { page, siguiente, anterior } = usePaginacion(ref(lista(25)), 10)

    expect(page.value).toBe(1)
    siguiente()
    expect(page.value).toBe(2)
    anterior()
    expect(page.value).toBe(1)
  })

  it('no pasa del último ni antes del primero', () => {
    const { page, siguiente, anterior } = usePaginacion(ref(lista(25)), 10)

    siguiente()
    siguiente()
    siguiente()
    siguiente()
    expect(page.value).toBe(3)

    anterior()
    anterior()
    anterior()
    anterior()
    expect(page.value).toBe(1)
  })

  it('irAPagina ignora valores fuera de rango o no numéricos', () => {
    const { page, irAPagina } = usePaginacion(ref(lista(25)), 10)

    irAPagina(99)
    expect(page.value).toBe(3)

    irAPagina(0)
    expect(page.value).toBe(1)

    irAPagina('abc')
    expect(page.value).toBe(1)
  })

  it('con la lista vacía hay una página y ningún elemento', () => {
    const { page, totalPages, pageItems } = usePaginacion(ref([]), 10)

    expect(page.value).toBe(1)
    expect(totalPages.value).toBe(1)
    expect(pageItems.value).toEqual([])
  })

  it('resetear vuelve a la primera página', () => {
    const { page, irAPagina, resetear } = usePaginacion(ref(lista(25)), 10)

    irAPagina(3)
    expect(page.value).toBe(3)

    resetear()
    expect(page.value).toBe(1)
  })

  it('si la lista se encoge, la página se ajusta sin quedar vacía', () => {
    const items = ref(lista(25))
    const { page, pageItems, irAPagina } = usePaginacion(items, 10)

    irAPagina(3)
    expect(page.value).toBe(3)

    // Un filtro deja solo 12 elementos: ya no existe la página 3
    items.value = lista(12)
    expect(page.value).toBe(2)
    expect(pageItems.value).toEqual([11, 12])
  })

  it('funciona con un computed como origen (caso de ProducerTable)', () => {
    const origen = ref(lista(25))
    const filtrados = computed(() => origen.value.filter((n) => n % 2 === 0))
    const { totalPages, pageItems } = usePaginacion(filtrados, 5)

    expect(totalPages.value).toBe(3)
    expect(pageItems.value).toEqual([2, 4, 6, 8, 10])
  })
})
```

- [ ] **Step 2: Ejecutar y ver fallar**

Run: `npm test -- tests/composables/usePaginacion.test.js`
Expected: FAIL — `Failed to resolve import "@/composables/usePaginacion"`.

- [ ] **Step 3: Escribir el composable**

Crear `src/composables/usePaginacion.js`:

```js
/**
 * Composable de paginación en el cliente.
 *
 * No consulta nada: recibe un ref con la lista COMPLETA (la que ya trajo
 * el composable de datos) y solo corta lo que se muestra. Así la búsqueda
 * local de la tabla admin y los KPIs del panel siguen operando sobre el
 * arreglo entero.
 */
import { computed, ref } from 'vue'

/**
 * @param {import('vue').Ref<Array>} itemsRef - Lista completa (ref o computed)
 * @param {number} [pageSize] - Elementos por página
 * @returns {{
 *   page: import('vue').ComputedRef<number>,
 *   totalPages: import('vue').ComputedRef<number>,
 *   pageItems: import('vue').ComputedRef<Array>,
 *   irAPagina: (n: number) => void,
 *   siguiente: () => void,
 *   anterior: () => void,
 *   resetear: () => void,
 * }}
 */
export function usePaginacion(itemsRef, pageSize = 12) {
  const tamano = Math.max(1, Math.trunc(pageSize))

  // Página pedida por el usuario. `page` la acota a lo que existe hoy, así
  // que si la lista se encoge no hace falta ningún watch para corregirla.
  const paginaPedida = ref(1)

  const totalPages = computed(() => {
    const total = itemsRef.value?.length ?? 0
    return Math.max(1, Math.ceil(total / tamano))
  })

  const page = computed(() => Math.min(paginaPedida.value, totalPages.value))

  const pageItems = computed(() => {
    const inicio = (page.value - 1) * tamano
    return (itemsRef.value ?? []).slice(inicio, inicio + tamano)
  })

  /** Va a una página, recortando al rango válido. Ignora valores no numéricos. */
  function irAPagina(n) {
    const numero = Math.trunc(Number(n))
    if (!Number.isFinite(numero)) return
    paginaPedida.value = Math.min(Math.max(1, numero), totalPages.value)
  }

  function siguiente() {
    irAPagina(page.value + 1)
  }

  function anterior() {
    irAPagina(page.value - 1)
  }

  /** Vuelve a la primera página (al cambiar filtros o búsqueda). */
  function resetear() {
    paginaPedida.value = 1
  }

  return { page, totalPages, pageItems, irAPagina, siguiente, anterior, resetear }
}
```

- [ ] **Step 4: Ejecutar y ver pasar**

Run: `npm test -- tests/composables/usePaginacion.test.js`
Expected: PASS — 9 tests.

- [ ] **Step 5: Crear `Pagination.vue`**

Crear `src/components/common/Pagination.vue`:

```vue
<!--
  Pagination.vue - Controles de paginación.

  Solo presentación: recibe la página actual y el total, y emite a dónde ir.
  Quien pagina de verdad es usePaginacion. Si hay una sola página no se
  renderiza nada.

  Props:
  - page (Number): página actual (1..totalPages)
  - totalPages (Number): cantidad de páginas

  Emits:
  - ir (Number): página destino
-->
<script setup>
import { computed } from 'vue'

const props = defineProps({
  page: {
    type: Number,
    required: true,
  },
  totalPages: {
    type: Number,
    required: true,
  },
})

const emit = defineEmits(['ir'])

const MAXIMO_SIN_RESUMIR = 7

/**
 * Números a mostrar. Con pocas páginas se listan todas; con muchas se
 * muestran la primera, la última, la actual y sus vecinas, con '…' en los
 * huecos.
 */
const paginasVisibles = computed(() => {
  const total = props.totalPages
  if (total <= MAXIMO_SIN_RESUMIR) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const actual = props.page
  const inicio = Math.max(2, actual - 1)
  const fin = Math.min(total - 1, actual + 1)

  const paginas = [1]
  if (inicio > 2) paginas.push('…')
  for (let n = inicio; n <= fin; n++) paginas.push(n)
  if (fin < total - 1) paginas.push('…')
  paginas.push(total)

  return paginas
})
</script>

<template>
  <nav v-if="totalPages > 1" class="pagination" aria-label="Paginación">
    <button
      type="button"
      class="page-btn page-nav"
      :disabled="page === 1"
      @click="emit('ir', page - 1)"
    >
      ← Anterior
    </button>

    <template v-for="(numero, indice) in paginasVisibles" :key="`${numero}-${indice}`">
      <span v-if="numero === '…'" class="page-ellipsis" aria-hidden="true">…</span>
      <button
        v-else
        type="button"
        class="page-btn page-num"
        :class="{ 'page-num--active': numero === page }"
        :aria-current="numero === page ? 'page' : undefined"
        :aria-label="`Ir a la página ${numero}`"
        @click="emit('ir', numero)"
      >
        {{ numero }}
      </button>
    </template>

    <button
      type="button"
      class="page-btn page-nav"
      :disabled="page === totalPages"
      @click="emit('ir', page + 1)"
    >
      Siguiente →
    </button>
  </nav>
</template>

<style scoped>
.pagination {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  margin-top: var(--spacing-6);
}

.page-btn {
  padding: var(--spacing-2) var(--spacing-4);
  font-size: var(--font-size-sm);
  font-weight: 600;
  border-radius: var(--radius-full);
  background-color: var(--bg-surface);
  border: 1px solid var(--color-neutral-300);
  color: var(--text-secondary);
  transition: all var(--transition-fast);
}

.page-btn:hover:not(:disabled) {
  border-color: var(--color-primary-400);
  color: var(--color-primary-700);
  background-color: var(--color-primary-50);
}

.page-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.page-num {
  min-width: 40px;
  padding: var(--spacing-2) var(--spacing-3);
  font-variant-numeric: tabular-nums;
}

.page-num--active {
  background-color: var(--color-primary-600);
  border-color: var(--color-primary-600);
  color: var(--text-inverse);
}

.page-num--active:hover {
  background-color: var(--color-primary-700);
  border-color: var(--color-primary-700);
  color: var(--text-inverse);
}

.page-ellipsis {
  color: var(--text-muted);
  padding: 0 var(--spacing-1);
}

@media (max-width: 480px) {
  .page-nav {
    padding: var(--spacing-2) var(--spacing-3);
    font-size: var(--font-size-xs);
  }
}
</style>
```

- [ ] **Step 6: Verificar tests y build**

Run: `npm test`
Expected: PASS — 138 tests (129 + 9).

Run: `npm run build`
Expected: termina sin errores. (`Pagination.vue` todavía no se usa en ninguna vista; se integra en la Tarea 11.)

- [ ] **Step 7: Commit**

```bash
git add src/composables/usePaginacion.js src/components/common/Pagination.vue tests/composables/usePaginacion.test.js
git commit -m "feat(paginacion): composable genérico y controles de paginación

Pagina en memoria sobre la lista ya cargada; la página actual se acota
sola cuando la lista se encoge. Los controles se ocultan con una página.
"
```

---

### Tarea 11: Integrar la paginación en el grid público y la tabla admin

Spec §5.3. 12 tarjetas por página en el inicio, 15 filas por página en la tabla admin. Nada más cambia: `fetchProductores` sigue trayendo la lista completa, la búsqueda local de la tabla sigue filtrando sobre el arreglo entero y los KPIs del panel siguen contándolo entero.

**Files:**
- Modify: `src/views/HomeView.vue`, `src/components/admin/ProducerTable.vue`
- Test: no aplica (la lógica está cubierta por `tests/composables/usePaginacion.test.js`)

**Interfaces:**
- Consumes: `usePaginacion(itemsRef, pageSize)` y `Pagination.vue` (Tarea 10).
- Produces: nada nuevo para tareas posteriores.

- [ ] **Step 1: Paginar `HomeView.vue`**

En el `<script setup>`, agregar los imports:

```js
import { usePaginacion } from '@/composables/usePaginacion'
import Pagination from '@/components/common/Pagination.vue'
```

Después de la línea de los composables (`const { cantones, categorias, ... } = useCatalogos()`):

```js
// Paginación solo de la presentación: `productores` sigue siendo la lista
// completa que devolvió Supabase.
const { page, totalPages, pageItems, irAPagina, resetear } = usePaginacion(productores, 12)
```

Y en `applyFilters()`, volver a la primera página antes de recargar:

```js
/** Aplicar todos los filtros activos y recargar productores */
function applyFilters() {
  resetear()
  fetchProductores({ ...activeFilters })
}
```

En el `<template>`, reemplazar la línea del grid:

```vue
        <!-- Cuadrícula de productores -->
        <ProducerGrid v-else :productores="productores" />
```

por:

```vue
        <!-- Cuadrícula de productores (solo la página actual) -->
        <template v-else>
          <ProducerGrid :productores="pageItems" />
          <Pagination :page="page" :total-pages="totalPages" @ir="irAPagina" />
        </template>
```

- [ ] **Step 2: Paginar `ProducerTable.vue`**

En el `<script setup>`, cambiar la primera línea de imports y agregar los nuevos:

```js
import { computed, ref, watch } from 'vue'
import { getPublicImageUrl } from '@/lib/supabase'
import { colorDeCategoria } from '@/utils/categoriaColor'
import { usePaginacion } from '@/composables/usePaginacion'
import Pagination from '@/components/common/Pagination.vue'
```

Después de la definición de `filteredProductores`:

```js
// La paginación cuelga del resultado ya filtrado: el buscador local sigue
// viendo la lista completa que trajo el panel.
const { page, totalPages, pageItems, irAPagina, resetear } = usePaginacion(filteredProductores, 15)

// Al escribir en el buscador, los resultados cambian: volver a la página 1
watch(searchFilter, resetear)
```

En el `<template>`, cambiar el `v-for` del `<tbody>`:

```vue
          <tr v-for="p in pageItems" :key="p.id">
```

(La condición `v-if="filteredProductores.length > 0"` de la tabla **no cambia**: el estado vacío sigue dependiendo del total filtrado, no de la página.)

Y agregar los controles justo después del `</div>` que cierra `.table-responsive`, dentro de `.table-container-card`:

```vue
    <!-- Paginación de la tabla -->
    <div v-if="totalPages > 1" class="table-footer">
      <span class="table-count">
        {{ filteredProductores.length }} productores · página {{ page }} de {{ totalPages }}
      </span>
      <Pagination :page="page" :total-pages="totalPages" @ir="irAPagina" />
    </div>
```

Agregar al final del `<style scoped>`:

```css
.table-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-3);
  padding: var(--spacing-3) var(--spacing-4);
  background-color: var(--bg-primary);
  border-top: 1px solid var(--color-neutral-200);
}

.table-count {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

/* Dentro de la tabla el margen superior de los controles sobra. */
.table-footer :deep(.pagination) {
  margin-top: 0;
}
```

- [ ] **Step 3: Verificar en el navegador**

Run: `npm run dev`

Hace falta tener más de 12 productores para ver el efecto. Si el directorio tiene menos, crear varios de prueba desde el admin (o duplicar filas con un `INSERT ... SELECT` en el SQL Editor) y borrarlos al terminar.

En `http://localhost:5173/`:

1. Con más de 12 productores activos se ven 12 tarjetas y los controles debajo del grid.
2. **Siguiente →** muestra las siguientes 12 y el número 2 queda resaltado en barro.
3. Escribir algo en el buscador: los resultados cambian y se vuelve a la página 1.
4. Filtrar por cantón o categoría: lo mismo, vuelve a la página 1.
5. Si un filtro deja 12 o menos resultados, los controles desaparecen por completo.

En `http://localhost:5173/admin`:

6. Con más de 15 productores, la tabla muestra 15 filas y aparece el pie con "N productores · página 1 de M".
7. Los KPIs de arriba siguen mostrando el **total** (no 15): esa es la comprobación de que la paginación no tocó los conteos.
8. Escribir en el buscador de la tabla: filtra al instante sobre toda la lista y vuelve a la página 1.
9. Eliminar un productor estando en la última página, cuando esa página tiene una sola fila: la tabla salta sola a la página anterior en vez de quedar en blanco.

Detener el servidor con `Ctrl+C`.

- [ ] **Step 4: Verificar tests y build**

Run: `npm test`
Expected: PASS — 138 tests (sin cambios respecto a la Tarea 10).

Run: `npm run build`
Expected: termina sin errores.

- [ ] **Step 5: Commit**

```bash
git add src/views/HomeView.vue src/components/admin/ProducerTable.vue
git commit -m "feat(paginacion): paginar el directorio público y la tabla de admin

12 tarjetas y 15 filas por página. La búsqueda local y los KPIs siguen
operando sobre la lista completa; solo se corta lo que se pinta.
"
```

---

### Tarea 12: Anti-doble-clic en la métrica de WhatsApp

Spec §6. El debounce afecta **solo** al registro de la métrica: el enlace de WhatsApp se abre siempre igual, porque `WhatsAppButton.vue` no espera a `registrarContacto` ni depende de su resultado (no se toca ese componente).

**Files:**
- Modify: `src/composables/useContactos.js`, `tests/composables/useContactos.test.js`
- Test: `tests/composables/useContactos.test.js` (agregar 4 casos y limpiar `localStorage` entre casos)

**Interfaces:**
- Consumes: `localStorage` del navegador (puede no existir o lanzar en modo privado).
- Produces: `registrarContacto(productorId)` mantiene la misma firma y sigue sin lanzar nunca; ahora omite el RPC si se llamó hace menos de 60 s para ese mismo productor.

- [ ] **Step 1: Aislar los casos existentes**

El debounce guarda estado en `localStorage`, que en jsdom **persiste entre casos del mismo archivo**. Sin limpiarlo, un caso afectaría al siguiente. Agregar la limpieza al `beforeEach` que ya existe en `tests/composables/useContactos.test.js`:

```js
  beforeEach(() => {
    mockRef.actual.reiniciar()
    localStorage.clear()
  })
```

Ese es el **único** cambio a los casos existentes; ninguno se modifica ni se borra.

- [ ] **Step 2: Escribir los tests nuevos**

Agregar dentro del `describe('registrarContacto', ...)` de `tests/composables/useContactos.test.js`, después del último caso:

```js
    it('omite el RPC si ya se registró ese productor hace menos de 60 s', async () => {
      const { registrarContacto } = useContactos()

      await registrarContacto('prod-1')
      expect(mockRef.actual.supabase.rpc).toHaveBeenCalledTimes(1)

      await registrarContacto('prod-1')
      expect(mockRef.actual.supabase.rpc).toHaveBeenCalledTimes(1)
    })

    it('el debounce es por productor: otro id sí registra', async () => {
      const { registrarContacto } = useContactos()

      await registrarContacto('prod-1')
      await registrarContacto('prod-2')

      expect(mockRef.actual.supabase.rpc).toHaveBeenCalledTimes(2)
      expect(mockRef.actual.supabase.rpc).toHaveBeenLastCalledWith('registrar_contacto', {
        p_productor_id: 'prod-2',
      })
    })

    it('vuelve a registrar cuando la marca anterior tiene más de 60 s', async () => {
      localStorage.setItem('contacto_ultimo_prod-1', String(Date.now() - 61_000))

      const { registrarContacto } = useContactos()
      await registrarContacto('prod-1')

      expect(mockRef.actual.supabase.rpc).toHaveBeenCalledTimes(1)
    })

    it('registra igual si localStorage no está disponible', async () => {
      const original = Object.getOwnPropertyDescriptor(window, 'localStorage')
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        get() {
          throw new Error('acceso denegado')
        },
      })

      try {
        const { registrarContacto } = useContactos()
        await expect(registrarContacto('prod-1')).resolves.toBeUndefined()
        expect(mockRef.actual.supabase.rpc).toHaveBeenCalledTimes(1)
      } finally {
        Object.defineProperty(window, 'localStorage', original)
      }
    })
```

- [ ] **Step 3: Ejecutar y ver fallar**

Run: `npm test -- tests/composables/useContactos.test.js`
Expected: FAIL — "omite el RPC si ya se registró..." falla con `expected 2 to be 1`, porque todavía no hay debounce.

- [ ] **Step 4: Implementar el debounce**

En `src/composables/useContactos.js`, agregar arriba, después de los imports:

```js
// Ventana anti-doble-clic del contador (no afecta al enlace de WhatsApp)
const VENTANA_DEBOUNCE_MS = 60_000
const PREFIJO_MARCA = 'contacto_ultimo_'

/**
 * ¿Se registró este productor hace menos de la ventana?
 *
 * localStorage puede lanzar (modo privado, cuota, políticas del navegador).
 * Ante cualquier duda se devuelve false: es preferible contar un clic de más
 * que perder la métrica por completo.
 */
function registradoHacePoco(productorId) {
  try {
    const marca = window.localStorage.getItem(`${PREFIJO_MARCA}${productorId}`)
    if (!marca) return false
    return Date.now() - Number(marca) < VENTANA_DEBOUNCE_MS
  } catch {
    return false
  }
}

/** Guarda la marca de tiempo del último intento. Nunca lanza. */
function marcarIntento(productorId) {
  try {
    window.localStorage.setItem(`${PREFIJO_MARCA}${productorId}`, String(Date.now()))
  } catch {
    // Sin almacenamiento no hay debounce, pero el contacto se registra igual
  }
}
```

Y reescribir `registrarContacto`:

```js
  /**
   * Registra un clic de contacto. Fire-and-forget.
   *
   * Si ya se registró este productor hace menos de un minuto, se omite la
   * llamada al RPC. El enlace de WhatsApp se abre igual: quien llama
   * (WhatsAppButton) no espera a esta función ni mira su resultado.
   *
   * @param {string|null|undefined} productorId
   */
  async function registrarContacto(productorId) {
    if (!productorId) return

    if (registradoHacePoco(productorId)) {
      marcarIntento(productorId)
      return
    }

    marcarIntento(productorId)

    try {
      const { error } = await supabase.rpc('registrar_contacto', { p_productor_id: productorId })
      if (error) console.warn('[useContactos] No se registró el contacto:', error.message)
    } catch (err) {
      console.warn('[useContactos] No se registró el contacto:', err?.message)
    }
  }
```

- [ ] **Step 5: Ejecutar y ver pasar**

Run: `npm test -- tests/composables/useContactos.test.js`
Expected: PASS — 11 casos (los 7 existentes + los 4 nuevos).

- [ ] **Step 6: Verificar en el navegador**

Run: `npm run dev`

1. Abrir el detalle de un productor y pulsar **Contactar por WhatsApp**: el enlace abre WhatsApp en otra pestaña.
2. Volver y pulsarlo cinco veces seguidas: WhatsApp se abre las cinco veces (el debounce nunca bloquea el contacto).
3. En el panel admin, recargar y mirar la columna **Contactos** de ese productor: debe haber subido **1**, no 5.
4. En la consola del navegador, `localStorage.getItem('contacto_ultimo_<id>')` devuelve una marca de tiempo.
5. Esperar más de un minuto, pulsar de nuevo y recargar el panel: ahora sí sube a 2.

Detener el servidor con `Ctrl+C`.

- [ ] **Step 7: Verificar tests y build**

Run: `npm test`
Expected: PASS — 142 tests (138 + 4).

Run: `npm run build`
Expected: termina sin errores.

- [ ] **Step 8: Commit**

```bash
git add src/composables/useContactos.js tests/composables/useContactos.test.js
git commit -m "feat(contactos): anti-doble-clic de 60 s en el contador de WhatsApp

La métrica se omite si el mismo visitante ya contactó a ese productor hace
menos de un minuto. El enlace de WhatsApp se abre siempre igual.
"
```

---

### Tarea 13: Verificación final

Barrido de cierre: confirmar que las cinco funcionalidades conviven, que no se coló ningún color literal, TypeScript ni dependencia nueva, y que la aplicación completa funciona con los dos roles.

**Files:**
- Modify: ninguno por defecto. Si el barrido encuentra algo, se corrige en el archivo donde aparezca.
- Test: no aplica (verificación; se apoya en `npm test` y `npm run build`)

**Interfaces:**
- Consumes: el resultado de las Tareas 1-12.
- Produces: la confirmación de que la rama está lista para revisión (spec §1 completa).

- [ ] **Step 1: Confirmar que no se introdujeron colores ni fuentes literales**

Run: `grep -rnE "#[0-9a-fA-F]{3,8}\b" src/ | grep -v "src/assets/styles/main.css"`

Expected: las únicas coincidencias aceptables son
- `#fee2e2`, `#991b1b`, `#fca5a5` (botones de eliminar) en `ProducerTable.vue`, `ProductosDestacadosPanel.vue`, `CatalogosPanel.vue` y `AdminsTable.vue`;
- `#dc2626` y `#ffffff`/`white` en `ImageUploader.vue` (preexistentes, no se tocaron);
- `#25d366` / `#1ebe5d` en `WhatsAppButton.vue` (preexistentes);
- los colores de los SVG decorativos (`#8C3B26`, `#3A5A34`) en `HomeView.vue` (preexistentes).

Cualquier otra coincidencia en un archivo nuevo de este plan debe sustituirse por el token correspondiente.

Run: `grep -rniE "font-family:\s*(?!var\()" src/ --include=*.vue`

Expected: sin coincidencias (toda tipografía va por `var(--font-headline)` o `var(--font-family)`).

- [ ] **Step 2: Confirmar que no entró TypeScript, Pinia ni dependencias nuevas**

Run: `grep -rn "lang=\"ts\"\|from 'pinia'\|defineStore" src/`
Expected: sin coincidencias.

Run: `git diff main --stat -- package.json package-lock.json`
Expected: sin cambios (ninguna dependencia nueva; la CLI de Supabase se usa con `npx`, no se instala en el proyecto).

- [ ] **Step 3: Confirmar que los archivos nuevos existen y están completos**

Run: `git diff main --name-status`

Expected: entre los archivos agregados (`A`) deben estar exactamente estos doce del plan, más los seis de pruebas:

```
src/composables/useProductosDestacados.js
src/composables/useAdmins.js
src/composables/usePaginacion.js
src/utils/precio.js
src/components/admin/ProductosDestacadosPanel.vue
src/components/admin/ProductoDestacadoForm.vue
src/components/admin/CatalogosPanel.vue
src/components/admin/AdminsTable.vue
src/components/producers/ProductosDestacadosGrid.vue
src/components/common/Pagination.vue
src/views/admin/AdminsView.vue
supabase/functions/invitar-admin/index.js
supabase/config.toml
database/migrations/003_roles_y_seguridad_admin.sql
tests/composables/useProductosDestacados.test.js
tests/composables/useCatalogos.test.js
tests/composables/useAdmins.test.js
tests/composables/usePaginacion.test.js
tests/utils/precio.test.js
```

- [ ] **Step 4: Confirmar que las decisiones deliberadas de la spec se respetaron**

Run: `grep -n "productores.value.length\|productores.value.filter" src/views/admin/AdminDashboardView.vue`
Expected: las dos líneas de los KPIs siguen contando `productores.value` (la lista completa), **no** `pageItems`.

Run: `grep -n "props.productores" src/components/admin/ProducerTable.vue`
Expected: `filteredProductores` sigue filtrando sobre `props.productores` (la lista completa), no sobre la página.

Run: `grep -rn "count: 'exact'" src/composables/`
Expected: solo en `useCatalogos.js` (comprobación de uso antes de borrar). La spec §8 descarta el conteo server-side para la paginación.

Run: `grep -n "registrarContacto" src/components/producers/WhatsAppButton.vue`
Expected: la llamada sigue siendo fire-and-forget dentro de `handleClick`, sin `await` y sin condicionar el `<a>`.

- [ ] **Step 5: Recorrido funcional completo**

Run: `npm run dev`

Con sesión de **superadmin**:

1. `/admin` — KPIs con el total real, panel de categorías y cantones, tabla paginada de 15 filas.
2. `/admin/productores/<id>/editar` — agregar, editar y borrar un producto destacado.
3. `/productor/<id>` — el producto aparece en la grilla pública; marcado como no disponible, desaparece.
4. `/` — grid de 12 por página; filtrar vuelve a la página 1.
5. Botón de WhatsApp pulsado dos veces seguidas: abre las dos veces, el contador sube 1.
6. `/admin/administradores` — lista, invitación y revocación.

Cerrar sesión e iniciar con un **editor**:

7. La barra lateral no muestra "Administradores"; entrar por URL redirige a `/admin`.
8. Todo lo demás (productores, productos destacados, catálogos) funciona igual.

Sin sesión:

9. `/` y `/productor/<id>` funcionan con paginación y productos destacados; `/admin` redirige a `/login`.

A 375 px de ancho, repetir 1, 3 y 4: sin desbordamiento horizontal.

Detener el servidor con `Ctrl+C`.

- [ ] **Step 6: Verificar build y tests**

Run: `npm run build`
Expected: termina sin errores (0 errors).

Run: `npm test`
Expected: PASS — **142 tests** (los 83 originales + 59 nuevos), repartidos así:

| Archivo | Tests |
|---|---|
| `tests/composables/useStorage.test.js` | 8 originales + 2 |
| `tests/composables/useProductosDestacados.test.js` | 10 |
| `tests/utils/precio.test.js` | 6 |
| `tests/composables/useCatalogos.test.js` | 12 |
| `tests/composables/useAuth.test.js` | originales + 4 |
| `tests/router/guard.test.js` | 7 originales + 4 |
| `tests/composables/useAdmins.test.js` | 8 |
| `tests/composables/usePaginacion.test.js` | 9 |
| `tests/composables/useContactos.test.js` | 7 originales + 4 |

- [ ] **Step 7: Commit (solo si el barrido obligó a corregir algo)**

Si los Steps 1-4 no encontraron nada que corregir, **no hay nada que commitear**: saltar este paso y dar la tarea por terminada.

Si hubo correcciones:

```bash
git add -A
git commit -m "fix: correcciones del barrido final de las nuevas funcionalidades
"
```

---

## Auto-revisión del plan (hecha al escribirlo)

**Cobertura de la spec:**

| Sección de la spec | Tarea(s) |
|---|---|
| §2.1 composable + `uploadImage(file, carpeta)` | 1 |
| §2.2 panel en el formulario de productor | 2 |
| §2.3 grilla pública en el detalle | 3 |
| §3.1 escritura de catálogos con validación de uso | 4 |
| §3.2 `CatalogosPanel` dentro del panel general | 5 |
| §4.1 migración 003 y `es_superadmin()` | 6 |
| §4.2 `adminRol` / `esSuperadmin` en `useAuth` | 7 |
| §4.3 ruta, guardia, barra lateral, vista y tabla | 7 (guardia) y 9 (ruta, vista, tabla, enlace) |
| §4.4 `useAdmins` | 8 |
| §4.5 Edge Function + configuración manual en el README | 8 |
| §5.1 `usePaginacion` | 10 |
| §5.2 `Pagination.vue` | 10 |
| §5.3 integración en `HomeView` y `ProducerTable` | 11 |
| §6 anti-doble-clic | 12 |
| §7 testing (Vitest para todo salvo la Edge Function) | 1, 2, 4, 7, 8, 10, 12 |
| §8 fuera de alcance | verificado en la Tarea 13, Step 4 |

**Hallazgos corregidos durante la revisión:**

1. **Formularios anidados.** El panel de productos destacados iba a quedar dentro del `<form>` de `ProducerForm.vue` y `ProductoDestacadoForm.vue` también es un `<form>` — HTML inválido que rompe el envío del formulario de productor. Se resolvió envolviendo ambos en un `<div class="producer-form-layout">`, con el panel fuera del `<form>` (Tarea 2).
2. **Formato de precio duplicado.** El precio se muestra en el panel admin y en la grilla pública. En vez de repetir el `Intl.NumberFormat` en dos componentes, se extrajo `src/utils/precio.js` con `formatearPrecio(monto, unidad)` y sus tests — archivo que no estaba en la lista original de la spec.
3. **`fetchCategorias` no traía `icono`.** `ProducerForm.vue` ya usaba `cat.icono || '🌾'`, pero la consulta seleccionaba solo `id, nombre`, así que el emoji nunca llegaba. El panel de catálogos necesita esa columna, así que se agregó al `select` (Tarea 4).
4. **`localStorage` compartido entre tests.** En jsdom el almacenamiento persiste entre casos del mismo archivo, así que el debounce de la Tarea 12 habría hecho fallar de forma intermitente a los casos existentes de `useContactos`. Se agregó `localStorage.clear()` al `beforeEach` existente.
5. **`page` se quedaba fuera de rango.** La primera versión de `usePaginacion` ajustaba la página con un `watch`, lo que obligaba a `await nextTick()` en los tests y dejaba un frame con la página vacía. Se cambió por un `computed` acotado (`page = min(paginaPedida, totalPages)`), síncrono y sin watchers.
6. **El simulador de Supabase no conocía `functions.invoke`.** `useAdmins.invitarAdmin` la necesita; se agregó a `tests/helpers/supabaseMock.js` como paso explícito de la Tarea 8 (cambio aditivo, no afecta a los tests existentes).
7. **Punto de entrada `.js` en la Edge Function.** La CLI de Supabase busca `index.ts`; con un `index.js` el despliegue falla. Se agregó `supabase/config.toml` con `entrypoint = "./functions/invitar-admin/index.js"`.
8. **El guardia podía dejar pasar ante un error.** Si la consulta del rol falla, no se asume el permiso: `esSuperadmin()` devuelve `false` y la ruta redirige al panel (Tarea 7, con su test).
9. **El README quedaba mintiendo.** Decía "hoy ambos roles tienen los mismos permisos; la distinción queda para el futuro", lo que deja de ser cierto con la migración 003. Se corrige en la misma tarea que introduce el cambio (Tarea 6).

**Consistencia de firmas:** los nombres de la sección *Global Constraints* se usaron literalmente en las 13 tareas. Puntos revisados uno a uno: `uploadImage(file, carpeta)` (Tarea 1) coincide con las llamadas de la Tarea 1; `formatearPrecio(monto, unidad)` (Tarea 2) coincide con su uso en la Tarea 3; `usePaginacion(itemsRef, pageSize)` y el objeto que devuelve (Tarea 10) coinciden con la desestructuración de la Tarea 11; `esSuperadmin` (Tarea 7) es el mismo nombre que consume la barra lateral (Tarea 9); `invitarAdmin(email, nombre, rol)` (Tarea 8) coincide con el cuerpo `{ email, nombre, rol }` que lee la Edge Function; `productos` y `admins` son los nombres de los refs en sus dos composables y en los componentes que los usan.

---

## Execution Handoff

Plan completo y guardado en `docs/superpowers/plans/2026-09-19-nuevas-caracteristicas.md`. Dos opciones de ejecución:

**1. Subagent-Driven (recomendada)** — un subagente nuevo por tarea, revisión entre tareas, iteración rápida.

**2. Inline Execution** — ejecutar las tareas en esta misma sesión con `superpowers:executing-plans`, por lotes con puntos de control.

**¿Cuál prefiere?**
