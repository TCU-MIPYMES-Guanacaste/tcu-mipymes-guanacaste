<!--
  ProductoDestacadoForm.vue - Alta y edición de un producto destacado.

  No guarda nada por su cuenta: valida, arma el objeto y lo emite.
  Quien lo usa (ProductosDestacadosPanel) llama al composable.

  Props:
  - producto (Object|null): datos actuales en modo edición
  - loading (Boolean): deshabilita los botones mientras se guarda

  Emits:
  - guardar (Object): datos listos para crearProducto/actualizarProducto
  - cancelar
-->
<script setup>
import { reactive, watch } from 'vue'
import ImageUploader from './ImageUploader.vue'

const props = defineProps({
  producto: {
    type: Object,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['guardar', 'cancelar'])

const form = reactive({
  nombre: '',
  descripcion: '',
  precio_referencia: '',
  unidad: '',
  temporada: '',
  disponible: true,
  foto_url: '',
  fotoFile: null,
})

const errors = reactive({
  nombre: '',
})

// Precargar en modo edición (y limpiar al pasar a modo alta)
watch(
  () => props.producto,
  (datos) => {
    form.nombre = datos?.nombre || ''
    form.descripcion = datos?.descripcion || ''
    form.precio_referencia =
      datos?.precio_referencia === null || datos?.precio_referencia === undefined
        ? ''
        : String(datos.precio_referencia)
    form.unidad = datos?.unidad || ''
    form.temporada = datos?.temporada || ''
    form.disponible = datos?.disponible !== false
    form.foto_url = datos?.foto_url || ''
    form.fotoFile = null
    errors.nombre = ''
  },
  { immediate: true }
)

function handleArchivoSeleccionado(archivo) {
  form.fotoFile = archivo
}

function handleQuitarImagen() {
  form.fotoFile = null
  form.foto_url = ''
}

function onSubmit() {
  errors.nombre = ''
  if (!form.nombre.trim()) {
    errors.nombre = 'El nombre del producto es obligatorio.'
    return
  }
  emit('guardar', { ...form })
}
</script>

<template>
  <form class="producto-form" @submit.prevent="onSubmit">
    <h4 class="producto-form-title">
      {{ producto ? 'Editar producto' : 'Nuevo producto' }}
    </h4>

    <div class="producto-form-grid">
      <div class="producto-form-campos">
        <div class="form-group">
          <label for="producto-nombre" class="form-label required">Nombre del producto</label>
          <input
            id="producto-nombre"
            v-model="form.nombre"
            type="text"
            placeholder="Ej: Queso palmito artesanal"
            :class="{ 'input-error': errors.nombre }"
          />
          <span v-if="errors.nombre" class="error-msg">{{ errors.nombre }}</span>
        </div>

        <div class="form-group">
          <label for="producto-descripcion" class="form-label">Descripción</label>
          <textarea
            id="producto-descripcion"
            v-model="form.descripcion"
            rows="2"
            placeholder="Ej: Elaborado con leche fresca de la finca, sin conservantes."
          ></textarea>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label for="producto-precio" class="form-label">Precio de referencia (₡)</label>
            <input
              id="producto-precio"
              v-model="form.precio_referencia"
              type="number"
              min="0"
              step="0.01"
              placeholder="Ej: 2500"
            />
          </div>

          <div class="form-group">
            <label for="producto-unidad" class="form-label">Unidad</label>
            <input
              id="producto-unidad"
              v-model="form.unidad"
              type="text"
              placeholder="Ej: kg, litro, unidad"
            />
          </div>
        </div>

        <div class="form-group">
          <label for="producto-temporada" class="form-label">Temporada</label>
          <input
            id="producto-temporada"
            v-model="form.temporada"
            type="text"
            placeholder="Ej: Todo el año, Noviembre-Marzo"
          />
        </div>

        <div class="form-group toggle-group">
          <label class="toggle-switch">
            <input type="checkbox" v-model="form.disponible" />
            <span class="slider"></span>
          </label>
          <div class="toggle-text">
            <span class="toggle-title">Disponible</span>
            <p class="toggle-desc">Los productos no disponibles se ocultan al público.</p>
          </div>
        </div>
      </div>

      <div class="producto-form-imagen">
        <ImageUploader
          :current-image-path="form.foto_url"
          @archivo-seleccionado="handleArchivoSeleccionado"
          @quitar="handleQuitarImagen"
        />
      </div>
    </div>

    <div class="producto-form-actions">
      <button type="button" class="btn btn-outline" :disabled="loading" @click="emit('cancelar')">
        Cancelar
      </button>
      <button type="submit" class="btn btn-primary" :disabled="loading">
        {{ producto ? 'Guardar producto' : 'Agregar producto' }}
      </button>
    </div>
  </form>
</template>

<style scoped>
.producto-form {
  background-color: var(--bg-secondary);
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-xl);
  padding: var(--spacing-5);
  margin-bottom: var(--spacing-5);
}

.producto-form-title {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-4);
}

.producto-form-grid {
  display: grid;
  grid-template-columns: 1fr 260px;
  gap: var(--spacing-6);
  align-items: start;
}

@media (max-width: 768px) {
  .producto-form-grid {
    grid-template-columns: 1fr;
  }
}

.producto-form-campos {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
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

.input-error {
  border-color: var(--color-error) !important;
}

.error-msg {
  color: var(--color-error);
  font-size: var(--font-size-xs);
  font-weight: 500;
}

/* Switch de disponibilidad: mismo tratamiento que el de "Perfil Activo". */
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
  inset: 0;
  background-color: var(--color-neutral-300);
  transition: var(--transition-normal);
  border-radius: var(--radius-full);
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 4px;
  bottom: 4px;
  background-color: var(--text-inverse);
  transition: var(--transition-normal);
  border-radius: var(--radius-full);
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

.producto-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-3);
  margin-top: var(--spacing-5);
}

.btn {
  padding: var(--spacing-2) var(--spacing-5);
  font-size: var(--font-size-sm);
  border-radius: var(--radius-full);
  font-weight: 600;
}

.btn-outline {
  background-color: transparent;
  border: 1px solid var(--color-neutral-300);
  color: var(--text-secondary);
}

.btn-outline:hover {
  background-color: var(--bg-muted);
  color: var(--text-primary);
}

.btn-primary {
  background-color: var(--color-primary-600);
  color: var(--text-inverse);
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--color-primary-700);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
