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
        <div class="kpi-card-top">
          <span class="kpi-icon-badge" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </span>
        </div>
        <span class="kpi-value">{{ totalProductores }}</span>
        <span class="kpi-label">Productores registrados</span>
      </div>
      <div class="kpi-card">
        <div class="kpi-card-top">
          <span class="kpi-icon-badge" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </span>
        </div>
        <span class="kpi-value">{{ productoresVisibles }}</span>
        <span class="kpi-label">Visibles al público</span>
      </div>
      <div class="kpi-card">
        <div class="kpi-card-top">
          <span class="kpi-icon-badge" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
              />
            </svg>
          </span>
        </div>
        <span class="kpi-value">{{ contactos.total }}</span>
        <span class="kpi-label">Contactos por WhatsApp</span>
      </div>
      <div class="kpi-card">
        <div class="kpi-card-top">
          <span class="kpi-icon-badge" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          </span>
        </div>
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
  font-family: var(--font-headline);
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.btn-create {
  padding: 0.6rem 1.25rem;
  background-color: var(--color-primary-600);
  color: var(--text-inverse);
  text-decoration: none;
  border-radius: var(--radius-full);
  font-weight: 600;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.btn-create:hover {
  background-color: var(--color-primary-700);
  color: var(--text-inverse);
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
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
}

.kpi-card-top {
  display: flex;
  justify-content: flex-end;
  margin-bottom: var(--spacing-2);
}

/* Insignia del ícono: barro/verde monte, en tono con el número de su tarjeta. */
.kpi-icon-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  background-color: var(--color-primary-50);
  color: var(--color-primary-600);
}

.kpi-icon-badge svg {
  width: 18px;
  height: 18px;
}

.kpi-card:nth-child(even) .kpi-icon-badge {
  background-color: var(--color-warm-50);
  color: var(--color-warm-600);
}

/* Los números alternan barro y verde monte para dar ritmo a la fila;
   van en la tipografía sans (no la serif de titulares) para que se lean
   como datos, no como un encabezado. */
.kpi-value {
  font-family: var(--font-family);
  font-size: var(--font-size-3xl);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--color-primary-600);
  line-height: 1;
}

.kpi-card:nth-child(even) .kpi-value {
  color: var(--color-warm-600);
}

.kpi-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}
</style>
