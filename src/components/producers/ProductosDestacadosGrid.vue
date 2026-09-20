<!--
  ProductosDestacadosGrid.vue - Productos de un productor en su página pública.

  Mismo tratamiento visual que ProducerCard.vue (tarjeta con foto arriba,
  radio grande y sombra suave), pero sin enlace: los productos no tienen
  página propia.

  Props:
  - productos (Array): productos ya filtrados por disponibilidad
-->
<script setup>
import { getPublicImageUrl } from '@/lib/supabase'
import { formatearPrecio } from '@/utils/precio'

defineProps({
  /** Productos disponibles a mostrar */
  productos: {
    type: Array,
    default: () => [],
  },
})
</script>

<template>
  <section class="productos-seccion">
    <h2 class="productos-titulo">Productos destacados</h2>

    <div class="productos-grid">
      <article v-for="producto in productos" :key="producto.id" class="producto-card">
        <div class="producto-imagen">
          <img
            v-if="producto.foto_url"
            :src="getPublicImageUrl(producto.foto_url)"
            :alt="`Imagen de ${producto.nombre}`"
            class="producto-img"
            loading="lazy"
          />
          <div v-else class="producto-img-placeholder">🧺</div>
        </div>

        <div class="producto-body">
          <h3 class="producto-nombre">{{ producto.nombre }}</h3>

          <p v-if="formatearPrecio(producto.precio_referencia, producto.unidad)" class="producto-precio">
            {{ formatearPrecio(producto.precio_referencia, producto.unidad) }}
          </p>

          <p v-if="producto.descripcion" class="producto-descripcion">
            {{ producto.descripcion }}
          </p>

          <span v-if="producto.temporada" class="producto-temporada">
            🗓️ {{ producto.temporada }}
          </span>
        </div>
      </article>
    </div>

    <p class="productos-nota">Los precios son de referencia; confirme con el productor.</p>
  </section>
</template>

<style scoped>
.productos-seccion {
  margin-top: 3rem;
}

.productos-titulo {
  font-family: var(--font-headline);
  font-size: var(--font-size-2xl);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 1.25rem;
}

.productos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.5rem;
}

.producto-card {
  display: flex;
  flex-direction: column;
  background: var(--bg-surface);
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(43, 32, 22, 0.06);
  transition: transform var(--transition-normal), box-shadow var(--transition-normal);
}

.producto-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(43, 32, 22, 0.12);
}

.producto-imagen {
  aspect-ratio: 16 / 10;
  overflow: hidden;
  background-color: var(--bg-muted);
}

.producto-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.producto-img-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  background-color: var(--bg-muted);
}

.producto-body {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 1rem;
}

.producto-nombre {
  font-family: var(--font-headline);
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.producto-precio {
  font-weight: 600;
  font-size: var(--font-size-sm);
  color: var(--color-primary-600);
  margin: 0;
}

.producto-descripcion {
  font-size: var(--font-size-sm);
  line-height: 1.5;
  color: var(--text-secondary);
  margin: 0;
}

.producto-temporada {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.productos-nota {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  margin-top: 1rem;
}
</style>
