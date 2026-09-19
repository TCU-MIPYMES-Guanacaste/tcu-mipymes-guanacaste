<!--
  AdminDashboardView.vue - Panel principal de administración.

  Muestra un resumen general del directorio y la tabla de productores
  para gestión. Incluye la barra lateral de navegación del admin.

  Ruta: /admin (requiere autenticación)
-->
<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProductores } from '@/composables/useProductores'
import ProducerTable from '@/components/admin/ProducerTable.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const router = useRouter()
const { productores, loading, error, fetchProductores, deleteProductor } = useProductores()

// Cargar todos los productores (incluyendo inactivos) al montar
onMounted(() => {
  fetchProductores({ onlyActive: false })
})

/** Navegar a la página de edición del productor */
function handleEdit(id) {
  router.push({ name: 'producer-edit', params: { id } })
}

/** Manejar la eliminación de un productor (con confirmación) */
async function handleDelete(id) {
  const confirmDelete = window.confirm('¿Está seguro de que desea eliminar permanentemente a este productor? Esta acción no se puede deshacer.')
  if (confirmDelete) {
    const success = await deleteProductor(id)
    if (success) {
      await fetchProductores({ onlyActive: false })
    }
  }
}
</script>

<template>
  <div class="dashboard-view">
    <header class="admin-header">
      <h1 class="admin-title">Panel de Administración</h1>
      <RouterLink to="/admin/productores/nuevo" class="btn-create">
        ➕ Nuevo Productor
      </RouterLink>
    </header>

    <!-- Indicador de carga -->
    <LoadingSpinner v-if="loading" message="Cargando productores..." />

    <!-- Error -->
    <div v-else-if="error" class="error-message">
      <p>⚠️ {{ error }}</p>
    </div>

    <!-- Tabla de productores -->
    <ProducerTable
      v-else
      :productores="productores"
      @edit="handleEdit"
      @delete="handleDelete"
    />
  </div>
</template>

<style scoped>
.admin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
}

.admin-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
}

.btn-create {
  padding: 0.6rem 1.25rem;
  background-color: var(--color-primary);
  color: var(--color-white);
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.btn-create:hover {
  background-color: var(--color-primary-dark);
}

.error-message {
  color: var(--color-error);
  font-weight: 500;
}
</style>
