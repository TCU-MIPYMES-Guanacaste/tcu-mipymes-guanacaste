<!--
  ProducerFilters.vue - Barra/panel de filtros para la búsqueda de productores.

  Permite filtrar productores por cantón y categoría mediante selectores
  desplegables. Emite los filtros seleccionados al componente padre.

  Props:
  - cantones (Array): Lista de cantones disponibles
  - categorias (Array): Lista de categorías disponibles

  Emits:
  - filter-change (Object): Objeto con canton_id y categoria_id seleccionados
-->
<script setup>
import { reactive, watch } from 'vue'

const props = defineProps({
  /** Lista de cantones para el selector */
  cantones: {
    type: Array,
    default: () => [],
  },
  /** Lista de categorías para el selector */
  categorias: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['filter-change'])

// Estado reactivo de los filtros seleccionados
const filters = reactive({
  canton_id: null,
  categoria_id: null,
})

// Observar cambios en los filtros y emitir al padre
watch(
  filters,
  (newFilters) => {
    emit('filter-change', { ...newFilters })
  },
  { deep: true }
)

/** Limpiar todos los filtros seleccionados */
function clearFilters() {
  filters.canton_id = null
  filters.categoria_id = null
}
</script>

<template>
  <div class="producer-filters">
    <h3 class="filters-title">Filtrar por</h3>

    <!-- Selector de cantón -->
    <div class="filter-group">
      <label for="filter-canton" class="filter-label">Cantón</label>
      <select id="filter-canton" v-model="filters.canton_id" class="filter-select">
        <option :value="null">Todos los cantones</option>
        <option v-for="canton in cantones" :key="canton.id" :value="canton.id">
          {{ canton.nombre }}
        </option>
      </select>
    </div>

    <!-- Selector de categoría -->
    <div class="filter-group">
      <label for="filter-categoria" class="filter-label">Categoría</label>
      <select id="filter-categoria" v-model="filters.categoria_id" class="filter-select">
        <option :value="null">Todas las categorías</option>
        <option v-for="cat in categorias" :key="cat.id" :value="cat.id">
          {{ cat.nombre }}
        </option>
      </select>
    </div>

    <!-- Botón para limpiar filtros -->
    <button class="filter-clear" @click="clearFilters">
      Limpiar filtros
    </button>
  </div>
</template>

<style scoped>
.producer-filters {
  padding: 1.25rem;
  background: var(--bg-surface);
  border: 1px solid var(--color-neutral-200);
  border-left: 4px solid var(--color-primary-600);
  border-radius: var(--radius-xl);
  box-shadow: 0 2px 8px rgba(43, 32, 22, 0.05);
}

.filters-title {
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 1rem;
  color: var(--text-secondary);
}

.filter-group {
  margin-bottom: 1rem;
}

.filter-label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 0.35rem;
  color: var(--text-secondary);
}

.filter-select {
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--color-neutral-300);
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  font-family: inherit;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  cursor: pointer;
  transition: border-color 0.2s;
}

.filter-select:focus {
  outline: none;
  border-color: var(--color-primary-600);
}

.filter-clear {
  width: 100%;
  padding: 0.5rem;
  margin-top: 0.5rem;
  background: none;
  border: 1px solid var(--color-neutral-300);
  border-radius: var(--radius-full);
  color: var(--text-secondary);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-clear:hover {
  border-color: var(--color-primary-600);
  color: var(--color-primary-600);
}
</style>
