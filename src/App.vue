<!--
  Componente raíz de la aplicación.
  Contiene la estructura principal: encabezado, contenido dinámico (RouterView) y pie de página.
-->
<script setup>
import AppHeader from '@/components/common/AppHeader.vue'
import AppFooter from '@/components/common/AppFooter.vue'
</script>

<template>
  <div class="app-layout">
    <!-- Encabezado global de navegación -->
    <AppHeader />

    <!-- Contenido principal: cambia según la ruta activa -->
    <main class="main-content">
      <RouterView />
    </main>

    <!-- Pie de página con créditos -->
    <AppFooter />
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 1.5rem;
}
</style>
