<!--
  ProducerDetailView.vue - Vista de detalle completo de un productor.

  Muestra toda la información de un productor específico: imagen,
  nombre, descripción, cantón, categorías, datos de contacto y
  botón de WhatsApp para comunicación directa.
-->
<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProductores } from '@/composables/useProductores'
import { getPublicImageUrl } from '@/lib/supabase'
import { formatearTelefono } from '@/utils/telefono'
import { colorDeCategoria } from '@/utils/categoriaColor'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import WhatsAppButton from '@/components/producers/WhatsAppButton.vue'

const route = useRoute()
const router = useRouter()
const { loading, error, fetchProductorById } = useProductores()

// Datos del productor
const producer = ref(null)

// Cargar los datos del productor al montar
onMounted(async () => {
  const data = await fetchProductorById(route.params.id)
  if (data) {
    producer.value = data
  } else {
    // Si no se encontró el productor, redirigir al inicio
    router.push({ name: 'home' })
  }
})
</script>

<template>
  <div class="producer-detail">
    <!-- Cargando -->
    <LoadingSpinner v-if="loading" message="Cargando información del productor..." />

    <!-- Error -->
    <div v-else-if="error" class="error-message">
      <p>⚠️ {{ error }}</p>
      <RouterLink to="/" class="back-link">← Volver al directorio</RouterLink>
    </div>

    <!-- Detalle del productor -->
    <article v-else-if="producer" class="detail-content">
      <!-- Resplandor cálido detrás de la portada (decorativo, sin íconos) -->
      <div class="detail-glow" aria-hidden="true"></div>

      <!-- Enlace para regresar -->
      <RouterLink to="/" class="back-link">← Volver al directorio</RouterLink>

      <div class="detail-layout">
        <!-- Imagen del productor -->
        <div class="detail-image">
          <img
            v-if="producer.foto_url"
            :src="getPublicImageUrl(producer.foto_url)"
            :alt="`Imagen de ${producer.nombre_negocio}`"
            class="detail-img"
          />
          <div v-else class="detail-img-placeholder">🌾</div>
        </div>

        <!-- Información del productor -->
        <div class="detail-info">
          <h1 class="detail-title">{{ producer.nombre_negocio }}</h1>

          <p v-if="producer.canton" class="detail-location">
            📍 {{ producer.canton.nombre }}, Guanacaste
          </p>

          <!-- Categorías, cada una con su color propio -->
          <div v-if="producer.categorias?.length" class="detail-tags">
            <span
              v-for="cat in producer.categorias"
              :key="cat.categoria?.id"
              class="detail-tag"
              :style="{
                background: colorDeCategoria(cat.categoria?.nombre).bg,
                color: colorDeCategoria(cat.categoria?.nombre).texto,
              }"
            >
              {{ cat.categoria?.nombre }}
            </span>
          </div>

          <!-- Descripción -->
          <p v-if="producer.descripcion" class="detail-description">
            {{ producer.descripcion }}
          </p>

          <!-- Contacto -->
          <div class="detail-contact">
            <p v-if="producer.nombre_contacto" class="contact-name">
              👤 {{ producer.nombre_contacto }}
            </p>
            <p v-if="producer.telefono" class="contact-phone">
              📞 {{ formatearTelefono(producer.telefono) }}
            </p>
          </div>

          <!-- Botón de WhatsApp -->
          <WhatsAppButton
            v-if="producer.telefono"
            :telefono="producer.telefono"
            :nombre-negocio="producer.nombre_negocio"
            :productor-id="producer.id"
          />
        </div>
      </div>
    </article>
  </div>
</template>

<style scoped>
.producer-detail {
  padding: 1rem 0;
}

.detail-content {
  position: relative;
}

/* Resplandor cálido detrás de la portada. Sin íconos: esta es la página
   de un productor, no una portada del sitio. */
.detail-glow {
  position: absolute;
  top: -1.5rem;
  left: 0;
  width: 560px;
  max-width: 100%;
  height: 320px;
  background: radial-gradient(closest-side, rgba(140, 59, 38, 0.14), rgba(140, 59, 38, 0) 72%);
  pointer-events: none;
  z-index: 0;
}

.detail-content > *:not(.detail-glow) {
  position: relative;
  z-index: 1;
}

.back-link {
  display: inline-block;
  color: var(--color-primary-600);
  text-decoration: none;
  font-weight: 600;
  margin-bottom: 1.5rem;
}

.back-link:hover {
  color: var(--color-primary-700);
  text-decoration: underline;
}

.detail-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2.5rem;
  align-items: start;
}

.detail-image {
  border-radius: var(--radius-xl);
  overflow: hidden;
  border: 1px solid var(--color-neutral-200);
  background-color: var(--bg-muted);
}

.detail-img {
  width: 100%;
  display: block;
  object-fit: cover;
}

.detail-img-placeholder {
  aspect-ratio: 4 / 3;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 4rem;
}

.detail-title {
  font-family: var(--font-headline);
  font-size: 2rem;
  font-weight: 600;
  line-height: 1.15;
  margin: 0 0 0.5rem;
  color: var(--text-primary);
}

.detail-location {
  font-size: 1rem;
  color: var(--text-secondary);
  margin: 0 0 1rem;
}

.detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}

/* El fondo y el color de texto los pone colorDeCategoria() por :style. */
.detail-tag {
  font-size: 0.8rem;
  padding: 0.3rem 0.75rem;
  border-radius: var(--radius-full);
  font-weight: 600;
}

.detail-description {
  font-size: 1rem;
  line-height: 1.7;
  color: var(--text-primary);
  margin-bottom: 1.5rem;
}

.detail-contact {
  margin-bottom: 1.5rem;
}

.contact-name,
.contact-phone {
  margin: 0.3rem 0;
  color: var(--text-secondary);
}

.error-message {
  text-align: center;
  padding: 2rem;
  color: var(--color-error);
}

@media (max-width: 768px) {
  .detail-layout {
    grid-template-columns: 1fr;
  }
}

/* La decoración estorba en pantallas angostas: se retira por completo. */
@media (max-width: 720px) {
  .detail-glow {
    display: none;
  }
}
</style>
