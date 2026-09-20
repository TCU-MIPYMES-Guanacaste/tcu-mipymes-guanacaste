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
import { useToast } from '@/composables/useToast'
import ProducerForm from '@/components/admin/ProducerForm.vue'

const router = useRouter()
const { createProductor, loading, error } = useProductores()
const { cantones, categorias, fetchCantones, fetchCategorias } = useCatalogos()
const { mostrarExito, mostrarError } = useToast()

onMounted(async () => {
  await Promise.all([fetchCantones(), fetchCategorias()])
})

/** Guardar el nuevo productor (la foto se sube dentro de createProductor) */
async function handleSubmit(formData) {
  const creado = await createProductor(formData)
  if (creado) {
    mostrarExito(`Productor "${creado.nombre_negocio}" registrado.`)
    router.push({ name: 'admin-dashboard' })
  } else {
    mostrarError(error.value || 'No se pudo registrar el productor.')
  }
}

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
  font-family: var(--font-headline);
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}
</style>
