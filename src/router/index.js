/**
 * Configuración del enrutador de la aplicación.
 *
 * Define las rutas públicas, de autenticación y de administración.
 * Incluye un guardia de navegación global para proteger las rutas admin.
 */
import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '@/lib/supabase'

// Importación diferida (lazy loading) de vistas para optimizar la carga inicial
const HomeView = () => import('@/views/HomeView.vue')
const ProducerDetailView = () => import('@/views/ProducerDetailView.vue')
const LoginView = () => import('@/views/LoginView.vue')
const AdminDashboardView = () => import('@/views/admin/AdminDashboardView.vue')
const ProducerCreateView = () => import('@/views/admin/ProducerCreateView.vue')
const ProducerEditView = () => import('@/views/admin/ProducerEditView.vue')

// Definición de rutas
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
    meta: { title: 'Detalle del Productor' },
    props: true,
  },

  // --- Ruta de autenticación (oculta en la navegación) ---
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { title: 'Iniciar Sesión - Admin' },
  },

  // --- Rutas de administración (requieren autenticación) ---
  {
    path: '/admin',
    name: 'admin-dashboard',
    component: AdminDashboardView,
    meta: {
      title: 'Panel de Administración',
      requiresAuth: true,
    },
  },
  {
    path: '/admin/productores/nuevo',
    name: 'producer-create',
    component: ProducerCreateView,
    meta: {
      title: 'Nuevo Productor',
      requiresAuth: true,
    },
  },
  {
    path: '/admin/productores/:id/editar',
    name: 'producer-edit',
    component: ProducerEditView,
    meta: {
      title: 'Editar Productor',
      requiresAuth: true,
    },
    props: true,
  },
]

// Crear instancia del enrutador
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  // Desplazar al inicio de la página en cada navegación
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0 }
  },
})

/**
 * Guardia de navegación global.
 *
 * 1. Verifica si la ruta requiere autenticación (meta.requiresAuth)
 * 2. Si la requiere, consulta la sesión activa en Supabase
 * 3. Si no hay sesión, redirige al login
 * 4. Si el usuario ya está autenticado e intenta ir al login, redirige al admin
 */
router.beforeEach(async (to, _from) => {
  // Actualizar el título de la página
  if (to.meta.title) {
    document.title = to.meta.title
  }

  // Obtener la sesión actual del usuario
  const { data: { session } } = await supabase.auth.getSession()
  const isAuthenticated = !!session

  // Si la ruta requiere autenticación y el usuario no está autenticado
  if (to.meta.requiresAuth && !isAuthenticated) {
    // Redirigir al login, guardando la ruta original como query param
    return {
      name: 'login',
      query: { redirect: to.fullPath },
    }
  }

  // Si el usuario ya está autenticado e intenta ir al login, redirigir al admin
  if (to.name === 'login' && isAuthenticated) {
    return { name: 'admin-dashboard' }
  }

  // Permitir la navegación
  return true
})

export default router
