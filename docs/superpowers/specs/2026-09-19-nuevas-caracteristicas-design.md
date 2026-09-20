# Spec de diseño — Nuevas Funcionalidades

**Fecha:** 2026-09-19
**Proyecto:** Directorio MIPYMES Guanacaste (TCU — UCR, Sede Guanacaste)
**Rama base:** `main` (incluye refactor de seguridad y rediseño visual "Guaitil")
**Rama de trabajo:** `Nuevas-caracteristicas`

## 1. Objetivo

Implementar las funcionalidades identificadas como pendientes al revisar qué faltaba de fases anteriores del proyecto:

1. **Productos Destacados** (Fase 3) — tabla y RLS ya existen desde la migración 001/002; no hay ningún código de aplicación.
2. **Gestión de categorías y cantones** desde el panel admin (hoy solo por SQL directo).
3. **Roles diferenciados** (`superadmin` / `editor`) — la columna existe pero nunca se consulta.
4. **Paginación** en el grid público y la tabla admin.
5. **Anti-doble-clic** en el contador de contactos por WhatsApp.

Todas comparten el mismo sistema de diseño ya establecido (tokens "Guaitil" en `src/assets/styles/main.css`) — ninguna introduce estilos nuevos. No cambia: RLS existente salvo lo indicado en la sección 4, políticas de `productos_destacados`/`categorias`/`cantones` (ya cubiertas desde el refactor), ni ningún test existente.

## 2. Productos Destacados (Fase 3)

### 2.1 Composable `useProductosDestacados.js` (nuevo)

Mismo patrón que `useProductores.js`: estado reactivo + funciones que envuelven llamadas a Supabase, con manejo de fotos anti-huérfanos (sube antes de insertar/actualizar, borra la anterior solo tras éxito, borra la nueva si el insert/update falla).

```
fetchProductos(productorId)              // SELECT * WHERE productor_id = :id ORDER BY nombre
crearProducto(productorId, datos)        // datos incluye fotoFile opcional
actualizarProducto(id, datos)
eliminarProducto(id)                     // borra también su foto
```

Reutiliza `useStorage()` para las fotos. `useStorage.uploadImage` hoy tiene la carpeta `'productores'` fija en una constante interna — se parametriza a `uploadImage(file, carpeta = 'productores')` para poder pasar `'productos'` sin duplicar lógica.

### 2.2 Admin: sección dentro del formulario de productor

Nuevo componente `ProductosDestacadosPanel.vue`, insertado en `ProducerForm.vue` **solo cuando se está editando un productor ya guardado** (`v-if="initialData?.id"`, prop `:productor-id="initialData.id"`). Al crear un productor nuevo, la sección no aparece — un texto breve indica que se pueden agregar productos después de guardar.

El panel lista los productos existentes (con foto miniatura, nombre, precio, disponibilidad) con acciones Editar/Eliminar, y un botón "Agregar producto" que despliega `ProductoDestacadoForm.vue` (nuevo, mismos campos que la tabla: nombre, descripción, precio de referencia, unidad, temporada, disponible, foto vía `ImageUploader.vue` reutilizado).

### 2.3 Público: vista de detalle

`ProductosDestacadosGrid.vue` (nuevo) en `ProducerDetailView.vue`, debajo de `.detail-contact`. `ProducerDetailView` llama `fetchProductos(producer.id)` en el mismo `onMounted` (independiente de `fetchProductorById`, sin tocar `useProductores.js`). Solo se muestra la sección si hay al menos un producto con `disponible = true`; los no disponibles se ocultan al público pero siguen visibles en el admin. Tarjetas con `--radius-xl`, mismo estilo visual que `ProducerCard.vue` (foto, nombre, precio, temporada).

## 3. Gestión de Categorías y Cantones

### 3.1 Extensión de `useCatalogos.js`

Se agregan, junto a los `fetch*` existentes:

```
crearCategoria(nombre, icono)   crearCanton(nombre)
renombrarCategoria(id, nombre)  renombrarCanton(id, nombre)
eliminarCategoria(id)           eliminarCanton(id)
```

`eliminarCategoria`/`eliminarCanton` primero comprueban si hay productores usando ese valor (`productor_categorias` para categorías, `productores.canton_id` para cantones); si hay alguno, la función no elimina y devuelve un mensaje de error claro ("No se puede eliminar: N productores usan esta categoría") en vez de dejar que la FK falle con un error genérico de Postgres.

Las políticas RLS de escritura de `categorias`/`cantones` ya están en `002_seguridad_admin_y_contactos.sql` con `es_admin()` — sin cambios, disponible para cualquier admin (editor o superadmin), según lo definido en la sección 4.

### 3.2 UI

Nuevo componente `CatalogosPanel.vue`, embebido como una sección adicional dentro de `AdminDashboardView.vue` (junto al panel general y el botón "Nuevo Productor", sin ruta ni ítem de sidebar nuevo). Dos listas simples lado a lado (categorías / cantones), cada fila con nombre + botones renombrar/eliminar, y un formulario mínimo arriba de cada lista para agregar uno nuevo.

## 4. Roles diferenciados y gestión de administradores

**Alcance del rol:** la única diferencia entre `superadmin` y `editor` es la gestión de otros administradores. Todo lo demás (productores, productos destacados, categorías/cantones) queda disponible para ambos roles por igual.

### 4.1 Corrección de seguridad necesaria (migración 003)

Hoy la política de UPDATE de `admin_profiles` usa `es_admin()`: **cualquier admin puede cambiar el rol de cualquier fila, incluida la propia** — un editor podría auto-ascenderse a superadmin. Esto no se notó antes porque nada usaba la columna `rol`. Al construir la gestión de admins hay que cerrarlo:

```sql
CREATE OR REPLACE FUNCTION public.es_superadmin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_profiles WHERE id = auth.uid() AND rol = 'superadmin'
  );
$$;

-- admin_profiles: INSERT, UPDATE y DELETE pasan a requerir superadmin
-- (antes: cualquier admin vía es_admin()). SELECT no cambia.
DROP POLICY IF EXISTS "admin_profiles_escritura"     ON public.admin_profiles;
DROP POLICY IF EXISTS "admin_profiles_actualizacion" ON public.admin_profiles;
DROP POLICY IF EXISTS "admin_profiles_eliminacion"   ON public.admin_profiles;

CREATE POLICY "admin_profiles_escritura"     ON public.admin_profiles FOR INSERT TO authenticated WITH CHECK (public.es_superadmin());
CREATE POLICY "admin_profiles_actualizacion" ON public.admin_profiles FOR UPDATE TO authenticated USING (public.es_superadmin()) WITH CHECK (public.es_superadmin());
CREATE POLICY "admin_profiles_eliminacion"   ON public.admin_profiles FOR DELETE TO authenticated USING (public.es_superadmin());
```

Idempotente igual que la 002 (`DROP POLICY IF EXISTS` antes de cada `CREATE`).

### 4.2 `useAuth.js`: exponer el rol

Se añade un `ref` a nivel de módulo (mismo patrón singleton que `currentUser`), poblado tras conocer la sesión: `adminRol` (`'superadmin' | 'editor' | null`) leído de `admin_profiles` por `id = auth.uid()`. `useAuth()` expone `adminRol` y `esSuperadmin = computed(() => adminRol.value === 'superadmin')`.

### 4.3 Nueva vista `/admin/administradores` (solo superadmin)

- Ruta nueva con `meta: { requiresAuth: true, requiresSuperadmin: true }`.
- `guardiaAutenticacion` (en `guard.js`) gana un chequeo adicional: si la ruta requiere superadmin, consulta `admin_profiles.rol` para el usuario de la sesión y redirige a `admin-dashboard` si no es superadmin. Se mantiene como función pura consultando Supabase directamente (mismo estilo que ya usa para `session`), sin depender de un composable Vue.
- `AdminSidebar.vue` muestra el enlace "Administradores" solo si `esSuperadmin` es `true` (usa `useAuth()`).
- Vista `AdminsView.vue` + componente `AdminsTable.vue`: lista de administradores (email, nombre, rol), botón eliminar por fila (deshabilitado en la propia fila del usuario actual, para evitar que un superadmin se quite a sí mismo el acceso por error) y un formulario "Invitar administrador" (email, nombre, rol).

**Eliminar un admin solo revoca su acceso** (borra la fila de `admin_profiles`); su cuenta de Supabase Auth no se elimina — mismo modelo de lista blanca que ya usa el resto del sistema, sin necesitar otra función privilegiada.

### 4.4 Composable `useAdmins.js` (nuevo)

```
fetchAdmins()                          // SELECT id, nombre_completo, rol, created_at FROM admin_profiles
invitarAdmin(email, nombre, rol)       // invoca la Edge Function
eliminarAdmin(id)                      // DELETE FROM admin_profiles
```

`admin_profiles` no guarda el correo (vive solo en `auth.users`, no expuesto por PostgREST al cliente). La tabla de administradores en el admin muestra **nombre y rol**, no correo — suficiente para un equipo pequeño de TCU. El correo solo se usa una vez, al invitar.

### 4.5 Edge Function `invitar-admin`

El navegador no puede crear cuentas de Supabase Auth para otra persona sin exponer una clave privada. Se despliega una Edge Function (`supabase/functions/invitar-admin/index.js`, JavaScript plano — el resto del proyecto evita TypeScript y esto es consistente aunque las Edge Functions corran en Deno, entorno separado del bundle de Vue):

1. Verifica el JWT de quien llama y confirma que su `admin_profiles.rol` es `'superadmin'` (defensa en profundidad: aunque solo el front se lo ofrece a superadmins, la función no debe confiar en eso).
2. Con la Service Role Key (variable de entorno propia de las Edge Functions de Supabase, nunca expuesta al cliente) llama a `supabase.auth.admin.inviteUserByEmail(email)` — esto crea el usuario en Auth (sin confirmar) y envía el correo de invitación.
3. Inserta la fila en `admin_profiles` con el `id` devuelto por la invitación, el `nombre` y el `rol` recibidos en el body.
4. Responde éxito/error en JSON; errores de Supabase se traducen a un mensaje simple.

**Requiere configuración manual fuera del código** (a documentar en el README, igual que las dos pendientes de fases anteriores): que el proyecto Supabase tenga el envío de correo configurado (SMTP propio o el de prueba de Supabase) para que la invitación llegue.

## 5. Paginación

**Mecanismo: en el cliente**, no en el servidor. Se sigue trayendo la lista completa desde Supabase como hoy (funciona bien con la escala actual del directorio) y se pagina solo la **presentación**. Esto evita romper dos cosas que ya funcionan: la búsqueda instantánea de `ProducerTable.vue` (que filtra sobre el arreglo completo ya cargado) y los KPIs de `AdminDashboardView.vue` (que cuentan ese mismo arreglo) — ninguna de las dos cambia.

### 5.1 Composable genérico `usePaginacion.js` (nuevo)

```js
usePaginacion(itemsRef, pageSize) // devuelve:
{ page, totalPages, pageItems, irAPagina(n), siguiente(), anterior(), resetear() }
```

`pageItems` es un `computed` que corta `itemsRef.value` según `page`. `resetear()` vuelve a la página 1 (se llama al cambiar filtros/búsqueda).

### 5.2 Componente `Pagination.vue` (nuevo, común)

Controles "← Anterior" / números de página / "Siguiente →", estilo pill con tokens existentes (mismo tratamiento que los botones `.btn`). Oculto por completo si `totalPages <= 1`.

### 5.3 Integración

- **`HomeView.vue`**: `usePaginacion(productores, 12)`; `ProducerGrid` recibe `pageItems` en vez de `productores`; `<Pagination>` debajo del grid; `applyFilters()` llama `resetear()`.
- **`ProducerTable.vue`**: `usePaginacion(filteredProductores, 15)`; el `<tbody>` recorre `pageItems`; un `watch(searchFilter, resetear)` vuelve a la página 1 al escribir en el buscador local.

## 6. Anti-doble-clic en el contador de WhatsApp

En `useContactos.js`, antes de llamar al RPC `registrar_contacto`: se lee `localStorage['contacto_ultimo_' + productorId]`; si la diferencia con `Date.now()` es menor a 60000 ms, se omite la llamada al RPC (pero el enlace de WhatsApp **siempre se abre igual** — el debounce solo afecta el registro de la métrica, nunca el contacto real). Tras cada intento (se haya llamado al RPC o no) se actualiza la marca de tiempo. `localStorage` puede fallar (modo privado, cuota) — se envuelve en `try/catch` y, si falla, simplemente se registra el contacto sin bloquear nada (igual que el resto del composable, que nunca lanza hacia afuera).

## 7. Testing

- Vitest para toda la lógica pura y composables nuevos: `useProductosDestacados` (mock de Supabase, patrón `thenable builder` ya usado en `tests/helpers/supabaseMock.js`), `useCatalogos` (nuevas funciones), `usePaginacion` (puro, sin red — tests directos de `pageItems`/`totalPages`/límites), `useContactos` (debounce, con `localStorage` mockeado).
- `guardiaAutenticacion`: casos nuevos para `requiresSuperadmin` (permite/redirige según rol).
- La Edge Function no se cubre con Vitest (entorno Deno); se verifica manualmente contra el proyecto Supabase real, igual que se hizo con las políticas RLS del refactor anterior.

## 8. Fuera de alcance

- Eliminar la cuenta de Supabase Auth de un administrador removido (solo se revoca el acceso vía `admin_profiles`).
- Paginación server-side / conteos exactos vía `count: 'exact'` — deliberadamente en el cliente (sección 5).
- Límite de anti-abuso del lado del servidor para `registrar_contacto` — el debounce es solo client-side (decisión explícita, ver sección 6).
- Historial/auditoría de cambios en categorías, cantones o administradores.
- Reordenar o destacar visualmente productos dentro de un mismo productor (se muestran en orden alfabético).
- Cualquier cambio de estilo o layout no descrito aquí — se reutiliza el sistema de diseño "Guaitil" tal cual existe hoy.
