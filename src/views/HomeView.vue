<!--
  HomeView.vue - Página principal pública del directorio.

  Combina la barra de búsqueda, los filtros por cantón/categoría y la
  cuadrícula de productores. Carga los datos iniciales al montarse y
  reacciona a los cambios de filtros y búsqueda.
-->
<script setup>
import { onMounted, reactive } from 'vue'
import { useProductores } from '@/composables/useProductores'
import { useCatalogos } from '@/composables/useCatalogos'
import { usePaginacion } from '@/composables/usePaginacion'

import SearchBar from '@/components/common/SearchBar.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ProducerFilters from '@/components/producers/ProducerFilters.vue'
import ProducerGrid from '@/components/producers/ProducerGrid.vue'
import Pagination from '@/components/common/Pagination.vue'

// Composables
const { productores, loading, error, fetchProductores } = useProductores()
const { cantones, categorias, fetchCantones, fetchCategorias } = useCatalogos()

// Paginación solo de la presentación: `productores` sigue siendo la lista
// completa que devolvió Supabase.
const { page, totalPages, pageItems, irAPagina, resetear } = usePaginacion(productores, 12)

// Estado de filtros activos
const activeFilters = reactive({
  search: '',
  canton_id: null,
  categoria_id: null,
})

/** Manejar cambio en el texto de búsqueda */
function handleSearch(searchText) {
  activeFilters.search = searchText
  applyFilters()
}

/** Manejar cambio en los filtros de cantón/categoría */
function handleFilterChange(filters) {
  activeFilters.canton_id = filters.canton_id
  activeFilters.categoria_id = filters.categoria_id
  applyFilters()
}

/** Aplicar todos los filtros activos y recargar productores */
function applyFilters() {
  resetear()
  fetchProductores({ ...activeFilters })
}

// Cargar datos iniciales al montar la vista
onMounted(async () => {
  await Promise.all([
    fetchProductores(),
    fetchCantones(),
    fetchCategorias(),
  ])
})
</script>

<template>
  <div class="home-view">
    <!-- Sección hero / encabezado de la página -->
    <section class="hero-section">
      <!-- Resplandor cálido detrás del titular (decorativo) -->
      <div class="hero-glow" aria-hidden="true"></div>

      <!-- Íconos lineales en las esquinas: hoja, espiga, panal y zigzag chorotega -->
      <div class="hero-deco" aria-hidden="true">
        <svg class="deco-hoja" viewBox="0 0 48 48" fill="none" stroke="#8C3B26" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 38C6 20 22 6 40 6C40 24 24 38 6 38Z" />
          <path d="M9 35C17 27 25 19 37 9" />
        </svg>
        <svg class="deco-espiga" viewBox="0 0 48 48" fill="none" stroke="#3A5A34" stroke-width="2.5" stroke-linecap="round">
          <path d="M24 4v40" />
          <path d="M24 12c-6-2-10 0-12 4M24 12c6-2 10 0 12 4M24 22c-6-2-10 0-12 4M24 22c6-2 10 0 12 4M24 32c-6-2-10 0-12 4M24 32c6-2 10 0 12 4" />
        </svg>
        <svg class="deco-panal" viewBox="0 0 48 48" fill="none" stroke="#8C3B26" stroke-width="2.5" stroke-linejoin="round">
          <path d="M24 4 42 15v18L24 44 6 33V15Z" />
        </svg>
        <svg class="deco-zigzag" viewBox="0 0 52 24" fill="none" stroke="#3A5A34" stroke-width="3" stroke-linecap="square">
          <path d="M2 20 10 20 10 8 18 8 18 20 26 20 26 8 34 8 34 20 42 20 42 8 50 8" />
        </svg>
      </div>

      <div class="hero-inner">
        <span class="hero-eyebrow">Guanacaste, Costa Rica</span>

        <h2 class="hero-title">Descubre productores locales en Guanacaste</h2>
        <p class="hero-subtitle">
          Conecta directamente con micro, pequeñas y medianas empresas productoras
          de alimentos de tu comunidad.
        </p>

        <!-- Barra de búsqueda -->
        <SearchBar @search="handleSearch" />

        <!-- Estadísticas del directorio -->
        <div class="stat-row">
          <div class="stat">
            <span class="stat-num">{{ cantones.length }}</span>
            <span class="stat-label">Cantones</span>
          </div>
          <div class="stat">
            <span class="stat-num">{{ categorias.length }}</span>
            <span class="stat-label">Categorías</span>
          </div>
          <div class="stat">
            <span class="stat-num">100%</span>
            <span class="stat-label">Gratuito</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Contenido principal: filtros + cuadrícula -->
    <div class="content-layout">
      <!-- Panel lateral de filtros -->
      <aside class="filters-sidebar">
        <ProducerFilters
          :cantones="cantones"
          :categorias="categorias"
          @filter-change="handleFilterChange"
        />
      </aside>

      <!-- Área principal de resultados -->
      <section class="results-area">
        <!-- Indicador de carga -->
        <LoadingSpinner v-if="loading" message="Buscando productores..." />

        <!-- Mensaje de error -->
        <div v-else-if="error" class="error-message">
          <p>⚠️ {{ error }}</p>
        </div>

        <!-- Cuadrícula de productores (solo la página actual) -->
        <template v-else>
          <ProducerGrid :productores="pageItems" />
          <Pagination :page="page" :total-pages="totalPages" @ir="irAPagina" />
        </template>
      </section>
    </div>
  </div>
</template>

<style scoped>
.hero-section {
  position: relative;
  overflow: visible;
  text-align: center;
  padding: 3rem 0 2.5rem;
}

/* --- Decoración (solo estética; oculta en móvil) --- */
.hero-glow {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 520px;
  max-width: 90%;
  height: 300px;
  background: radial-gradient(closest-side, rgba(140, 59, 38, 0.16), rgba(140, 59, 38, 0) 72%);
  pointer-events: none;
  z-index: 0;
}

.hero-deco {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.hero-deco svg {
  position: absolute;
}

.deco-hoja {
  top: 8%;
  left: 3%;
  width: 46px;
  height: 46px;
  opacity: 0.24;
  transform: rotate(-14deg);
}

.deco-espiga {
  top: 12%;
  right: 4%;
  width: 44px;
  height: 44px;
  opacity: 0.22;
  transform: rotate(10deg);
}

.deco-panal {
  bottom: 10%;
  left: 6%;
  width: 40px;
  height: 40px;
  opacity: 0.2;
  transform: rotate(-6deg);
}

.deco-zigzag {
  bottom: 14%;
  right: 5%;
  width: 52px;
  height: 22px;
  opacity: 0.24;
}

/* --- Contenido del hero (por encima de la decoración) --- */
.hero-inner {
  position: relative;
  z-index: 1;
  max-width: 640px;
  margin: 0 auto;
}

.hero-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 1rem;
  padding: 0.3rem 0.7rem;
  border-radius: var(--radius-full);
  background: var(--color-primary-600);
  color: var(--text-inverse);
  font-size: var(--font-size-xs);
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.hero-title {
  font-family: var(--font-headline);
  font-size: clamp(2rem, 4vw, 2.75rem);
  font-weight: 600;
  line-height: 1.08;
  color: var(--text-primary);
  margin: 0 0 0.85rem;
}

.hero-subtitle {
  font-size: 1.05rem;
  color: var(--text-secondary);
  max-width: 46ch;
  margin: 0 auto 1.5rem;
  line-height: 1.6;
}

.hero-section :deep(.search-bar) {
  margin: 0 auto;
}

/* --- Fila de estadísticas --- */
.stat-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1.5rem;
  margin-top: 2rem;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
}

.stat-num {
  font-family: var(--font-headline);
  font-size: 1.375rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--color-primary-600);
}

.stat-label {
  font-size: 0.6875rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.content-layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 2rem;
  align-items: start;
}

.error-message {
  text-align: center;
  padding: 2rem;
  color: var(--color-error);
  font-weight: 500;
}

/* Diseño responsivo */
@media (max-width: 768px) {
  .hero-section {
    padding: 2rem 0 2rem;
  }

  .content-layout {
    grid-template-columns: 1fr;
  }

  .filters-sidebar {
    order: -1;
  }
}

/* La decoración estorba en pantallas angostas: se retira por completo. */
@media (max-width: 720px) {
  .hero-glow,
  .hero-deco {
    display: none;
  }
}
</style>
