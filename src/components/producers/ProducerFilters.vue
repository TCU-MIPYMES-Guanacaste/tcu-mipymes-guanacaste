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
  background: var(--color-white);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.filters-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 1rem;
  color: var(--color-text);
}

.filter-group {
  margin-bottom: 1rem;
}

.filter-label {
  display: block;
  font-size: 0.85rem;
  font-weight: 500;
  margin-bottom: 0.35rem;
  color: var(--color-text-muted);
}

.filter-select {
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: 2px solid var(--color-border);
  border-radius: 8px;
  font-size: 0.9rem;
  font-family: inherit;
  background-color: var(--color-white);
  cursor: pointer;
  transition: border-color 0.2s;
}

.filter-select:focus {
  outline: none;
  border-color: var(--color-primary);
}

.filter-clear {
  width: 100%;
  padding: 0.5rem;
  margin-top: 0.5rem;
  background: none;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text-muted);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-clear:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
</style>
