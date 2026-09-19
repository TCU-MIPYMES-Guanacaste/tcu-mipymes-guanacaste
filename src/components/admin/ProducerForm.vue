<!--
  ProducerForm.vue - Formulario completo para crear/editar productores.
-->
<script setup>
import { reactive, watch } from 'vue'
import { esTelefonoValido } from '@/utils/telefono'
import ImageUploader from './ImageUploader.vue'

const props = defineProps({
  /** Datos iniciales del productor (modo edición) */
  initialData: {
    type: Object,
    default: null,
  },
  /** Cantones para el selector */
  cantones: {
    type: Array,
    default: () => [],
  },
  /** Categorías para los checkboxes */
  categorias: {
    type: Array,
    default: () => [],
  },
  /** Estado de carga del envío */
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['submit', 'cancel'])

// Estado del formulario
const form = reactive({
  nombre_negocio: '',
  nombre_contacto: '',
  telefono: '',
  email: '',
  descripcion: '',
  canton_id: '',
  direccion_detalle: '',
  foto_url: '',
  activo: true,
  categoria_ids: [],
  fotoFile: null,   // imagen nueva pendiente de subir (se sube al guardar)
})

// Mensajes de validación
const errors = reactive({
  nombre_negocio: '',
  nombre_contacto: '',
  telefono: '',
  canton_id: '',
  categorias: '',
})

// Precargar datos en modo edición
watch(
  () => props.initialData,
  (datos) => {
    if (!datos) return
    form.nombre_negocio = datos.nombre_negocio || ''
    form.nombre_contacto = datos.nombre_contacto || ''
    form.telefono = datos.telefono || ''
    form.email = datos.email || ''
    form.descripcion = datos.descripcion || ''
    form.canton_id = datos.canton_id || ''
    form.direccion_detalle = datos.direccion_detalle || ''
    form.foto_url = datos.foto_url || ''
    form.activo = datos.activo !== undefined ? datos.activo : true
    form.categoria_ids = (datos.categorias ?? [])
      .map((c) => c.categoria?.id || c.categoria_id)
      .filter(Boolean)
    form.fotoFile = null
  },
  { immediate: true }
)

// --- Imagen ---
function handleArchivoSeleccionado(archivo) {
  form.fotoFile = archivo
}

function handleQuitarImagen() {
  form.fotoFile = null
  form.foto_url = ''
}

// --- Categorías ---
function toggleCategoria(id) {
  const indice = form.categoria_ids.indexOf(id)
  if (indice === -1) {
    form.categoria_ids.push(id)
  } else {
    form.categoria_ids.splice(indice, 1)
  }
}

// --- Validación ---
function validateForm() {
  let valido = true

  for (const clave of Object.keys(errors)) errors[clave] = ''

  if (!form.nombre_negocio.trim()) {
    errors.nombre_negocio = 'El nombre del negocio es obligatorio.'
    valido = false
  }

  if (!form.nombre_contacto.trim()) {
    errors.nombre_contacto = 'El nombre de contacto es obligatorio.'
    valido = false
  }

  if (!form.telefono.trim()) {
    errors.telefono = 'El teléfono es obligatorio.'
    valido = false
  } else if (!esTelefonoValido(form.telefono)) {
    errors.telefono = 'Ingrese un número de 8 dígitos (ej: 8888-4444).'
    valido = false
  }

  if (!form.canton_id) {
    errors.canton_id = 'Debe seleccionar un cantón.'
    valido = false
  }

  if (form.categoria_ids.length === 0) {
    errors.categorias = 'Debe seleccionar al menos una categoría de alimentos.'
    valido = false
  }

  return valido
}

function onSubmit() {
  if (!validateForm()) return
  emit('submit', { ...form, categoria_ids: [...form.categoria_ids] })
}
</script>

<template>
  <form @submit.prevent="onSubmit" class="producer-form-card">
    <div class="form-grid">
      <!-- Columna Izquierda: Información -->
      <div class="form-column">
        <!-- Nombre del Negocio -->
        <div class="form-group">
          <label for="nombre_negocio" class="form-label required">Nombre del Negocio</label>
          <input
            id="nombre_negocio"
            v-model="form.nombre_negocio"
            type="text"
            placeholder="Ej: Finca Orgánica La Cosecha"
            :class="{ 'input-error': errors.nombre_negocio }"
          />
          <span v-if="errors.nombre_negocio" class="error-msg">{{ errors.nombre_negocio }}</span>
        </div>

        <!-- Descripción -->
        <div class="form-group">
          <label for="descripcion" class="form-label">Descripción</label>
          <textarea
            id="descripcion"
            v-model="form.descripcion"
            rows="3"
            placeholder="Describa el negocio, productos estrella y métodos de entrega..."
          ></textarea>
        </div>

        <!-- Datos de Contacto -->
        <div class="form-row-2">
          <!-- Nombre de Contacto -->
          <div class="form-group">
            <label for="nombre_contacto" class="form-label required">Nombre del Contacto</label>
            <input
              id="nombre_contacto"
              v-model="form.nombre_contacto"
              type="text"
              placeholder="Ej: Juan Pérez"
              :class="{ 'input-error': errors.nombre_contacto }"
            />
            <span v-if="errors.nombre_contacto" class="error-msg">{{ errors.nombre_contacto }}</span>
          </div>

          <!-- Teléfono -->
          <div class="form-group">
            <label for="telefono" class="form-label required">Teléfono (WhatsApp)</label>
            <input
              id="telefono"
              v-model="form.telefono"
              type="tel"
              placeholder="Ej: 8888-4444"
              :class="{ 'input-error': errors.telefono }"
            />
            <span v-if="errors.telefono" class="error-msg">{{ errors.telefono }}</span>
          </div>
        </div>

        <!-- Email y Cantón -->
        <div class="form-row-2">
          <!-- Correo electrónico -->
          <div class="form-group">
            <label for="email" class="form-label">Correo Electrónico</label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              placeholder="Ej: contacto@ejemplo.com"
            />
          </div>

          <!-- Cantón -->
          <div class="form-group">
            <label for="canton" class="form-label required">Cantón</label>
            <select
              id="canton"
              v-model="form.canton_id"
              :class="{ 'input-error': errors.canton_id }"
            >
              <option value="" disabled selected>Seleccione un cantón</option>
              <option v-for="c in cantones" :key="c.id" :value="c.id">
                {{ c.nombre }}
              </option>
            </select>
            <span v-if="errors.canton_id" class="error-msg">{{ errors.canton_id }}</span>
          </div>
        </div>

        <!-- Dirección detallada -->
        <div class="form-group">
          <label for="direccion_detalle" class="form-label">Dirección / Referencia</label>
          <textarea
            id="direccion_detalle"
            v-model="form.direccion_detalle"
            rows="2"
            placeholder="Ej: 200m oeste de la plaza de deportes, portón verde."
          ></textarea>
        </div>
      </div>

      <!-- Columna Derecha: Imagen y Categorías -->
      <div class="form-column">
        <!-- Componente de Subida de Imagen -->
        <div class="form-group">
          <ImageUploader
            :current-image-path="form.foto_url"
            @archivo-seleccionado="handleArchivoSeleccionado"
            @quitar="handleQuitarImagen"
          />
        </div>

        <!-- Categorías de Alimentos -->
        <div class="form-group">
          <label class="form-label required">Categorías de Alimentos</label>
          <p class="form-hint">Seleccione una o más categorías aplicables:</p>
          <div class="categories-checkbox-grid" :class="{ 'categories-error-border': errors.categorias }">
            <label
              v-for="cat in categorias"
              :key="cat.id"
              class="category-checkbox-item"
              :class="{ 'checked': form.categoria_ids.includes(cat.id) }"
            >
              <input
                type="checkbox"
                :checked="form.categoria_ids.includes(cat.id)"
                @change="toggleCategoria(cat.id)"
              />
              <span class="category-icon">{{ cat.icono || '🌾' }}</span>
              <span class="category-name">{{ cat.nombre }}</span>
            </label>
          </div>
          <span v-if="errors.categorias" class="error-msg">{{ errors.categorias }}</span>
        </div>

        <!-- Estado Activo/Inactivo -->
        <div class="form-group toggle-group">
          <label class="toggle-switch">
            <input type="checkbox" v-model="form.activo" />
            <span class="slider"></span>
          </label>
          <div class="toggle-text">
            <span class="toggle-title">Perfil Activo</span>
            <p class="toggle-desc">Permite controlar la visibilidad en el directorio público.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Botones de Acción -->
    <div class="form-actions">
      <button
        type="button"
        class="btn btn-outline"
        @click="emit('cancel')"
        :disabled="loading"
      >
        Cancelar
      </button>
      <button
        type="submit"
        class="btn btn-primary btn-submit"
        :disabled="loading"
      >
        <span v-if="loading" class="btn-spinner"></span>
        {{ initialData ? 'Guardar Cambios' : 'Registrar Productor' }}
      </button>
    </div>
  </form>
</template>

<style scoped>
.producer-form-card {
  background-color: var(--bg-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: var(--spacing-6);
  border: 1px solid var(--color-neutral-200);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-8);
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-6);
  }
}

.form-column {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-5);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-4);
}

@media (max-width: 480px) {
  .form-row-2 {
    grid-template-columns: 1fr;
  }
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

.form-hint {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  margin-top: -4px;
}

/* Errores de validación */
.input-error {
  border-color: var(--color-error) !important;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
}

.error-msg {
  color: var(--color-error);
  font-size: var(--font-size-xs);
  font-weight: 500;
}

/* Categorías Checkboxes */
.categories-checkbox-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-2);
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid var(--color-neutral-300);
  border-radius: var(--radius-md);
  padding: var(--spacing-3);
  background-color: var(--bg-secondary);
}

.categories-error-border {
  border-color: var(--color-error) !important;
}

.category-checkbox-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2);
  background-color: var(--bg-surface);
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: all var(--transition-fast);
  user-select: none;
}

.category-checkbox-item input {
  display: none;
}

.category-checkbox-item:hover {
  border-color: var(--color-primary-400);
  background-color: var(--color-primary-50);
}

.category-checkbox-item.checked {
  border-color: var(--color-primary-600);
  background-color: var(--color-primary-100);
  font-weight: 600;
}

.category-icon {
  font-size: 1.1rem;
}

.category-name {
  color: var(--text-primary);
}

/* Switch de Activo */
.toggle-group {
  flex-direction: row;
  align-items: center;
  gap: var(--spacing-4);
  padding: var(--spacing-3);
  background-color: var(--color-primary-50);
  border: 1px solid var(--color-primary-200);
  border-radius: var(--radius-md);
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  flex-shrink: 0;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--color-neutral-300);
  transition: .4s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: var(--color-primary-600);
}

input:checked + .slider:before {
  transform: translateX(20px);
}

.toggle-text {
  display: flex;
  flex-direction: column;
}

.toggle-title {
  font-weight: 600;
  font-size: var(--font-size-sm);
  color: var(--color-primary-900);
}

.toggle-desc {
  font-size: var(--font-size-xs);
  color: var(--color-primary-800);
  opacity: 0.8;
  margin: 0;
}

/* Botones de acción */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-4);
  margin-top: var(--spacing-8);
  border-top: 1px solid var(--color-neutral-200);
  padding-top: var(--spacing-6);
}

.btn {
  padding: var(--spacing-3) var(--spacing-6);
  font-size: var(--font-size-base);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
}

.btn-outline {
  background-color: transparent;
  border: 1px solid var(--color-neutral-300);
  color: var(--text-secondary);
}

.btn-outline:hover {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
}

.btn-primary {
  background-color: var(--color-primary-600);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--color-primary-700);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Spinner dentro del botón */
.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s infinite linear;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
