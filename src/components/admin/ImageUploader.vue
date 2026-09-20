<!--
  ImageUploader.vue - Selector de imagen con compresión en el navegador.

  NO sube nada a Supabase: comprime, muestra una vista previa y emite el
  archivo listo. La subida ocurre cuando el formulario se guarda, así
  cancelar no deja archivos huérfanos en Storage.

  Props:
  - currentImagePath (String): ruta de la imagen actual (modo edición)

  Emits:
  - archivo-seleccionado (File): imagen comprimida lista para subir
  - quitar: el usuario quitó la imagen actual
-->
<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'
import { getPublicImageUrl } from '@/lib/supabase'

const props = defineProps({
  currentImagePath: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['archivo-seleccionado', 'quitar'])

const previewUrl = ref('')
const loading = ref(false)
const dragActive = ref(false)
const errorMessage = ref('')

// URL temporal creada con createObjectURL, para liberarla al reemplazar/desmontar
let urlTemporal = ''

const TIPOS_VALIDOS = ['image/jpeg', 'image/png', 'image/webp']
const TAMANO_MAXIMO_BYTES = 15 * 1024 * 1024   // 15 MB antes de comprimir
const UMBRAL_COMPRESION_BYTES = 200 * 1024     // solo se comprime si supera 200 KB
const LADO_MAXIMO_PX = 1000
const CALIDAD_WEBP = 0.8

function liberarUrlTemporal() {
  if (urlTemporal) {
    URL.revokeObjectURL(urlTemporal)
    urlTemporal = ''
  }
}

// Mostrar la imagen actual en modo edición
watch(
  () => props.currentImagePath,
  (ruta) => {
    liberarUrlTemporal()
    previewUrl.value = ruta ? getPublicImageUrl(ruta) : ''
  },
  { immediate: true }
)

onBeforeUnmount(liberarUrlTemporal)

// --- Arrastrar y soltar ---
function handleDragEnter() {
  dragActive.value = true
}

function handleDragLeave() {
  dragActive.value = false
}

function handleDragOver(e) {
  e.preventDefault()
  dragActive.value = true
}

function handleDrop(e) {
  e.preventDefault()
  dragActive.value = false
  const archivo = e.dataTransfer?.files?.[0]
  if (archivo) procesarArchivo(archivo)
}

function handleFileChange(e) {
  const archivo = e.target.files?.[0]
  if (archivo) procesarArchivo(archivo)
  // Permitir volver a elegir el mismo archivo
  e.target.value = ''
}

/**
 * Redimensiona (máx. 1000×1000) y comprime a WebP usando Canvas.
 * Si el navegador no soporta WebP en toBlob, devuelve PNG.
 *
 * @param {File} file
 * @returns {Promise<File>}
 */
function comprimirImagen(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const urlOrigen = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(urlOrigen)

      let { width, height } = img
      const escala = Math.min(1, LADO_MAXIMO_PX / Math.max(width, height))
      width = Math.round(width * escala)
      height = Math.round(height * escala)

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('No se pudo generar la imagen comprimida'))
            return
          }
          const extension = blob.type === 'image/webp' ? 'webp' : 'png'
          const base = file.name.replace(/\.[^.]+$/, '')
          resolve(new File([blob], `${base}.${extension}`, { type: blob.type, lastModified: Date.now() }))
        },
        'image/webp',
        CALIDAD_WEBP
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(urlOrigen)
      reject(new Error('No se pudo leer la imagen'))
    }

    img.src = urlOrigen
  })
}

/** Valida, comprime, muestra la vista previa y emite el archivo listo. */
async function procesarArchivo(file) {
  errorMessage.value = ''

  if (!TIPOS_VALIDOS.includes(file.type)) {
    errorMessage.value = 'Formato inválido. Use JPEG, PNG o WebP.'
    return
  }

  if (file.size > TAMANO_MAXIMO_BYTES) {
    errorMessage.value = 'El archivo es demasiado grande (máximo 15 MB).'
    return
  }

  loading.value = true

  try {
    let archivoListo = file
    if (file.size > UMBRAL_COMPRESION_BYTES) {
      try {
        archivoListo = await comprimirImagen(file)
      } catch (err) {
        console.warn('[ImageUploader] No se pudo comprimir; se usará el original.', err)
      }
    }

    liberarUrlTemporal()
    urlTemporal = URL.createObjectURL(archivoListo)
    previewUrl.value = urlTemporal

    emit('archivo-seleccionado', archivoListo)
  } catch (err) {
    errorMessage.value = 'No se pudo procesar la imagen.'
    console.error('[ImageUploader]', err)
  } finally {
    loading.value = false
  }
}

function quitarImagen() {
  liberarUrlTemporal()
  previewUrl.value = ''
  errorMessage.value = ''
  emit('quitar')
}
</script>

<template>
  <div class="image-uploader-container">
    <label class="uploader-label">Imagen del Negocio</label>

    <div
      class="dropzone"
      :class="{ 'drag-active': dragActive, 'has-preview': previewUrl, 'loading': loading }"
      @dragenter.prevent="handleDragEnter"
      @dragleave.prevent="handleDragLeave"
      @dragover.prevent="handleDragOver"
      @drop.prevent="handleDrop"
    >
      <!-- Vista previa -->
      <div v-if="previewUrl" class="preview-container">
        <img :src="previewUrl" alt="Vista previa del productor" class="preview-img" />
        <div class="preview-overlay">
          <button type="button" class="btn btn-danger btn-sm" :disabled="loading" @click="quitarImagen">
            Quitar imagen
          </button>
        </div>
      </div>

      <!-- Procesando -->
      <div v-else-if="loading" class="uploader-status">
        <div class="spinner"></div>
        <p>Optimizando imagen...</p>
      </div>

      <!-- Zona vacía -->
      <div v-else class="uploader-placeholder">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="upload-icon">
          <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
        <p class="upload-text">Arrastra una imagen aquí o <span class="highlight">selecciona un archivo</span></p>
        <p class="upload-hint">JPG, PNG o WebP. Se optimiza automáticamente y se sube al guardar.</p>
        <input
          type="file"
          class="file-input"
          accept="image/jpeg, image/png, image/webp"
          :disabled="loading"
          @change="handleFileChange"
        />
      </div>
    </div>

    <!-- Error -->
    <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
  </div>
</template>

<style scoped>
.image-uploader-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  width: 100%;
}

.uploader-label {
  font-weight: 600;
  color: var(--text-primary);
  font-size: var(--font-size-sm);
}

.dropzone {
  position: relative;
  width: 100%;
  height: 220px;
  border: 2px dashed var(--color-neutral-300);
  border-radius: var(--radius-xl);
  background-color: var(--bg-secondary);
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  transition: all var(--transition-fast);
}

.dropzone.drag-active {
  border-color: var(--color-primary-500);
  background-color: var(--color-primary-50);
}

.dropzone.has-preview {
  border-style: solid;
  border-color: var(--color-neutral-200);
}

.uploader-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--spacing-6);
  cursor: pointer;
  width: 100%;
  height: 100%;
  justify-content: center;
}

.file-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.upload-icon {
  width: 48px;
  height: 48px;
  color: var(--color-neutral-400);
  margin-bottom: var(--spacing-3);
  transition: color var(--transition-fast);
}

.uploader-placeholder:hover .upload-icon {
  color: var(--color-primary-500);
}

.upload-text {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-bottom: var(--spacing-1);
}

.upload-text .highlight {
  color: var(--color-primary-600);
  font-weight: 600;
  text-decoration: underline;
}

.upload-hint {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

/* Vista previa */
.preview-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.preview-container:hover .preview-overlay {
  opacity: 1;
}

/* Spinner de carga */
.uploader-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-3);
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--color-neutral-200);
  border-top-color: var(--color-primary-500);
  border-radius: var(--radius-full);
  animation: spin 1s infinite linear;
}

.error-text {
  font-size: var(--font-size-xs);
  color: var(--color-error);
  margin-top: var(--spacing-1);
}

.btn-danger {
  background-color: var(--color-error);
  color: white;
  padding: var(--spacing-2) var(--spacing-4);
  font-size: var(--font-size-sm);
  border-radius: var(--radius-md);
  border: none;
}

.btn-danger:hover {
  background-color: #dc2626;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
