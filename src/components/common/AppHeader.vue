<!--
  AppHeader.vue - Encabezado principal de navegación.

  Muestra el logotipo del directorio, el nombre del sitio y los enlaces
  de navegación principales. Incluye un enlace condicional al panel de
  administración cuando el usuario está autenticado.
-->
<script setup>
import { RouterLink, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { isAuthenticated, logout } = useAuth()

async function handleLogout() {
  try {
    await logout()
    router.push({ name: 'home' })
  } catch (err) {
    console.error('Error al cerrar sesión:', err)
  }
}
</script>

<template>
  <header class="app-header">
    <div class="header-container">
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

      <!-- Navegación principal -->
      <nav class="header-nav">
        <RouterLink to="/" class="nav-link">Inicio</RouterLink>

        <!-- Enlace al panel admin (solo visible si está autenticado) -->
        <template v-if="isAuthenticated">
          <RouterLink to="/admin" class="nav-link nav-link--admin">
            Panel Admin
          </RouterLink>
          <button class="nav-link nav-link--logout" @click="handleLogout">
            Cerrar Sesión
          </button>
        </template>
        <template v-else>
          <RouterLink to="/login" class="nav-link nav-link--login">
            Iniciar Sesión
          </RouterLink>
        </template>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  background-color: var(--color-primary);
  color: var(--color-white);
  padding: 0.75rem 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-container {
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

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

.header-nav {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.nav-link {
  color: var(--color-white);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.9rem;
  padding: 0.4rem 0.75rem;
  border-radius: 6px;
  transition: background-color 0.2s;
  background: none;
  border: none;
  cursor: pointer;
}

.nav-link:hover {
  background-color: rgba(255, 255, 255, 0.15);
}

.nav-link--admin {
  background-color: rgba(255, 255, 255, 0.1);
}

.nav-link--logout {
  opacity: 0.85;
  font-size: 0.85rem;
}

.nav-link--login {
  border: 1px solid rgba(255, 255, 255, 0.4);
}

.nav-link--login:hover {
  border-color: rgba(255, 255, 255, 0.8);
  background-color: rgba(255, 255, 255, 0.15) !important;
}
</style>
