<!--
  AppToast.vue - Contenedor de notificaciones globales.

  Renderiza la cola de useToast en la esquina inferior derecha.
  Se monta una sola vez en App.vue.
-->
<script setup>
import { useToast } from '@/composables/useToast'

const { toasts, cerrar } = useToast()
</script>

<template>
  <div class="toast-container" aria-live="polite">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="['toast', `toast--${toast.tipo}`]"
        role="status"
      >
        <span class="toast-icon">{{ toast.tipo === 'exito' ? '✅' : '⚠️' }}</span>
        <span class="toast-mensaje">{{ toast.mensaje }}</span>
        <button
          type="button"
          class="toast-cerrar"
          aria-label="Cerrar notificación"
          @click="cerrar(toast.id)"
        >
          ×
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  bottom: var(--spacing-6);
  right: var(--spacing-6);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  z-index: 1000;
  max-width: min(360px, calc(100vw - 2 * var(--spacing-4)));
}

.toast {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-2);
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  background: var(--bg-surface);
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  border-left: 4px solid var(--color-info);
}

.toast--exito {
  border-left-color: var(--color-success);
}

.toast--error {
  border-left-color: var(--color-error);
}

.toast-mensaje {
  flex: 1;
  line-height: 1.4;
}

.toast-cerrar {
  background: none;
  border: none;
  font-size: var(--font-size-lg);
  line-height: 1;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 0 0.25rem;
}

.toast-enter-active,
.toast-leave-active {
  transition: all var(--transition-normal);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(0.5rem);
}
</style>
