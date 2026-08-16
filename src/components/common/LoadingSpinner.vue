<!--
  LoadingSpinner.vue - Indicador de carga reutilizable.

  Muestra una animación de carga con un mensaje opcional.
  Se usa en toda la aplicación mientras se esperan datos del servidor.

  Props:
  - message (String): Mensaje descriptivo de la carga (opcional)
-->
<script setup>
defineProps({
  /** Mensaje opcional que se muestra debajo del spinner */
  message: {
    type: String,
    default: 'Cargando...',
  },
})
</script>

<template>
  <div class="loading-spinner" role="status" aria-live="polite">
    <div class="spinner"></div>
    <p v-if="message" class="spinner-message">{{ message }}</p>
  </div>
</template>

<style scoped>
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.spinner-message {
  margin-top: 1rem;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
