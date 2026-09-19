<!--
  ProducerCreateView.vue - Vista para crear un nuevo productor.

  Presenta el formulario de creación de productor dentro del layout
  de administración con la barra lateral.

  Ruta: /admin/productores/nuevo (requiere autenticación)
-->
<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProductores } from '@/composables/useProductores'
import { useCatalogos } from '@/composables/useCatalogos'
import ProducerForm from '@/components/admin/ProducerForm.vue'

const router = useRouter()
const { createProductor, loading } = useProductores()
const { cantones, categorias, fetchCantones, fetchCategorias } = useCatalogos()

// Cargar catálogos al montar
onMounted(async () => {
  await Promise.all([fetchCantones(), fetchCategorias()])
})

/** Manejar el envío del formulario de creación */
async function handleSubmit(formData) {
  const result = await createProductor(formData)
  if (result) {
    // Redirigir al dashboard después de crear exitosamente
    router.push({ name: 'admin-dashboard' })
  }
}

/** Cancelar la creación y volver al dashboard */
function handleCancel() {
  router.push({ name: 'admin-dashboard' })
}
</script>

<template>
  <div class="create-view">
    <header class="admin-header">
      <h1 class="admin-title">Nuevo Productor</h1>
    </header>

    <ProducerForm
      :cantones="cantones"
      :categorias="categorias"
      :loading="loading"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />
  </div>
</template>

<style scoped>
.create-view {
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
</style>
