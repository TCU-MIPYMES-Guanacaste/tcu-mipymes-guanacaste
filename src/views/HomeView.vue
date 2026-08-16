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

import SearchBar from '@/components/common/SearchBar.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ProducerFilters from '@/components/producers/ProducerFilters.vue'
import ProducerGrid from '@/components/producers/ProducerGrid.vue'

// Composables
const { productores, loading, error, fetchProductores } = useProductores()
const { cantones, categorias, fetchCantones, fetchCategorias } = useCatalogos()

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
      <h2 class="hero-title">Descubre productores locales en Guanacaste</h2>
      <p class="hero-subtitle">
        Conecta directamente con micro, pequeñas y medianas empresas productoras
        de alimentos de tu comunidad.
      </p>

      <!-- Barra de búsqueda -->
      <SearchBar @search="handleSearch" />
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

        <!-- Cuadrícula de productores -->
        <ProducerGrid v-else :productores="productores" />
      </section>
    </div>
  </div>
</template>

<style scoped>
.hero-section {
  text-align: center;
  padding: 2rem 0 2.5rem;
}

.hero-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 0.75rem;
}

.hero-subtitle {
  font-size: 1.1rem;
  color: var(--color-text-muted);
  max-width: 550px;
  margin: 0 auto 1.5rem;
  line-height: 1.5;
}

.hero-section :deep(.search-bar) {
  margin: 0 auto;
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
  .hero-title {
    font-size: 1.5rem;
  }

  .content-layout {
    grid-template-columns: 1fr;
  }

  .filters-sidebar {
    order: -1;
  }
}
</style>
