<!--
  ProducerEditView.vue - Vista para editar un productor existente.

  Carga los datos actuales del productor y los pasa al formulario
  de edición. Dentro del layout de administración con barra lateral.

  Ruta: /admin/productores/:id/editar (requiere autenticación)
-->
<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProductores } from '@/composables/useProductores'
import { useCatalogos } from '@/composables/useCatalogos'
import AdminSidebar from '@/components/admin/AdminSidebar.vue'
import ProducerForm from '@/components/admin/ProducerForm.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const route = useRoute()
const router = useRouter()
const { fetchProductorById, updateProductor, loading, error } = useProductores()
const { cantones, categorias, fetchCantones, fetchCategorias } = useCatalogos()

// Datos actuales del productor para precargar en el formulario
const producerData = ref(null)

// Cargar datos del productor y catálogos al montar
onMounted(async () => {
  const [producer] = await Promise.all([
    fetchProductorById(route.params.id),
    fetchCantones(),
    fetchCategorias(),
  ])

  if (producer) {
    producerData.value = producer
  } else {
    // Si no se encontró, redirigir al dashboard
    router.push({ name: 'admin-dashboard' })
  }
})

/** Manejar el envío del formulario de edición */
async function handleSubmit(formData) {
  const result = await updateProductor(route.params.id, formData)
  if (result) {
    // Redirigir al dashboard después de actualizar exitosamente
    router.push({ name: 'admin-dashboard' })
  }
}

/** Cancelar la edición y volver al dashboard */
function handleCancel() {
  router.push({ name: 'admin-dashboard' })
}
</script>

<template>
  <div class="admin-layout">
    <!-- Barra lateral de navegación -->
    <AdminSidebar />

    <!-- Contenido: formulario de edición -->
    <div class="admin-content">
      <header class="admin-header">
        <h1 class="admin-title">Editar Productor</h1>
      </header>

      <!-- Cargando datos -->
      <LoadingSpinner v-if="loading && !producerData" message="Cargando datos del productor..." />

      <!-- Error -->
      <div v-else-if="error" class="error-message">
        <p>⚠️ {{ error }}</p>
      </div>

      <!-- Formulario con datos precargados -->
      <ProducerForm
        v-else-if="producerData"
        :initial-data="producerData"
        :cantones="cantones"
        :categorias="categorias"
        :loading="loading"
        @submit="handleSubmit"
        @cancel="handleCancel"
      />
    </div>
  </div>
</template>

<style scoped>
.admin-layout {
  display: flex;
  min-height: calc(100vh - 200px);
  margin: -1.5rem;
}

.admin-content {
  flex: 1;
  padding: 2rem;
  max-width: 800px;
}

.admin-header {
  margin-bottom: 2rem;
}

.admin-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
}

.error-message {
  color: var(--color-error);
  font-weight: 500;
}
</style>
