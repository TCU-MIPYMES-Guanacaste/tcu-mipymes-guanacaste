<!--
  ProducerTable.vue - Tabla de datos para listar productores en el panel de administración.
-->
<script setup>
import { computed, ref } from 'vue'
import { getPublicImageUrl } from '@/lib/supabase'

const props = defineProps({
  /** Lista de productores para la tabla */
  productores: {
    type: Array,
    default: () => [],
  },
  /** Resumen de contactos por productor: Map<id, { total, ultimos_30_dias }> */
  contactosPorProductor: {
    type: Map,
    default: () => new Map(),
  },
})

const emit = defineEmits(['edit', 'delete'])

// Búsqueda local en la tabla
const searchFilter = ref('')

// Filtrar la lista de productores según la búsqueda local
const filteredProductores = computed(() => {
  if (!searchFilter.value.trim()) {
    return props.productores
  }
  const search = searchFilter.value.toLowerCase()
  return props.productores.filter((p) => {
    const negocio = p.nombre_negocio?.toLowerCase() || ''
    const contacto = p.nombre_contacto?.toLowerCase() || ''
    const canton = p.canton?.nombre?.toLowerCase() || ''
    return negocio.includes(search) || contacto.includes(search) || canton.includes(search)
  })
})

/** Total de contactos por WhatsApp de un productor (0 si no tiene) */
function contactosDe(id) {
  return props.contactosPorProductor.get(id)?.total ?? 0
}
</script>

<template>
  <div class="table-container-card">
    <!-- Buscador y Acciones -->
    <div class="table-header-actions">
      <input
        v-model="searchFilter"
        type="text"
        placeholder="Buscar por negocio, contacto o cantón..."
        class="table-search"
      />
    </div>

    <!-- Tabla de Productores -->
    <div class="table-responsive">
      <table v-if="filteredProductores.length > 0" class="admin-table">
        <thead>
          <tr>
            <th>Imagen</th>
            <th>Negocio</th>
            <th>Contacto</th>
            <th>Ubicación</th>
            <th>Categorías</th>
            <th>Estado</th>
            <th class="text-right">Contactos</th>
            <th class="text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in filteredProductores" :key="p.id">
            <!-- Imagen -->
            <td>
              <div class="thumbnail-container">
                <img
                  v-if="p.foto_url"
                  :src="getPublicImageUrl(p.foto_url)"
                  alt="Thumbnail"
                  class="thumbnail-img"
                />
                <span v-else class="thumbnail-placeholder">🌾</span>
              </div>
            </td>
            <!-- Negocio -->
            <td>
              <div class="business-name">{{ p.nombre_negocio }}</div>
            </td>
            <!-- Contacto -->
            <td>
              <div class="contact-info">
                <span class="contact-name">{{ p.nombre_contacto }}</span>
                <span class="contact-phone">{{ p.telefono }}</span>
              </div>
            </td>
            <!-- Ubicación -->
            <td>
              <span class="location-badge">
                📍 {{ p.canton?.nombre || 'Guanacaste' }}
              </span>
            </td>
            <!-- Categorías -->
            <td>
              <div class="categories-tags">
                <span
                  v-for="cat in p.categorias"
                  :key="cat.categoria?.id"
                  class="cat-badge"
                >
                  {{ cat.categoria?.nombre || 'Alimento' }}
                </span>
              </div>
            </td>
            <!-- Estado -->
            <td>
              <span :class="['status-badge', p.activo ? 'status-active' : 'status-inactive']">
                {{ p.activo ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <!-- Contactos por WhatsApp -->
            <td class="text-right">
              <span class="contactos-count" :title="'Clics en Contactar por WhatsApp'">
                💬 {{ contactosDe(p.id) }}
              </span>
            </td>
            <!-- Acciones -->
            <td class="text-right">
              <div class="actions-group">
                <button
                  type="button"
                  class="btn-action btn-edit"
                  title="Editar productor"
                  @click="emit('edit', p.id)"
                >
                  ✏️ Editar
                </button>
                <button
                  type="button"
                  class="btn-action btn-delete"
                  title="Eliminar productor"
                  @click="emit('delete', p.id)"
                >
                  🗑️ Eliminar
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Sin datos -->
      <div v-else class="table-empty">
        <p class="empty-title">No se encontraron productores</p>
        <p class="empty-desc">Prueba cambiando tu búsqueda o agrega uno nuevo.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.table-container-card {
  background-color: var(--bg-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--color-neutral-200);
  overflow: hidden;
}

.table-header-actions {
  padding: var(--spacing-4);
  background-color: var(--bg-primary);
  border-bottom: 1px solid var(--color-neutral-200);
}

.table-search {
  max-width: 400px;
}

.table-responsive {
  width: 100%;
  overflow-x: auto;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.admin-table th {
  background-color: var(--bg-secondary);
  color: var(--text-secondary);
  font-weight: 600;
  font-size: var(--font-size-xs);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: var(--spacing-4);
  border-bottom: 1px solid var(--color-neutral-200);
}

.admin-table td {
  padding: var(--spacing-4);
  border-bottom: 1px solid var(--color-neutral-200);
  vertical-align: middle;
  font-size: var(--font-size-sm);
}

.admin-table tbody tr:hover {
  background-color: var(--bg-secondary);
}

/* Thumbnail */
.thumbnail-container {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  overflow: hidden;
  background-color: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-neutral-200);
}

.thumbnail-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-placeholder {
  font-size: 1.25rem;
}

.business-name {
  font-weight: 600;
  color: var(--text-primary);
}

.contact-info {
  display: flex;
  flex-direction: column;
}

.contact-name {
  font-weight: 500;
  color: var(--text-primary);
}

.contact-phone {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.location-badge {
  color: var(--text-secondary);
}

.categories-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-1);
  max-width: 250px;
}

.cat-badge {
  font-size: var(--font-size-xs);
  padding: 2px 8px;
  background-color: var(--color-primary-100);
  color: var(--color-primary-800);
  border-radius: var(--radius-full);
  font-weight: 500;
}

/* Estados */
.status-badge {
  font-size: var(--font-size-xs);
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font-weight: 600;
}

.status-active {
  background-color: var(--color-primary-100);
  color: var(--color-primary-800);
}

.status-inactive {
  background-color: var(--color-neutral-200);
  color: var(--color-neutral-600);
}

/* Botones de acción */
.text-right {
  text-align: right;
}

.actions-group {
  display: inline-flex;
  gap: var(--spacing-2);
  justify-content: flex-end;
}

.btn-action {
  padding: 6px 12px;
  font-size: var(--font-size-xs);
  font-weight: 500;
  border-radius: var(--radius-md);
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-edit {
  background-color: var(--color-warm-100);
  color: var(--color-warm-800);
}

.btn-edit:hover {
  background-color: var(--color-warm-200);
}

.btn-delete {
  background-color: #fee2e2;
  color: #991b1b;
}

.btn-delete:hover {
  background-color: #fca5a5;
}

/* Estado vacío */
.table-empty {
  padding: var(--spacing-12) var(--spacing-4);
  text-align: center;
  background-color: var(--bg-primary);
}

.empty-title {
  font-weight: 600;
  font-size: var(--font-size-base);
  color: var(--text-primary);
  margin-bottom: var(--spacing-1);
}

.empty-desc {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

.contactos-count {
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
}
</style>
