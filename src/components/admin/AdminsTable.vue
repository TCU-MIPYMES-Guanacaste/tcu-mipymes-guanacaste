<!--
  AdminsTable.vue - Lista de administradores del sistema.

  Muestra nombre y rol: admin_profiles no guarda el correo (vive solo en
  auth.users, que PostgREST no expone al cliente). El botón de revocar se
  deshabilita en la fila del propio usuario para que un superadmin no se
  quite el acceso por error.

  Props:
  - admins (Array): filas { id, nombre_completo, rol, created_at }
  - usuarioActualId (String): id del usuario con sesión activa

  Emits:
  - eliminar (String): id del administrador a revocar
-->
<script setup>
defineProps({
  admins: {
    type: Array,
    default: () => [],
  },
  usuarioActualId: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['eliminar'])

/** Fecha corta en formato de Costa Rica; vacío si no hay dato. */
function fechaCorta(valor) {
  if (!valor) return '—'
  return new Date(valor).toLocaleDateString('es-CR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
</script>

<template>
  <div class="table-container-card">
    <div class="table-responsive">
      <table v-if="admins.length > 0" class="admin-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Rol</th>
            <th>Desde</th>
            <th class="text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="admin in admins" :key="admin.id">
            <td>
              <span class="admin-nombre">{{ admin.nombre_completo || 'Sin nombre' }}</span>
              <span v-if="admin.id === usuarioActualId" class="admin-yo">(usted)</span>
            </td>
            <td>
              <span :class="['rol-badge', admin.rol === 'superadmin' ? 'rol-super' : 'rol-editor']">
                {{ admin.rol === 'superadmin' ? 'Superadministrador' : 'Editor' }}
              </span>
            </td>
            <td class="admin-fecha">{{ fechaCorta(admin.created_at) }}</td>
            <td class="text-right">
              <button
                type="button"
                class="btn-action btn-delete"
                :disabled="admin.id === usuarioActualId"
                :title="admin.id === usuarioActualId
                  ? 'No puede revocar su propio acceso'
                  : 'Revocar el acceso de este administrador'"
                @click="emit('eliminar', admin.id)"
              >
                🗑️ Revocar acceso
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-else class="table-empty">
        <p class="empty-title">No hay administradores registrados</p>
        <p class="empty-desc">Invite a alguien con el formulario de arriba.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.table-container-card {
  background-color: var(--bg-surface);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--color-neutral-200);
  overflow: hidden;
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

.admin-nombre {
  font-weight: 600;
  color: var(--text-primary);
}

.admin-yo {
  margin-left: var(--spacing-2);
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.admin-fecha {
  color: var(--text-secondary);
}

.rol-badge {
  font-size: var(--font-size-xs);
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font-weight: 600;
}

/* Superadmin en barro (el color de marca); editor en neutro. */
.rol-super {
  background-color: var(--color-primary-100);
  color: var(--color-primary-800);
}

.rol-editor {
  background-color: var(--color-neutral-200);
  color: var(--color-neutral-600);
}

.text-right {
  text-align: right;
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

.btn-delete {
  background-color: #fee2e2;
  color: #991b1b;
}

.btn-delete:hover:not(:disabled) {
  background-color: #fca5a5;
}

.btn-delete:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

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
</style>
