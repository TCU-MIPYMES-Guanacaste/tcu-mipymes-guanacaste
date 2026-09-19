<!--
  LoginView.vue - Formulario de inicio de sesión para administradores.

  Página oculta (no aparece en la navegación principal) que permite
  a los administradores iniciar sesión con correo y contraseña
  para acceder al panel de administración.
-->
<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const route = useRoute()
const { login, resetPassword, loading, error } = useAuth()

// Campos del formulario
const email = ref('')
const password = ref('')

// Modo "olvidé mi contraseña"
const modoRecuperacion = ref(false)
const recuperacionEnviada = ref(false)

/** Iniciar sesión y volver a la ruta original (o al panel) */
async function handleLogin() {
  try {
    await login(email.value, password.value)
    router.push(route.query.redirect || '/admin')
  } catch (err) {
    // El mensaje ya quedó en `error`
    console.error('[LoginView] Error en login:', err)
  }
}

/**
 * Enviar el correo de recuperación. Siempre muestra el mismo mensaje,
 * exista o no la cuenta, para no revelar qué correos están registrados.
 */
async function handleRecuperar() {
  try {
    await resetPassword(email.value)
  } catch (err) {
    console.error('[LoginView] Error al solicitar recuperación:', err)
  } finally {
    recuperacionEnviada.value = true
  }
}

function abrirRecuperacion() {
  modoRecuperacion.value = true
  recuperacionEnviada.value = false
  error.value = null
}

function volverALogin() {
  modoRecuperacion.value = false
  recuperacionEnviada.value = false
  error.value = null
}
</script>

<template>
  <div class="login-view">
    <div class="login-card">
      <!-- ===== Modo recuperación de contraseña ===== -->
      <template v-if="modoRecuperacion">
        <h1 class="login-title">Recuperar contraseña</h1>
        <p class="login-subtitle">Le enviaremos un enlace para crear una contraseña nueva</p>

        <div v-if="recuperacionEnviada" class="login-info" role="status">
          ✉️ Si el correo está registrado, recibirá un enlace en unos minutos.
          Revise también la carpeta de spam.
        </div>

        <form v-else class="login-form" @submit.prevent="handleRecuperar">
          <div class="form-group">
            <label for="email-recuperacion" class="form-label">Correo electrónico</label>
            <input
              id="email-recuperacion"
              v-model="email"
              type="email"
              class="form-input"
              placeholder="admin@ejemplo.com"
              required
              autocomplete="email"
            />
          </div>

          <button type="submit" class="login-button" :disabled="loading">
            {{ loading ? 'Enviando...' : 'Enviar enlace de recuperación' }}
          </button>
        </form>

        <button type="button" class="login-link-button" @click="volverALogin">
          ← Volver a iniciar sesión
        </button>
      </template>

      <!-- ===== Modo login ===== -->
      <template v-else>
        <h1 class="login-title">Iniciar Sesión</h1>
        <p class="login-subtitle">Panel de administración del directorio</p>

        <!-- Mensaje de error -->
        <div v-if="error" class="login-error" role="alert">
          ⚠️ {{ error }}
        </div>

        <form class="login-form" @submit.prevent="handleLogin">
          <div class="form-group">
            <label for="email" class="form-label">Correo electrónico</label>
            <input
              id="email"
              v-model="email"
              type="email"
              class="form-input"
              placeholder="admin@ejemplo.com"
              required
              autocomplete="email"
            />
          </div>

          <div class="form-group">
            <label for="password" class="form-label">Contraseña</label>
            <input
              id="password"
              v-model="password"
              type="password"
              class="form-input"
              placeholder="••••••••"
              required
              autocomplete="current-password"
            />
          </div>

          <button type="submit" class="login-button" :disabled="loading">
            {{ loading ? 'Ingresando...' : 'Ingresar' }}
          </button>
        </form>

        <button type="button" class="login-link-button" @click="abrirRecuperacion">
          ¿Olvidó su contraseña?
        </button>

        <RouterLink to="/" class="login-back-link">
          ← Volver al directorio
        </RouterLink>
      </template>
    </div>
  </div>
</template>

<style scoped>
.login-view {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 2rem;
}

.login-card {
  width: 100%;
  max-width: 400px;
  background: var(--color-white);
  padding: 2.5rem;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}

.login-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 0.25rem;
  text-align: center;
  color: var(--color-text);
}

.login-subtitle {
  text-align: center;
  color: var(--color-text-muted);
  font-size: 0.9rem;
  margin: 0 0 1.5rem;
}

.login-error {
  background-color: var(--color-error-light, #fef2f2);
  color: var(--color-error, #dc2626);
  padding: 0.75rem 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-label {
  display: block;
  font-size: 0.85rem;
  font-weight: 500;
  margin-bottom: 0.35rem;
  color: var(--color-text);
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid var(--color-border);
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.login-button {
  width: 100%;
  padding: 0.85rem;
  background-color: var(--color-primary);
  color: var(--color-white);
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-top: 0.5rem;
}

.login-button:hover:not(:disabled) {
  background-color: var(--color-primary-dark);
}

.login-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.login-back-link {
  display: block;
  text-align: center;
  margin-top: 1.5rem;
  color: var(--color-text-muted);
  text-decoration: none;
  font-size: 0.85rem;
}

.login-back-link:hover {
  color: var(--color-primary);
}

.login-info {
  background-color: var(--color-primary-50);
  color: var(--color-primary-800);
  border: 1px solid var(--color-primary-200);
  border-radius: var(--radius-md);
  padding: var(--spacing-3) var(--spacing-4);
  font-size: var(--font-size-sm);
  line-height: 1.5;
  margin-bottom: var(--spacing-4);
}

.login-link-button {
  display: block;
  width: 100%;
  margin-top: var(--spacing-4);
  background: none;
  border: none;
  color: var(--color-primary);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  text-align: center;
}

.login-link-button:hover {
  text-decoration: underline;
}
</style>
