<!--
  ProducerGrid.vue - Cuadrícula de tarjetas de productores.

  Renderiza una lista de productores usando el componente ProducerCard
  en un diseño de cuadrícula responsiva. Muestra un mensaje cuando no
  hay resultados.

  Props:
  - productores (Array): Lista de productores a mostrar
-->
<script setup>
import ProducerCard from '@/components/producers/ProducerCard.vue'

defineProps({
  /** Lista de productores para renderizar en la cuadrícula */
  productores: {
    type: Array,
    default: () => [],
  },
})
</script>

<template>
  <div>
    <!-- Cuadrícula de tarjetas -->
    <div v-if="productores.length" class="producer-grid">
      <ProducerCard
        v-for="producer in productores"
        :key="producer.id"
        :producer="producer"
      />
    </div>

    <!-- Mensaje cuando no hay resultados -->
    <div v-else class="no-results">
      <span class="no-results-icon">🔍</span>
      <p class="no-results-text">
        No se encontraron productores con los filtros seleccionados.
      </p>
      <p class="no-results-hint">
        Intenta ampliar tu búsqueda o limpiar los filtros.
      </p>
    </div>
  </div>
</template>

<style scoped>
.producer-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.no-results {
  text-align: center;
  padding: 3rem 1rem;
}

.no-results-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 1rem;
}

.no-results-text {
  font-size: 1.1rem;
  color: var(--color-text);
  margin: 0 0 0.5rem;
}

.no-results-hint {
  font-size: 0.9rem;
  color: var(--color-text-muted);
}
</style>
