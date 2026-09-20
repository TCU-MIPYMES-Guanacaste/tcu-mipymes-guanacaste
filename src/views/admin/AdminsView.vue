<!--
  AdminsView.vue - Gestión de administradores del sistema.

  Solo accesible para superadmins (meta.requiresSuperadmin en la ruta y
  políticas RLS de admin_profiles como barrera real).

  Ruta: /admin/administradores
-->
<script setup>
import { onMounted, reactive } from 'vue'
import { useAdmins } from '@/composables/useAdmins'
import { useAuth } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'
import AdminsTable from '@/components/admin/AdminsTable.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const { admins, loading, error, fetchAdmins, invitarAdmin, eliminarAdmin } = useAdmins()
const { currentUser } = useAuth()
const { mostrarExito, mostrarError } = useToast()

const invitacion = reactive({
  email: '',
  nombre: '',
  rol: 'editor',
})

onMounted(() => {
  fetchAdmins()
})

async function handleInvitar() {
  const ok = await invitarAdmin(invitacion.email, invitacion.nombre, invitacion.rol)
  if (!ok) {
    mostrarError(error.value || 'No se pudo enviar la invitación.')
    return
  }

  mostrarExito(`Invitación enviada a ${invitacion.email.trim()}.`)
  invitacion.email = ''
  invitacion.nombre = ''
  invitacion.rol = 'editor'
  await fetchAdmins()
}

async function handleEliminar(id) {
  const admin = admins.value.find((a) => a.id === id)
  const confirmado = window.confirm(
    `¿Revocar el acceso de ${admin?.nombre_completo || 'este administrador'}? ` +
    'Dejará de poder entrar al panel. Su cuenta de correo no se elimina.'
  )
  if (!confirmado) return

  const ok = await eliminarAdmin(id)
  if (ok) {
    mostrarExito('Acceso revocado.')
  } else {
    mostrarError(error.value || 'No se pudo revocar el acceso.')
  }
}
</script>

<template>
  <div class="admins-view">
    <header class="admin-header">
      <h1 class="admin-title">Administradores</h1>
    </header>

    <!-- Invitación -->
    <section class="invitar-card">
      <h2 class="invitar-title">Invitar administrador</h2>
      <p class="invitar-desc">
        Se le enviará un correo para que elija su contraseña. Un
        <strong>editor</strong> gestiona productores, productos y catálogos; un
        <strong>superadministrador</strong> además gestiona esta lista.
      </p>

      <form class="invitar-form" @submit.prevent="handleInvitar">
        <div class="form-group">
          <label for="invitar-email" class="form-label required">Correo electrónico</label>
          <input
            id="invitar-email"
            v-model="invitacion.email"
            type="email"
            placeholder="Ej: persona@ucr.ac.cr"
            required
          />
        </div>

        <div class="form-group">
          <label for="invitar-nombre" class="form-label required">Nombre completo</label>
          <input
            id="invitar-nombre"
            v-model="invitacion.nombre"
            type="text"
            placeholder="Ej: María Rodríguez"
            required
          />
        </div>

        <div class="form-group">
          <label for="invitar-rol" class="form-label">Rol</label>
          <select id="invitar-rol" v-model="invitacion.rol">
            <option value="editor">Editor</option>
            <option value="superadmin">Superadministrador</option>
          </select>
        </div>

        <button type="submit" class="btn-invitar" :disabled="loading">
          ✉️ Enviar invitación
        </button>
      </form>
    </section>

    <LoadingSpinner v-if="loading && admins.length === 0" message="Cargando administradores..." />

    <div v-else-if="error && admins.length === 0" class="error-message">
      <p>⚠️ {{ error }}</p>
    </div>

    <AdminsTable
      v-else
      :admins="admins"
      :usuario-actual-id="currentUser?.id || ''"
      @eliminar="handleEliminar"
    />
  </div>
</template>

<style scoped>
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

.invitar-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
  padding: var(--spacing-6);
  margin-bottom: var(--spacing-6);
}

.invitar-title {
  font-size: var(--font-size-lg);
  font-family: var(--font-family);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-2);
}

.invitar-desc {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-5);
  max-width: 62ch;
}

.invitar-form {
  display: grid;
  grid-template-columns: 2fr 2fr 1fr auto;
  gap: var(--spacing-4);
  align-items: end;
}

@media (max-width: 900px) {
  .invitar-form {
    grid-template-columns: 1fr;
    align-items: stretch;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.form-label {
  font-weight: 600;
  font-size: var(--font-size-sm);
  color: var(--text-primary);
}

.form-label.required::after {
  content: ' *';
  color: var(--color-error);
}

.btn-invitar {
  padding: var(--spacing-3) var(--spacing-6);
  background-color: var(--color-primary-600);
  color: var(--text-inverse);
  border-radius: var(--radius-full);
  font-weight: 600;
  font-size: var(--font-size-sm);
  white-space: nowrap;
}

.btn-invitar:hover:not(:disabled) {
  background-color: var(--color-primary-700);
}

.btn-invitar:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  color: var(--color-error);
  font-weight: 500;
}
</style>
