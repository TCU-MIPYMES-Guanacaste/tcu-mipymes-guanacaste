<!--
  Pagination.vue - Controles de paginación.

  Solo presentación: recibe la página actual y el total, y emite a dónde ir.
  Quien pagina de verdad es usePaginacion. Si hay una sola página no se
  renderiza nada.

  Props:
  - page (Number): página actual (1..totalPages)
  - totalPages (Number): cantidad de páginas

  Emits:
  - ir (Number): página destino
-->
<script setup>
import { computed } from 'vue'

const props = defineProps({
  page: {
    type: Number,
    required: true,
  },
  totalPages: {
    type: Number,
    required: true,
  },
})

const emit = defineEmits(['ir'])

const MAXIMO_SIN_RESUMIR = 7

/**
 * Números a mostrar. Con pocas páginas se listan todas; con muchas se
 * muestran la primera, la última, la actual y sus vecinas, con '…' en los
 * huecos.
 */
const paginasVisibles = computed(() => {
  const total = props.totalPages
  if (total <= MAXIMO_SIN_RESUMIR) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const actual = props.page
  const inicio = Math.max(2, actual - 1)
  const fin = Math.min(total - 1, actual + 1)

  const paginas = [1]
  if (inicio > 2) paginas.push('…')
  for (let n = inicio; n <= fin; n++) paginas.push(n)
  if (fin < total - 1) paginas.push('…')
  paginas.push(total)

  return paginas
})
</script>

<template>
  <nav v-if="totalPages > 1" class="pagination" aria-label="Paginación">
    <button
      type="button"
      class="page-btn page-nav"
      :disabled="page === 1"
      @click="emit('ir', page - 1)"
    >
      ← Anterior
    </button>

    <template v-for="(numero, indice) in paginasVisibles" :key="`${numero}-${indice}`">
      <span v-if="numero === '…'" class="page-ellipsis" aria-hidden="true">…</span>
      <button
        v-else
        type="button"
        class="page-btn page-num"
        :class="{ 'page-num--active': numero === page }"
        :aria-current="numero === page ? 'page' : undefined"
        :aria-label="`Ir a la página ${numero}`"
        @click="emit('ir', numero)"
      >
        {{ numero }}
      </button>
    </template>

    <button
      type="button"
      class="page-btn page-nav"
      :disabled="page === totalPages"
      @click="emit('ir', page + 1)"
    >
      Siguiente →
    </button>
  </nav>
</template>

<style scoped>
.pagination {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  margin-top: var(--spacing-6);
}

.page-btn {
  padding: var(--spacing-2) var(--spacing-4);
  font-size: var(--font-size-sm);
  font-weight: 600;
  border-radius: var(--radius-full);
  background-color: var(--bg-surface);
  border: 1px solid var(--color-neutral-300);
  color: var(--text-secondary);
  transition: all var(--transition-fast);
}

.page-btn:hover:not(:disabled) {
  border-color: var(--color-primary-400);
  color: var(--color-primary-700);
  background-color: var(--color-primary-50);
}

.page-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.page-num {
  min-width: 40px;
  padding: var(--spacing-2) var(--spacing-3);
  font-variant-numeric: tabular-nums;
}

.page-num--active {
  background-color: var(--color-primary-600);
  border-color: var(--color-primary-600);
  color: var(--text-inverse);
}

.page-num--active:hover {
  background-color: var(--color-primary-700);
  border-color: var(--color-primary-700);
  color: var(--text-inverse);
}

.page-ellipsis {
  color: var(--text-muted);
  padding: 0 var(--spacing-1);
}

@media (max-width: 480px) {
  .page-nav {
    padding: var(--spacing-2) var(--spacing-3);
    font-size: var(--font-size-xs);
  }
}
</style>
