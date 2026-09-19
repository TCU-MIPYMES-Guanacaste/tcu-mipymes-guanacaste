<!--
  ResetPasswordView.vue - Cambio de contraseña desde el enlace del correo.

  El enlace de recuperación de Supabase trae al usuario aquí con una sesión
  temporal. Si hay sesión, se pide la nueva contraseña; si no, el enlace
  es inválido o expiró.

  Ruta: /restablecer-contrasena
-->
<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth, authReady } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const { isAuthenticated, updatePassword, loading, error } = useAuth()
const { mostrarExito } = useToast()

const verificando = ref(true)
const nuevaContrasena = ref('')
const confirmacion = ref('')
const errorLocal = ref('')

const LONGITUD_MINIMA = 8

onMounted(async () => {
  await authReady
  verificando.value = false
})

async function handleSubmit() {
  errorLocal.value = ''

  if (nuevaContrasena.value.length < LONGITUD_MINIMA) {
    errorLocal.value = `La contraseña debe tener al menos ${LONGITUD_MINIMA} caracteres.`
    return
  }

  if (nuevaContrasena.value !== confirmacion.value) {
    errorLocal.value = 'Las contraseñas no coinciden.'
    return
  }

  try {
    await updatePassword(nuevaContrasena.value)
    mostrarExito('Contraseña actualizada correctamente.')
    router.push({ name: 'admin-dashboard' })
  } catch (err) {
    // El mensaje traducido ya está en `error`
    console.error('[ResetPasswordView]', err)
  }
}
</script>

<template>
  <div class="reset-view">
    <div class="reset-card">
      <!-- Esperando a saber si hay sesión -->
      <p v-if="verificando" class="reset-subtitle">Verificando el enlace...</p>

      <!-- Enlace válido: formulario -->
      <template v-else-if="isAuthenticated">
        <h1 class="reset-title">Nueva contraseña</h1>
        <p class="reset-subtitle">Escriba y confirme su nueva contraseña</p>

        <div v-if="errorLocal || error" class="reset-error" role="alert">
          ⚠️ {{ errorLocal || error }}
        </div>

        <form class="reset-form" @submit.prevent="handleSubmit">
          <div class="form-group">
            <label for="nueva" class="form-label">Nueva contraseña</label>
            <input
              id="nueva"
              v-model="nuevaContrasena"
              type="password"
              class="form-input"
              :minlength="LONGITUD_MINIMA"
              required
              autocomplete="new-password"
            />
          </div>

          <div class="form-group">
            <label for="confirmacion" class="form-label">Confirmar contraseña</label>
            <input
              id="confirmacion"
              v-model="confirmacion"
              type="password"
              class="form-input"
              :minlength="LONGITUD_MINIMA"
              required
              autocomplete="new-password"
            />
          </div>

          <button type="submit" class="reset-button" :disabled="loading">
            {{ loading ? 'Guardando...' : 'Guardar contraseña' }}
          </button>
        </form>
      </template>

      <!-- Sin sesión: enlace inválido o expirado -->
      <template v-else>
        <h1 class="reset-title">Enlace inválido o expirado</h1>
        <p class="reset-subtitle">
          Solicite uno nuevo desde la pantalla de inicio de sesión con la opción "¿Olvidó su contraseña?".
        </p>
        <RouterLink :to="{ name: 'login' }" class="reset-button reset-button--link">
          Ir a iniciar sesión
        </RouterLink>
      </template>
    </div>
  </div>
</template>

<style scoped>
.reset-view {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: var(--spacing-12) var(--spacing-4);
}

.reset-card {
  width: 100%;
  max-width: 420px;
  background: var(--bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: var(--spacing-8);
}

.reset-title {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 var(--spacing-2);
}

.reset-subtitle {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  margin: 0 0 var(--spacing-6);
  line-height: 1.5;
}

.reset-error {
  background-color: #fef2f2;
  color: var(--color-error);
  border: 1px solid #fecaca;
  border-radius: var(--radius-md);
  padding: var(--spacing-3) var(--spacing-4);
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-4);
}

.reset-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.form-label {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-text);
}

.form-input {
  padding: 0.65rem var(--spacing-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  font-family: inherit;
}

.form-input:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 1px;
  border-color: var(--color-primary);
}

.reset-button {
  display: block;
  width: 100%;
  padding: 0.75rem;
  background-color: var(--color-primary);
  color: var(--color-white);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  font-weight: 600;
  cursor: pointer;
  text-align: center;
  text-decoration: none;
  transition: background-color var(--transition-fast);
}

.reset-button:hover:not(:disabled) {
  background-color: var(--color-primary-dark);
}

.reset-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.reset-button--link {
  margin-top: var(--spacing-2);
}
</style>
