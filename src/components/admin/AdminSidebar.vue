<!--
  AdminSidebar.vue - Barra lateral de navegación del panel de administración.

  Muestra los enlaces de navegación para las secciones del panel admin:
  - Dashboard / Resumen
  - Listado de productores
  - Crear nuevo productor
-->
<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <aside class="admin-sidebar">
    <nav class="sidebar-nav">
      <h3 class="sidebar-title">Administración</h3>

      <RouterLink to="/admin" class="sidebar-link" exact-active-class="sidebar-link--active">
        📊 Panel General
      </RouterLink>

      <RouterLink
        to="/admin/productores/nuevo"
        class="sidebar-link"
        active-class="sidebar-link--active"
      >
        ➕ Nuevo Productor
      </RouterLink>

      <div class="sidebar-divider"></div>

      <RouterLink to="/" class="sidebar-link sidebar-link--back">
        ← Volver al sitio
      </RouterLink>
    </nav>
  </aside>
</template>

<style scoped>
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
</style>
