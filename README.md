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
4. [Invitaciones de administradores (Edge Function)](#4-invitaciones-de-administradores-edge-function)
5. [Ejecutar en la computadora](#5-ejecutar-en-la-computadora)
6. [Publicar en Vercel](#6-publicar-en-vercel)
7. [Tareas de mantenimiento](#7-tareas-de-mantenimiento)
8. [Límites del plan gratuito](#8-límites-del-plan-gratuito)
9. [Problemas frecuentes](#9-problemas-frecuentes)
10. [Estructura del código](#10-estructura-del-código)

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
5. Repita con `database/migrations/003_roles_y_seguridad_admin.sql` (roles
   `superadmin` / `editor` y cierre del permiso de escritura sobre
   `admin_profiles`).
6. Repita con `database/seeds/001_seed_cantones_categorias.sql` (carga los 11
   cantones y 9 categorías iniciales).
7. **Storage** → **New bucket** → nombre exacto `product-images` → active
   **Public bucket** → **Save**.
8. **Authentication → Providers → Email** → desactive
   **"Allow new users to sign up"** → **Save**.
   > Sin esto, cualquier persona podría crear una cuenta. Con la migración 002
   > no podría modificar nada, pero es mejor cerrar la puerta.
9. **Authentication → URL Configuration**:
   - **Site URL:** la dirección pública del sitio (por ejemplo
     `https://mipymes-guanacaste.vercel.app`). Si aún no la tiene, ponga
     `http://localhost:5173` y cámbiela después de publicar.
   - **Redirect URLs** → **Add URL**, agregue estas dos:
     - `http://localhost:5173/restablecer-contrasena`
     - `https://SU-DOMINIO.vercel.app/restablecer-contrasena`
10. **Project Settings → API** → copie **Project URL** y **anon public** key.
    Los necesitará en los pasos 5 y 6.

### Proyecto existente (ya tiene la migración 001)

Si el proyecto de Supabase ya estaba funcionando con la Fase 1:

1. Ejecute `database/migrations/002_seguridad_admin_y_contactos.sql` y luego
   `database/migrations/003_roles_y_seguridad_admin.sql` en el SQL Editor, en
   ese orden. Ambas son seguras de ejecutar más de una vez.
2. Las políticas de Storage creadas a mano desde el panel (Storage → Policies)
   **no** se eliminan automáticamente y dejarían escribir a cualquier usuario
   autenticado. Revíselas con:

   ```sql
   SELECT policyname, cmd FROM pg_policies
   WHERE schemaname = 'storage' AND tablename = 'objects';
   ```

   Deben quedar únicamente las cuatro que empiezan por `imagenes_`. Elimine
   cualquier otra desde Storage → Policies o con
   `DROP POLICY "nombre" ON storage.objects;`.
3. Complete los pasos 8, 9 y la sección 3 (crear el administrador).

> **Orden importante:** ejecute la migración 002 **antes** de fusionar el código
> nuevo a la rama `main`, porque cada `push` a `main` publica el sitio
> automáticamente y el código nuevo espera que la migración ya esté aplicada.

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

> **Estado de este despliegue:** el código de la función y su configuración
> (`supabase/functions/invitar-admin/index.js`, `supabase/config.toml`) ya
> están en el repositorio, pero el despliegue (4.2) y la configuración de SMTP
> (4.1) son pasos manuales contra el proyecto real de Supabase que quedan
> pendientes de ejecutar.

## 5. Ejecutar en la computadora

```bash
git clone https://github.com/HeinnerV/tcu-mipymes-guanacaste.git
cd tcu-mipymes-guanacaste
npm install
```

Copie `.env.example` a `.env` y complete con los valores del paso 2.10:

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

## 6. Publicar en Vercel

1. En Vercel: **Add New → Project** → **Import** este repositorio de GitHub.
2. Framework: se detecta **Vite** automáticamente. No cambie nada más.
3. **Environment Variables** → agregue las dos mismas variables del `.env`:
   `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
4. **Deploy**. En 1-2 minutos tendrá una URL `https://....vercel.app`.
5. Vuelva a Supabase → **Authentication → URL Configuration** y ponga esa URL
   como **Site URL** y agregue `https://....vercel.app/restablecer-contrasena`
   a **Redirect URLs** (paso 2.9).

Cada `git push` a la rama `main` vuelve a publicar automáticamente.

El archivo `vercel.json` del repositorio hace que todas las rutas
(`/productor/...`, `/admin`) carguen la aplicación; sin él, refrescar la
página daría error 404.

## 7. Tareas de mantenimiento

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

> **Nota:** eliminar un productor borra también su historial de contactos
> (`ON DELETE CASCADE`), así que los totales históricos bajan. Si el dato
> importa para un informe, es mejor **ocultarlo** (desmarcar "activo") que
> eliminarlo.

**Un administrador olvidó su contraseña:** en la pantalla de inicio de sesión
hay un enlace "¿Olvidó su contraseña?" que envía un correo de recuperación.
Si prefiere hacerlo a mano: **Authentication → Users → (usuario) → Reset
password**.

## 8. Límites del plan gratuito

| Recurso | Límite Free | Qué significa aquí |
|---|---|---|
| Base de datos | 500 MB | Miles de productores; sin riesgo real |
| Storage | 1 GB | Las fotos se comprimen a ~100-200 KB → ~5.000 fotos |
| Correos de Auth | 2-4 por hora | Suficiente para recuperar contraseñas; no para envíos masivos |
| Inactividad | 7 días sin uso pausa el proyecto | Entrar a `supabase.com` y **Restore** lo reactiva en 1-2 min |
| Vercel | 100 GB de transferencia/mes | Muy por encima del tráfico esperado |

Si el proyecto se pausa por inactividad, el sitio muestra un error de conexión
hasta que alguien lo restaure desde el panel de Supabase.

## 9. Problemas frecuentes

**Pantalla en blanco al abrir el sitio.**
Faltan las variables de entorno. En local: revise `.env`. En Vercel:
*Settings → Environment Variables* y vuelva a hacer **Redeploy**. Abra la
consola del navegador (F12): verá el mensaje `[Supabase] Faltan las variables...`.

**Puedo iniciar sesión pero al guardar dice que no se pudo.**
El usuario no está en `admin_profiles`. Ver sección 3.

**No llega el correo de recuperación.**
1. Revise spam. 2. Espere: el límite es 2-4 correos por hora. 3. Verifique que
la URL del sitio esté en **Redirect URLs** (sección 2.9).

**Al hacer clic en el enlace del correo dice "Enlace inválido o expirado".**
El enlace dura 1 hora y sirve una sola vez. Pida uno nuevo. Si vuelve a fallar,
revise **Redirect URLs**.

**Refrescar `/admin` o `/productor/...` da 404 en Vercel.**
Falta `vercel.json` en el repositorio o el deploy es anterior a ese archivo.
Haga **Redeploy**.

**El botón de WhatsApp no aparece en un productor.**
Su teléfono no es válido (no tiene 8 dígitos). Edítelo desde el panel.

**El sitio muestra un mensaje de error al cargar los productores.**
El proyecto de Supabase está pausado (sección 8) o la clave `anon` cambió.

**Reactivar un administrador revocado.**
Revocar acceso (`eliminarAdmin` o el botón "Revocar" del panel) solo borra la
fila de `admin_profiles`; nunca elimina la cuenta de Supabase Auth. Por eso,
si vuelve a invitar por la interfaz a ese mismo correo, la Edge Function
responderá que el correo ya tiene una cuenta. Para reactivarlo sin crear una
cuenta nueva, ejecute en el **SQL Editor** de Supabase:

```sql
-- 1. Buscar el UUID del usuario existente por correo
SELECT id FROM auth.users WHERE email = 'correo@ejemplo.com';

-- 2. Volver a darlo de alta en la lista blanca con ese UUID
INSERT INTO public.admin_profiles (id, nombre_completo, rol)
VALUES ('UUID-OBTENIDO-ARRIBA', 'Nombre Completo', 'editor');
```

**Me quedé sin ningún superadmin.**
La migración 003 revisa esto solo al aplicarse y, si no encuentra ninguno,
deja un `RAISE WARNING` en el log de Postgres (fácil de no ver). Si llegó a
esa situación, reasigne el rol manualmente en el **SQL Editor**:

```sql
UPDATE public.admin_profiles SET rol = 'superadmin' WHERE id = '<uuid-del-admin>';
```

## 10. Estructura del código

```
src/
├── lib/supabase.js          Cliente de Supabase (lanza error si faltan variables)
├── utils/                   Funciones puras, sin Supabase, con pruebas
│   ├── telefono.js          Normalizar/validar/formatear teléfonos de CR
│   ├── whatsapp.js          Enlace wa.me con mensaje predefinido
│   ├── busqueda.js          Limpieza del texto de búsqueda
│   └── precio.js            Formato de precios de referencia en colones
├── composables/             Estado reactivo + una responsabilidad cada uno
│   ├── useAuth.js           Sesión, login, logout, recuperar contraseña
│   ├── useProductores.js    CRUD de productores (usa useStorage para fotos)
│   ├── useProductosDestacados.js  CRUD de productos destacados de un productor
│   ├── useStorage.js        Subir/eliminar imágenes del bucket
│   ├── useCatalogos.js      Cantones y categorías
│   ├── useContactos.js      Métrica de contactos por WhatsApp
│   ├── useAdmins.js         Listar, invitar y revocar administradores (solo superadmin)
│   ├── usePaginacion.js     Paginación en el cliente para listas ya cargadas
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
├── migrations/003_...sql    Roles diferenciados y cierre de escalada de privilegios
└── seeds/001_...sql         Cantones y categorías iniciales

supabase/
└── functions/invitar-admin/ Edge Function que crea la cuenta e invita por correo

tests/                       Pruebas con Vitest (npm test)
docs/superpowers/            Especificación y plan de la refactorización
```

Convenciones: Vue 3 con `<script setup>`, todo en español, sin TypeScript ni
gestores de estado externos, para que cualquier estudiante pueda mantenerlo.
La Edge Function es la única excepción: corre en Deno, fuera del bundle de
Vue, pero se mantiene en JavaScript plano por consistencia con el resto.
