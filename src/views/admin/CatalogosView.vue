<!--
  CatalogosView.vue - Gestión de categorías y cantones.

  Disponible para cualquier administrador (editor o superadmin); antes
  vivía embebida en AdminDashboardView, ahora tiene su propia pantalla.

  Ruta: /admin/categorias-cantones
-->
<script setup>
import CatalogosPanel from '@/components/admin/CatalogosPanel.vue'
</script>

<template>
  <div class="catalogos-view">
    <header class="admin-header">
      <h1 class="admin-title">Categorías y Cantones</h1>
    </header>

    <CatalogosPanel />
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
</style>
