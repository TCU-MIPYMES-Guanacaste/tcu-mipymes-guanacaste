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
const AdminsView = () => import('@/views/admin/AdminsView.vue')

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
      {
        path: 'administradores',
        name: 'admins',
        component: AdminsView,
        meta: { title: 'Administradores', requiresSuperadmin: true },
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
