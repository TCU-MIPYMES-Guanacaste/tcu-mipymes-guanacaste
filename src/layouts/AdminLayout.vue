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
