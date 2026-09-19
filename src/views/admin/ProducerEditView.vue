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
import { useToast } from '@/composables/useToast'
import ProducerForm from '@/components/admin/ProducerForm.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const route = useRoute()
const router = useRouter()
const { fetchProductorById, updateProductor, loading, error } = useProductores()
const { cantones, categorias, fetchCantones, fetchCategorias } = useCatalogos()
const { mostrarExito, mostrarError } = useToast()

// Datos actuales del productor para precargar el formulario
const producerData = ref(null)

onMounted(async () => {
  const [producer] = await Promise.all([
    fetchProductorById(route.params.id),
    fetchCantones(),
    fetchCategorias(),
  ])

  if (producer) {
    producerData.value = producer
  } else {
    mostrarError('No se encontró el productor.')
    router.push({ name: 'admin-dashboard' })
  }
})

/** Guardar cambios (sube foto nueva y borra la anterior dentro de updateProductor) */
async function handleSubmit(formData) {
  const actualizado = await updateProductor(route.params.id, formData)
  if (actualizado) {
    mostrarExito('Cambios guardados.')
    router.push({ name: 'admin-dashboard' })
  } else {
    mostrarError(error.value || 'No se pudieron guardar los cambios.')
  }
}

function handleCancel() {
  router.push({ name: 'admin-dashboard' })
}
</script>

<template>
  <div class="edit-view">
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
</template>

<style scoped>
.edit-view {
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
