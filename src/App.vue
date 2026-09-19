<!--
  Componente raíz de la aplicación.
  Estructura: encabezado, contenido dinámico (RouterView), pie de página y toasts.
-->
<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/common/AppHeader.vue'
import AppFooter from '@/components/common/AppFooter.vue'
import AppToast from '@/components/common/AppToast.vue'

const route = useRoute()

// Las rutas admin ocupan todo el ancho (sin el contenedor centrado)
const anchoCompleto = computed(() => route.matched.some((r) => r.meta?.fullWidth))
</script>

<template>
  <div class="app-layout">
    <!-- Encabezado global de navegación -->
    <AppHeader />

    <!-- Contenido principal: cambia según la ruta activa -->
    <main :class="['main-content', { 'main-content--full': anchoCompleto }]">
      <RouterView />
    </main>

    <!-- Pie de página con créditos -->
    <AppFooter />

    <!-- Notificaciones globales -->
    <AppToast />
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

.main-content--full {
  max-width: none;
  padding: 0;
}
</style>
