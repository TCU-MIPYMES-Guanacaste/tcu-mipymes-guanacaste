<!--
  ProducerCard.vue - Tarjeta de resumen de un productor.

  Muestra la información básica de un productor en formato de tarjeta:
  imagen, nombre del negocio, cantón y categorías.
  Al hacer clic, navega al detalle completo del productor.

  Props:
  - producer (Object): Datos del productor con sus relaciones
-->
<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { getPublicImageUrl } from '@/lib/supabase'

const props = defineProps({
  /** Objeto con los datos del productor */
  producer: {
    type: Object,
    required: true,
  },
})

// Obtener la URL pública de la imagen del productor
const imageUrl = computed(() => {
  return props.producer.foto_url
    ? getPublicImageUrl(props.producer.foto_url)
    : ''
})

// Extraer nombres de categorías para mostrar como etiquetas
const categoryNames = computed(() => {
  return (
    props.producer.categorias?.map((c) => c.categoria?.nombre).filter(Boolean) ?? []
  )
})
</script>

<template>
  <RouterLink
    :to="{ name: 'producer-detail', params: { id: producer.id } }"
    class="producer-card"
  >
    <!-- Imagen del productor -->
    <div class="card-image">
      <img
        v-if="imageUrl"
        :src="imageUrl"
        :alt="`Imagen de ${producer.nombre_negocio}`"
        class="card-img"
        loading="lazy"
      />
      <div v-else class="card-img-placeholder">🌾</div>
    </div>

    <!-- Información del productor -->
    <div class="card-body">
      <h3 class="card-title">{{ producer.nombre_negocio }}</h3>
      <p v-if="producer.canton" class="card-location">
        📍 {{ producer.canton.nombre }}
      </p>

      <!-- Etiquetas de categorías -->
      <div v-if="categoryNames.length" class="card-tags">
        <span
          v-for="cat in categoryNames"
          :key="cat"
          class="card-tag"
        >
          {{ cat }}
        </span>
      </div>
    </div>
  </RouterLink>
</template>

<style scoped>
.producer-card {
  display: flex;
  flex-direction: column;
  background: var(--color-white);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s, box-shadow 0.2s;
  text-decoration: none;
  color: inherit;
}

.producer-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.card-image {
  aspect-ratio: 16 / 10;
  overflow: hidden;
  background-color: var(--color-surface);
}

.card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-img-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  background-color: var(--color-surface);
}

.card-body {
  padding: 1rem;
}

.card-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 0.5rem;
  color: var(--color-text);
}

.card-location {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  margin: 0 0 0.75rem;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.card-tag {
  font-size: 0.75rem;
  padding: 0.2rem 0.6rem;
  background-color: var(--color-primary-light);
  color: var(--color-primary-dark);
  border-radius: 999px;
  font-weight: 500;
}
</style>
