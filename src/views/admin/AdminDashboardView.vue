<!--
  AdminDashboardView.vue - Panel principal de administración.

  Muestra un resumen general del directorio y la tabla de productores
  para gestión. Incluye la barra lateral de navegación del admin.

  Ruta: /admin (requiere autenticación)
-->
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProductores } from '@/composables/useProductores'
import { useContactos } from '@/composables/useContactos'
import { useToast } from '@/composables/useToast'
import ProducerTable from '@/components/admin/ProducerTable.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const router = useRouter()
const { productores, loading, error, fetchProductores, deleteProductor } = useProductores()
const { fetchResumenContactos } = useContactos()
const { mostrarExito, mostrarError } = useToast()

// Resumen de contactos por WhatsApp (no bloquea la carga de la tabla si falla)
const contactos = ref({ porProductor: new Map(), total: 0, ultimos30Dias: 0 })

async function cargarContactos() {
  try {
    contactos.value = await fetchResumenContactos()
  } catch (err) {
    console.warn('[AdminDashboard] No se pudo cargar el resumen de contactos:', err?.message)
  }
}

onMounted(() => {
  fetchProductores({ onlyActive: false })
  cargarContactos()
})

// --- KPIs ---
const totalProductores = computed(() => productores.value.length)
const productoresVisibles = computed(() => productores.value.filter((p) => p.activo).length)

/** Ir a la página de edición */
function handleEdit(id) {
  router.push({ name: 'producer-edit', params: { id } })
}

/** Eliminar con confirmación */
async function handleDelete(id) {
  const confirmado = window.confirm(
    '¿Está seguro de que desea eliminar permanentemente a este productor? Esta acción no se puede deshacer.'
  )
  if (!confirmado) return

  const ok = await deleteProductor(id)
  if (ok) {
    mostrarExito('Productor eliminado.')
    await Promise.all([fetchProductores({ onlyActive: false }), cargarContactos()])
  } else {
    mostrarError(error.value || 'No se pudo eliminar el productor.')
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

    <!-- Métricas -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <span class="kpi-value">{{ totalProductores }}</span>
        <span class="kpi-label">Productores registrados</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-value">{{ productoresVisibles }}</span>
        <span class="kpi-label">Visibles al público</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-value">{{ contactos.total }}</span>
        <span class="kpi-label">Contactos por WhatsApp</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-value">{{ contactos.ultimos30Dias }}</span>
        <span class="kpi-label">Contactos últimos 30 días</span>
      </div>
    </div>

    <!-- Indicador de carga -->
    <LoadingSpinner v-if="loading" message="Cargando productores..." />

    <!-- Error -->
    <div v-else-if="error && productores.length === 0" class="error-message">
      <p>⚠️ {{ error }}</p>
    </div>

    <!-- Tabla de productores -->
    <ProducerTable
      v-else
      :productores="productores"
      :contactos-por-productor="contactos.porProductor"
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

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-8);
}

.kpi-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  padding: var(--spacing-5);
  background: var(--bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.kpi-value {
  font-size: var(--font-size-3xl);
  font-weight: 700;
  color: var(--color-primary-dark);
  line-height: 1;
}

.kpi-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}
</style>
