<!--
  ImageUploader.vue - Componente de carga de imágenes con compresión en cliente.
-->
<script setup>
import { ref, watch } from 'vue'
import { getPublicImageUrl } from '@/lib/supabase'
import { useProductores } from '@/composables/useProductores'

const props = defineProps({
  /** Ruta de la imagen actual (si existe, para modo edición) */
  currentImagePath: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['uploaded'])

const { uploadImage } = useProductores()

// Estado
const previewUrl = ref('')
const loading = ref(false)
const dragActive = ref(false)
const errorMessage = ref('')

// Observar cambios en props
watch(
  () => props.currentImagePath,
  (newPath) => {
    if (newPath) {
      previewUrl.value = getPublicImageUrl(newPath)
    } else {
      previewUrl.value = ''
    }
  },
  { immediate: true }
)

// Manejo de arrastrar archivos
function handleDragEnter() {
  dragActive.value = true
}

function handleDragLeave() {
  dragActive.value = false
}

// Evento dragover
function handleDragOver(e) {
  e.preventDefault()
  dragActive.value = true
}

// Evento drop
function handleDrop(e) {
  e.preventDefault()
  dragActive.value = false
  errorMessage.value = ''
  
  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
    processAndUploadFile(e.dataTransfer.files[0])
  }
}

// Selección manual por input
function handleFileChange(e) {
  errorMessage.value = ''
  if (e.target.files && e.target.files[0]) {
    processAndUploadFile(e.target.files[0])
  }
}

/**
 * Comprime y escala una imagen usando HTML5 Canvas.
 * Retorna una Promesa con el Blob comprimido en formato JPEG.
 */
function compressImage(file, maxWidth = 1000, maxHeight = 1000, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target.result
      img.onload = () => {
        let width = img.width
        let height = img.height

        // Mantener proporción
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        // Comprimir a JPEG
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.'))
              const compressedFile = new File([blob], `${nameWithoutExt}.jpg`, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              })
              resolve(compressedFile)
            } else {
              reject(new Error('Error al generar el blob comprimido'))
            }
          },
          'image/jpeg',
          quality
        )
      }
      img.onerror = (err) => reject(err)
    }
    reader.onerror = (err) => reject(err)
  })
}

/**
 * Procesa la imagen (valida, comprime y la sube a Supabase).
 */
async function processAndUploadFile(file) {
  // Validar formato
  const validTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!validTypes.includes(file.type)) {
    errorMessage.value = 'Formato inválido. Use JPEG, PNG o WebP.'
    return
  }

  // Validar tamaño máximo (antes de compresión, alertar si es absurdo)
  if (file.size > 15 * 1024 * 1024) {
    errorMessage.value = 'El archivo es demasiado grande (máx 15MB).'
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    // Generar vista previa inmediata en el cliente
    previewUrl.value = URL.createObjectURL(file)

    // Comprimir la imagen para ahorrar espacio en Supabase
    let fileToUpload = file
    if (file.size > 200 * 1024) { // Solo comprimir si mide más de 200KB
      try {
        fileToUpload = await compressImage(file)
      } catch (err) {
        console.warn('Fallo al comprimir en cliente, subiendo archivo original.', err)
      }
    }

    // Subir a Supabase Storage
    const uploadedPath = await uploadImage(fileToUpload)
    
    if (uploadedPath) {
      emit('uploaded', uploadedPath)
      previewUrl.value = getPublicImageUrl(uploadedPath)
    } else {
      errorMessage.value = 'No se pudo subir la imagen a la base de datos.'
    }
  } catch (err) {
    errorMessage.value = 'Error al subir la imagen.'
    console.error(err)
  } finally {
    loading.value = false
  }
}

function removeImage() {
  previewUrl.value = ''
  emit('uploaded', '')
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
      <!-- Vista previa de imagen -->
      <div v-if="previewUrl" class="preview-container">
        <img :src="previewUrl" alt="Vista previa del productor" class="preview-img" />
        <div class="preview-overlay">
          <button type="button" class="btn btn-danger btn-sm" @click="removeImage" :disabled="loading">
            Cambiar Imagen
          </button>
        </div>
      </div>

      <!-- Estado de Carga -->
      <div v-else-if="loading" class="uploader-status">
        <div class="spinner"></div>
        <p>Subiendo y optimizando imagen...</p>
      </div>

      <!-- Área de arrastre vacía -->
      <div v-else class="uploader-placeholder">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="upload-icon">
          <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
        <p class="upload-text">Arrastra una imagen aquí o <span class="highlight">selecciona un archivo</span></p>
        <p class="upload-hint">Formatos: JPG, PNG, WebP (Se optimizará automáticamente)</p>
        <input 
          type="file" 
          class="file-input" 
          accept="image/jpeg, image/png, image/webp" 
          @change="handleFileChange" 
          :disabled="loading"
        />
      </div>
    </div>

    <!-- Mensaje de Error -->
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
  border-radius: var(--radius-lg);
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
