# Spec de diseño — Rama `refactorizacion`

**Fecha:** 2026-09-15
**Proyecto:** Directorio MIPYMES Guanacaste (TCU — UCR, Sede Guanacaste)
**Rama base:** `main` (commit `fbab194`, Fase 1 funcional)
**Rama de trabajo:** `refactorizacion`

## 1. Objetivo

Dejar el código de la Fase 1 funcional, seguro, testeable y documentado, de modo que:

- El contacto por WhatsApp (la función central) funcione con números costarricenses.
- Solo administradores autorizados puedan modificar el directorio.
- Un equipo no informático pueda desplegar, mantener y transferir el proyecto siguiendo el README.
- El rediseño estético posterior (rama futura) parta de una base estable.

El rediseño visual **no** forma parte de esta rama.

## 2. Hallazgos que motivan el refactor

Detectados en el análisis del código en `main`:

| # | Hallazgo | Severidad |
|---|---|---|
| 1 | `generateWhatsAppLink` no antepone el código de país `506`; el formulario sugiere "8888 4444" → enlace `wa.me/88884444` inválido | Alta |
| 2 | Cualquier cuenta autenticada tiene permisos totales de escritura (`TO authenticated WITH CHECK (true)`); si el registro público está activo en Supabase, cualquiera puede crear una cuenta y borrar el directorio | Alta |
| 3 | Sin `vercel.json` → refrescar `/productor/:id` o `/admin` da 404 en Vercel | Alta |
| 4 | 5 variables CSS usadas pero nunca definidas (`--color-text`, `--color-text-muted`, `--color-text-light`, `--color-border`, `--color-surface-dark`) en `AppFooter`, `LoadingSpinner`, `ProducerGrid`, `ProducerCreateView`, `ProducerEditView` | Media |
| 5 | Imágenes huérfanas en Storage: no se borran al eliminar/reemplazar productor; la subida ocurre al seleccionar archivo, antes de guardar el formulario | Media |
| 6 | Fallos al crear/editar/eliminar son silenciosos para el usuario (solo `console.error`) | Media |
| 7 | `productores` con `activo = false` son legibles vía API por anónimos (teléfono y email incluidos) | Media |
| 8 | `useAuth` registra un listener por cada componente que lo usa; el `return` dentro de `onMounted` no limpia nada | Baja |
| 9 | Filtro por categoría hace 2 consultas y un `.in('id', [...])` | Baja |
| 10 | Búsqueda solo en `nombre_negocio` | Baja |
| 11 | `@vueuse/core` instalado y nunca importado; favicon `/vite.svg` inexistente | Baja |
| 12 | `email`/`descripcion` vacíos se guardan como `''` en vez de `NULL` | Baja |
| 13 | Sin README; sin pruebas automatizadas | Alta (para la entrega) |

## 3. Enfoque elegido

**Refactor por responsabilidades.** Se extrae la lógica pura a `src/utils/`, cada composable queda con una sola responsabilidad, y se agrega Vitest para lo que tiene lógica. No se introducen Pinia, TypeScript ni ningún paradigma nuevo: sigue siendo Vue 3 + Composition API + composables, que es lo que un estudiante puede leer y modificar.

Alternativas descartadas:
- *Parches en sitio*: rápido, pero nada queda testeable y la deuda sigue.
- *Pinia + TypeScript*: más robusto, pero agrega dos tecnologías que el equipo receptor tendría que aprender.

## 4. Estructura de código

### 4.1 Árbol resultante

```
tcu-mipymes-guanacaste/
├── public/
│   └── favicon.svg                      # NUEVO (reemplaza /vite.svg roto)
├── vercel.json                          # NUEVO: rewrite SPA
├── README.md                            # NUEVO
├── database/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql       # sin cambios
│   │   └── 002_seguridad_admin_y_contactos.sql   # NUEVO
│   └── seeds/001_seed_cantones_categorias.sql    # sin cambios
├── src/
│   ├── lib/supabase.js                  # solo cliente + getPublicImageUrl; lanza error si faltan env vars
│   ├── utils/                           # NUEVO — funciones puras, sin Supabase
│   │   ├── telefono.js
│   │   ├── whatsapp.js
│   │   └── busqueda.js
│   ├── composables/
│   │   ├── useAuth.js                   # reescrito
│   │   ├── useProductores.js            # ajustado
│   │   ├── useCatalogos.js              # sin cambios
│   │   ├── useStorage.js                # NUEVO
│   │   ├── useContactos.js              # NUEVO
│   │   └── useToast.js                  # NUEVO
│   ├── layouts/
│   │   └── AdminLayout.vue              # NUEVO
│   ├── components/
│   │   ├── common/AppToast.vue          # NUEVO
│   │   ├── admin/ImageUploader.vue      # subida diferida
│   │   └── producers/WhatsAppButton.vue # registra contacto
│   ├── router/index.js                  # rutas anidadas /admin + /restablecer-contrasena
│   └── views/
│       ├── ResetPasswordView.vue        # NUEVO
│       └── admin/*.vue                  # sin layout duplicado
└── tests/                               # NUEVO (Vitest)
    ├── utils/
    ├── composables/
    └── router/
```

### 4.2 `src/utils/` — funciones puras

**`telefono.js`**

| Función | Entrada | Salida |
|---|---|---|
| `normalizarTelefono(texto)` | `'8888-4444'`, `'8888 4444'`, `'+506 8888 4444'`, `'50688884444'` | `'50688884444'` |
| | `'123'`, `''`, `null`, `'1234567890123'` | `null` |
| `esTelefonoValido(texto)` | cualquier string | `true` si `normalizarTelefono` no es `null` |
| `formatearTelefono(normalizado)` | `'50688884444'` | `'8888-4444'` |
| | valor no normalizable | el mismo valor sin cambios |

Regla de normalización: quitar todo lo que no sea dígito; si quedan 8 dígitos, anteponer `506`; si quedan 11 y empiezan con `506`, aceptar; cualquier otro caso → `null`. Solo Costa Rica.

**`whatsapp.js`**

`generarEnlaceWhatsApp(telefonoNormalizado, nombreNegocio)` → `https://wa.me/50688884444?text=<mensaje codificado>`. El mensaje es el actual ("Hola, encontré su negocio … en el Directorio MIPYMES Guanacaste …"). Si el teléfono no es válido, devuelve `''`.

**`busqueda.js`**

`sanitizarBusqueda(texto)` → elimina `, ( ) % _`, colapsa espacios, `trim`, recorta a 100 caracteres. Estos caracteres tienen significado en la sintaxis de filtros `.or()` de PostgREST.

### 4.3 `src/lib/supabase.js`

- Exporta `supabase` y `getPublicImageUrl(path)`.
- Si `VITE_SUPABASE_URL` o `VITE_SUPABASE_ANON_KEY` faltan, **lanza** `new Error('[Supabase] Faltan las variables VITE_SUPABASE_URL y/o VITE_SUPABASE_ANON_KEY. Copie .env.example a .env y complete los valores.')`. Hoy solo hace `console.error` y sigue con un cliente roto (pantalla en blanco sin explicación).
- `generateWhatsAppLink` se muda a `utils/whatsapp.js`.

### 4.4 Composables

**`useAuth.js`** (reescrito)

- Estado singleton a nivel de módulo: `currentUser`, `authReady` (promesa que resuelve tras el primer `getSession()`).
- El `getSession()` inicial y el `onAuthStateChange` se ejecutan **una sola vez** al importar el módulo. Se elimina el `onMounted`.
- API: `currentUser`, `isAuthenticated`, `loading`, `error`, `login(email, password)`, `logout()`, `resetPassword(email)`, `updatePassword(nueva)`.
- `resetPassword` llama `supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/restablecer-contrasena` })`.
- `updatePassword` llama `supabase.auth.updateUser({ password })`.

**`useStorage.js`** (nuevo)

- `uploadImage(file)` → sube a `product-images/productores/<timestamp>-<aleatorio>.<ext>`, devuelve la ruta relativa. Lógica actual de `useProductores.uploadImage`, movida.
- `deleteImage(path)` → `supabase.storage.from('product-images').remove([path])`. Ignora `path` vacío. Los errores se registran en consola pero **no** se propagan: un fallo al borrar una foto no debe impedir borrar el productor.

**`useProductores.js`** (ajustado)

- `fetchProductores(filters)`:
  - Búsqueda: `.or(`nombre_negocio.ilike.%${q}%,descripcion.ilike.%${q}%`)` con `q = sanitizarBusqueda(filters.search)`. Si `q` queda vacío, no se aplica.
  - Filtro por categoría: una sola consulta con `filtro:productor_categorias!inner(categoria_id)` y `.eq('filtro.categoria_id', id)`, usando un alias distinto del embed `categorias:productor_categorias(categoria:categorias(id, nombre))` para que la lista de categorías del productor no se filtre. **Se verifica contra Supabase real antes de adoptarlo**; si el doble embed no funciona, se mantiene la implementación actual de 2 consultas.
- `createProductor(data)` / `updateProductor(id, data)`:
  - Reciben `data.fotoFile` (un `File` o `null`) además de los campos. Si hay `fotoFile`, lo suben con `useStorage.uploadImage` y asignan `foto_url`. En update, si la ruta anterior es distinta de la nueva (o el usuario quitó la foto), borran la anterior con `deleteImage`.
  - Limpian datos antes de escribir: `trim()` en strings; `email`, `descripcion`, `direccion_detalle` vacíos → `null`; `telefono` → `normalizarTelefono()`.
- `deleteProductor(id)`: obtiene `foto_url` del registro, borra el registro, luego borra la imagen.
- `uploadImage` se elimina de aquí (vive en `useStorage`).

**`useContactos.js`** (nuevo)

- `registrarContacto(productorId)` → `supabase.rpc('registrar_contacto', { p_productor_id })`. Cualquier error se ignora en silencio (solo `console.warn`). Nunca lanza.
- `fetchResumenContactos()` → lee la vista `resumen_contactos_whatsapp`; devuelve `{ porProductor: Map<productor_id, {total, ultimos_30_dias}>, total, ultimos30Dias }`.

**`useToast.js`** (nuevo)

- Cola singleton `toasts: ref([])`. `mostrarExito(mensaje)`, `mostrarError(mensaje)`. Cada toast se autodescarta a los 4 s; el usuario puede cerrarlo antes.
- `AppToast.vue` renderiza la cola en una esquina; se monta una vez en `App.vue`.

### 4.5 Layout y rutas admin

**`layouts/AdminLayout.vue`**: `AdminSidebar` + `<RouterView />` en un contenedor flex. Es el único lugar que conoce el ancho del sidebar. Desaparecen las 3 copias de `.admin-layout` / `.admin-content` y el hack `margin: -1.5rem`.

**`router/index.js`**:

```js
{
  path: '/admin',
  component: AdminLayout,
  meta: { requiresAuth: true },
  children: [
    { path: '', name: 'admin-dashboard', component: AdminDashboardView, meta: { title: 'Panel de Administración' } },
    { path: 'productores/nuevo', name: 'producer-create', component: ProducerCreateView, meta: { title: 'Nuevo Productor' } },
    { path: 'productores/:id/editar', name: 'producer-edit', component: ProducerEditView, props: true, meta: { title: 'Editar Productor' } },
  ],
},
{ path: '/restablecer-contrasena', name: 'reset-password', component: ResetPasswordView, meta: { title: 'Restablecer Contraseña' } },
```

El guard usa `to.matched.some(r => r.meta.requiresAuth)` para que el `meta` del padre proteja a los hijos. La lógica del guard se exporta como función independiente (`guardiaAutenticacion(to)`) para poder probarla sin instanciar el router completo; `router.beforeEach` solo la invoca.

### 4.6 Corrección de tokens CSS

| Usado (indefinido) | Reemplazo (existe en `main.css`) |
|---|---|
| `--color-text` | `--text-primary` |
| `--color-text-muted` | `--text-muted` |
| `--color-text-light` | `--text-secondary` |
| `--color-border` | `--color-neutral-200` |
| `--color-surface-dark` | `--color-neutral-800` |

### 4.7 Dependencias

- Quitar: `@vueuse/core`.
- Agregar (dev): `vitest`.
- Scripts nuevos en `package.json`: `"test": "vitest run"`, `"test:watch": "vitest"`.

## 5. Base de datos y seguridad

Todo en `database/migrations/002_seguridad_admin_y_contactos.sql`. Idempotente: `DROP POLICY IF EXISTS`, `CREATE OR REPLACE FUNCTION`, `CREATE TABLE IF NOT EXISTS`, `CREATE OR REPLACE VIEW`.

### 5.1 Lista blanca de administradores

```sql
CREATE OR REPLACE FUNCTION public.es_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid());
$$;
```

- `SECURITY DEFINER` evita la recursión de RLS al consultar `admin_profiles` desde sus propias políticas.
- Se reemplazan **todas** las políticas de INSERT/UPDATE/DELETE de `cantones`, `categorias`, `productores`, `productor_categorias`, `productos_destacados` y `admin_profiles` por `TO authenticated USING (es_admin()) WITH CHECK (es_admin())`.
- `admin_profiles` SELECT: `USING (id = auth.uid() OR es_admin())`.
- Políticas de Storage sobre `storage.objects` para `bucket_id = 'product-images'`: SELECT público; INSERT/UPDATE/DELETE con `es_admin()`. En la migración 001 estas políticas existían solo como comentario; aquí se crean de verdad.
- **Bootstrap del primer admin** (manual, documentado en README): crear el usuario en Authentication → Users, luego en SQL Editor:
  ```sql
  INSERT INTO admin_profiles (id, nombre_completo, rol)
  VALUES ('<uuid copiado de auth.users>', 'Nombre Apellido', 'superadmin');
  ```
  No se crea un trigger automático sobre `auth.users`: convertiría cualquier registro en admin y anularía la lista blanca.

### 5.2 Productores inactivos ocultos en la API

`productores` SELECT: `USING (activo = true OR es_admin())`. `productor_categorias` mantiene SELECT público (solo expone pares de UUIDs).

### 5.3 Métrica de contactos

```sql
CREATE TABLE IF NOT EXISTS contactos_whatsapp (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  productor_id UUID        NOT NULL REFERENCES productores(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_contactos_productor ON contactos_whatsapp(productor_id);
CREATE INDEX IF NOT EXISTS idx_contactos_created  ON contactos_whatsapp(created_at);
```

- No se guarda IP, user-agent ni ningún dato identificable.
- RLS: SELECT solo `es_admin()`. No existe política de INSERT: nadie inserta directo.
- RPC:
  ```sql
  CREATE OR REPLACE FUNCTION public.registrar_contacto(p_productor_id uuid)
  RETURNS void
  LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = public
  AS $$
  BEGIN
    IF EXISTS (SELECT 1 FROM productores WHERE id = p_productor_id AND activo = true) THEN
      INSERT INTO contactos_whatsapp (productor_id) VALUES (p_productor_id);
    END IF;
  END;
  $$;
  GRANT EXECUTE ON FUNCTION public.registrar_contacto(uuid) TO anon, authenticated;
  ```
- Vista para el panel:
  ```sql
  CREATE OR REPLACE VIEW public.resumen_contactos_whatsapp
  WITH (security_invoker = true) AS
  SELECT
    productor_id,
    COUNT(*)::int                                                    AS total,
    COUNT(*) FILTER (WHERE created_at >= now() - interval '30 days')::int AS ultimos_30_dias
  FROM contactos_whatsapp
  GROUP BY productor_id;
  ```
  `security_invoker` hace que la vista respete el RLS de la tabla → solo admins la leen.
- Riesgo asumido: alguien podría llamar el RPC en bucle e inflar los números. Cada fila pesa ~60 bytes; no compromete el free tier. Para un sitio de TCU el riesgo es bajo y no justifica un mecanismo anti-abuso en esta fase.

### 5.4 Normalización de teléfonos existentes

```sql
UPDATE productores
SET telefono = CASE
  WHEN length(regexp_replace(telefono, '\D', '', 'g')) = 8
    THEN '506' || regexp_replace(telefono, '\D', '', 'g')
  ELSE regexp_replace(telefono, '\D', '', 'g')
END;
```

Los números que no tengan 8 ni 11 dígitos quedan solo con sus dígitos (sin `506`); el formulario los marcará como inválidos la próxima vez que se edite ese productor, y `generarEnlaceWhatsApp` devolverá `''` para ellos (el botón de WhatsApp no se muestra).

### 5.5 Configuración manual en el dashboard de Supabase (README)

- Authentication → Providers → Email → desactivar **"Allow new users to sign up"**.
- Authentication → URL Configuration → **Site URL** = dominio de Vercel; **Redirect URLs** incluye `https://<dominio>/restablecer-contrasena` y `http://localhost:5173/restablecer-contrasena`.

## 6. Correcciones funcionales (frontend)

### 6.1 Formulario de productor

- Validación de teléfono con `esTelefonoValido()`. Mensaje: "Ingrese un número de 8 dígitos (ej: 8888-4444)".
- Placeholder: `Ej: 8888-4444`.
- `ImageUploader` ya no sube: comprime, muestra preview, emite `File` (`@archivo-seleccionado`) o `null` (`@quitar`). El formulario emite `{ ...campos, categoria_ids, fotoFile, foto_url }`; la vista pasa eso a `createProductor`/`updateProductor`.
- Compresión: máx. 1000×1000, salida **WebP** calidad 0.8 (≈30 % menos peso que JPEG). Solo se comprime si el archivo supera 200 KB.

### 6.2 Vistas admin

- `ProducerCreateView` / `ProducerEditView`: tras `createProductor`/`updateProductor`, `mostrarExito('Productor guardado')` y redirigir; si devuelve `null`, `mostrarError(error.value)` y quedarse en el formulario.
- `AdminDashboardView`: `handleDelete` → `mostrarExito`/`mostrarError` según resultado. Se mantiene `window.confirm` para confirmar.
- KPIs: **Total productores · Visibles · Contactos totales · Contactos últimos 30 días**.
- `ProducerTable`: columna nueva **Contactos** (total por productor; `0` si no hay).

### 6.3 Vista pública

- `SearchBar` placeholder: "Buscar por nombre o descripción...".
- `ProducerDetailView`: muestra el teléfono con `formatearTelefono()`. Pasa `productorId` a `WhatsAppButton`.
- `WhatsAppButton`: props `telefono`, `nombreNegocio`, `productorId`. En `@click` llama `registrarContacto(productorId)` sin `await`. El `href` se genera con `generarEnlaceWhatsApp`. Se mantiene `target="_blank"` para que la página siga viva y la llamada termine.

### 6.4 Recuperar contraseña

- `LoginView`: enlace "¿Olvidó su contraseña?" alterna a un mini-formulario con campo de correo y botón "Enviar enlace de recuperación". Tras enviar, **siempre** muestra "Si el correo está registrado, recibirá un enlace en unos minutos" (no revela si la cuenta existe). Botón "Volver a iniciar sesión".
- `ResetPasswordView` (`/restablecer-contrasena`):
  - Al montar, espera `authReady`. Si hay sesión (el enlace del correo la crea), muestra el formulario: nueva contraseña + confirmación. Reglas: mínimo 8 caracteres, ambas iguales.
  - Al enviar, `updatePassword(nueva)`. Éxito → `mostrarExito('Contraseña actualizada')` y redirigir a `/admin`. Error → mostrarlo en línea.
  - Sin sesión → "Enlace inválido o expirado. Solicite uno nuevo desde la pantalla de inicio de sesión." con botón a `/login`.
- El guard del router **no** redirige `/restablecer-contrasena` a `/admin` aunque haya sesión (esa regla solo aplica a `/login`).

### 6.5 Despliegue

- `vercel.json`:
  ```json
  { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
  ```
- `public/favicon.svg`: hoja/brote simple en verde `#1b4332`, < 1 KB. `index.html` apunta a `/favicon.svg`.

## 7. Pruebas (Vitest)

Sin navegador, sin Supabase real. `supabase` se simula con `vi.mock('@/lib/supabase')`.

| Archivo | Casos |
|---|---|
| `tests/utils/telefono.test.js` | 8 dígitos, con guion, con espacios, con `+506`, con `506` sin `+`, 11 dígitos, longitud inválida, vacío, `null`, formateo, formateo de valor inválido |
| `tests/utils/whatsapp.test.js` | enlace con `506`, mensaje codificado, nombre con `&`/`ñ`/comillas, teléfono inválido → `''` |
| `tests/utils/busqueda.test.js` | quita `, ( ) % _`, colapsa espacios, recorta a 100, vacío → `''` |
| `tests/composables/useProductores.test.js` | búsqueda usa `.or` con texto sanitizado; búsqueda vacía no aplica filtro; `deleteProductor` borra imagen; `updateProductor` borra imagen anterior si cambió y no la borra si es la misma; `''` → `null`; teléfono normalizado antes de insertar |
| `tests/composables/useAuth.test.js` | `login` setea `currentUser`; `logout` lo limpia; `resetPassword` pasa `redirectTo` correcto; error de login se expone en `error` |
| `tests/router/guard.test.js` | sin sesión + ruta admin → login con `redirect`; con sesión + `/login` → `/admin`; con sesión + `/restablecer-contrasena` → permite; ruta hija de `/admin` hereda `requiresAuth` |

No se prueban componentes visuales: cambiarán con el rediseño.

## 8. Documentación

`README.md` en español, dirigido a quien nunca vio el proyecto:

1. Qué es y para quién.
2. Requisitos (Node 18+, cuenta Supabase, cuenta Vercel; todo gratuito).
3. Configurar Supabase paso a paso: crear proyecto → SQL Editor: `001` → `002` → seed → Storage: crear bucket `product-images` público → Authentication: desactivar registro público → URL Configuration.
4. Crear el primer administrador (dónde hacer clic + el `INSERT` exacto + cómo copiar el UUID).
5. Ejecutar en local (`.env`, `npm install`, `npm run dev`).
6. Desplegar en Vercel (importar repo, 2 variables de entorno, deploy).
7. Mantenimiento: agregar admin, quitar admin, agregar categoría/cantón (SQL), consultar contactos para un informe (SQL de ejemplo por mes y por productor).
8. Límites del plan gratuito (500 MB BD, 1 GB Storage, 2-4 correos/hora del SMTP integrado, pausa del proyecto tras 7 días sin actividad) y qué hacer si se superan.
9. Problemas frecuentes: pantalla en blanco → env vars; "no puedo guardar" → no está en `admin_profiles`; correo de recuperación no llega → límite SMTP o Redirect URL; 404 al refrescar → falta `vercel.json`.

## 9. Verificación final

- `npm run build` → 0 errores.
- `npm test` → todo verde.
- Migración 002 ejecutada contra el proyecto Supabase real.
- Smoke test manual: login → crear productor con foto → editar (cambiar foto; la anterior desaparece del bucket) → ocultar → verificar que no aparece en público ni vía API anónima → eliminar (foto desaparece del bucket) → clic en WhatsApp desde el detalle → contador sube en el panel → flujo completo de recuperación de contraseña.

## 10. Fuera de alcance

- Rediseño estético (rama siguiente, basada en `refactorizacion`).
- Gestión de categorías/cantones desde el panel (siguen vía SQL).
- Roles `superadmin`/`editor` con permisos distintos (la columna existe; no se usa).
- Productos destacados (Fase 3).
- Paginación (innecesaria con < 500 productores).
- Mecanismo anti-abuso del RPC de contactos.

## 11. Orden de implementación sugerido

1. Infraestructura de pruebas + `utils/` (teléfono, WhatsApp, búsqueda) con sus tests.
2. `lib/supabase.js` (validación de env), `useAuth` reescrito, `useStorage`, `useToast` + `AppToast`.
3. Migración 002 (ejecutar contra Supabase real y verificar el filtro de categoría en una consulta).
4. `useProductores` ajustado + tests.
5. `AdminLayout` + rutas anidadas + guard + tests; corrección de tokens CSS; quitar `@vueuse/core`.
6. Subida diferida de imagen (`ImageUploader`, `ProducerForm`, vistas Create/Edit con toasts).
7. Recuperación de contraseña (`LoginView`, `ResetPasswordView`, ruta).
8. Métrica de contactos (`useContactos`, `WhatsAppButton`, KPIs y columna en el panel).
9. `vercel.json`, favicon, README.
10. Verificación final (sección 9).
