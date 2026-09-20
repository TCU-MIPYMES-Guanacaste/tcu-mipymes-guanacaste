<!--
  CatalogosPanel.vue - Gestión de categorías y cantones desde el panel admin.

  Dos listas independientes con alta, renombrado en línea y borrado.
  Disponible para cualquier administrador (editor o superadmin).
-->
<script setup>
import { onMounted, ref } from 'vue'
import { useCatalogos } from '@/composables/useCatalogos'
import { useToast } from '@/composables/useToast'
import SelectorIconoCategoria from './SelectorIconoCategoria.vue'

const {
  cantones,
  categorias,
  error,
  fetchCantones,
  fetchCategorias,
  crearCategoria,
  renombrarCategoria,
  eliminarCategoria,
  crearCanton,
  renombrarCanton,
  eliminarCanton,
} = useCatalogos()
const { mostrarExito, mostrarError } = useToast()

// Formularios de alta
const nuevaCategoria = ref('')
const nuevoIcono = ref('')
const nuevoCanton = ref('')

// Renombrado en línea: id de la fila en edición y el texto/ícono provisional
const categoriaEditandoId = ref(null)
const cantonEditandoId = ref(null)
const nombreEditado = ref('')
const iconoEditado = ref('')

onMounted(() => {
  fetchCategorias()
  fetchCantones()
})

// --- Categorías ---
async function agregarCategoria() {
  const creada = await crearCategoria(nuevaCategoria.value, nuevoIcono.value)
  if (!creada) {
    mostrarError(error.value || 'No se pudo crear la categoría.')
    return
  }
  nuevaCategoria.value = ''
  nuevoIcono.value = ''
  mostrarExito('Categoría creada.')
}

function empezarEdicionCategoria(categoria) {
  cantonEditandoId.value = null
  categoriaEditandoId.value = categoria.id
  nombreEditado.value = categoria.nombre
  iconoEditado.value = categoria.icono || ''
}

async function guardarCategoria(id) {
  const actualizada = await renombrarCategoria(id, nombreEditado.value, iconoEditado.value)
  if (!actualizada) {
    mostrarError(error.value || 'No se pudo renombrar la categoría.')
    return
  }
  categoriaEditandoId.value = null
  mostrarExito('Categoría renombrada.')
}

async function borrarCategoria(categoria) {
  const confirmado = window.confirm(`¿Eliminar la categoría "${categoria.nombre}"?`)
  if (!confirmado) return

  const ok = await eliminarCategoria(categoria.id)
  if (ok) {
    mostrarExito('Categoría eliminada.')
  } else {
    mostrarError(error.value || 'No se pudo eliminar la categoría.')
  }
}

// --- Cantones ---
async function agregarCanton() {
  const creado = await crearCanton(nuevoCanton.value)
  if (!creado) {
    mostrarError(error.value || 'No se pudo crear el cantón.')
    return
  }
  nuevoCanton.value = ''
  mostrarExito('Cantón creado.')
}

function empezarEdicionCanton(canton) {
  categoriaEditandoId.value = null
  cantonEditandoId.value = canton.id
  nombreEditado.value = canton.nombre
}

async function guardarCanton(id) {
  const actualizado = await renombrarCanton(id, nombreEditado.value)
  if (!actualizado) {
    mostrarError(error.value || 'No se pudo renombrar el cantón.')
    return
  }
  cantonEditandoId.value = null
  mostrarExito('Cantón renombrado.')
}

async function borrarCanton(canton) {
  const confirmado = window.confirm(`¿Eliminar el cantón "${canton.nombre}"?`)
  if (!confirmado) return

  const ok = await eliminarCanton(canton.id)
  if (ok) {
    mostrarExito('Cantón eliminado.')
  } else {
    mostrarError(error.value || 'No se pudo eliminar el cantón.')
  }
}

function cancelarEdicion() {
  categoriaEditandoId.value = null
  cantonEditandoId.value = null
  nombreEditado.value = ''
  iconoEditado.value = ''
}
</script>

<template>
  <section class="catalogos-panel">
    <header class="catalogos-header">
      <h2 class="catalogos-title">Categorías y cantones</h2>
      <p class="catalogos-subtitle">
        Alimentan los filtros del directorio y el formulario de productores.
      </p>
    </header>

    <div class="catalogos-grid">
      <!-- Categorías -->
      <div class="catalogo-card">
        <h3 class="catalogo-card-title">Categorías de alimentos</h3>

        <form class="catalogo-alta" @submit.prevent="agregarCategoria">
          <SelectorIconoCategoria v-model="nuevoIcono" />
          <input
            v-model="nuevaCategoria"
            type="text"
            placeholder="Nombre de la categoría"
            aria-label="Nombre de la categoría"
          />
          <button type="submit" class="btn-alta">Agregar</button>
        </form>

        <ul class="catalogo-lista">
          <li v-for="cat in categorias" :key="cat.id" class="catalogo-fila">
            <template v-if="categoriaEditandoId === cat.id">
              <div class="catalogo-edicion-categoria">
                <SelectorIconoCategoria v-model="iconoEditado" />
                <input v-model="nombreEditado" type="text" aria-label="Nuevo nombre" />
              </div>
              <div class="catalogo-acciones">
                <button type="button" class="btn-action btn-edit" @click="guardarCategoria(cat.id)">
                  Guardar
                </button>
                <button type="button" class="btn-action btn-cancel" @click="cancelarEdicion">
                  Cancelar
                </button>
              </div>
            </template>
            <template v-else>
              <span class="catalogo-nombre">
                <span class="catalogo-icono">{{ cat.icono || '🏷️' }}</span>
                {{ cat.nombre }}
              </span>
              <div class="catalogo-acciones">
                <button
                  type="button"
                  class="btn-icon btn-icon-edit"
                  aria-label="Renombrar categoría"
                  title="Renombrar"
                  @click="empezarEdicionCategoria(cat)"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                  </svg>
                </button>
                <button
                  type="button"
                  class="btn-icon btn-icon-delete"
                  aria-label="Eliminar categoría"
                  title="Eliminar"
                  @click="borrarCategoria(cat)"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 6h18" />
                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6M14 11v6" />
                  </svg>
                </button>
              </div>
            </template>
          </li>
        </ul>

        <p v-if="!categorias.length" class="catalogo-vacio">Aún no hay categorías.</p>
      </div>

      <!-- Cantones -->
      <div class="catalogo-card">
        <h3 class="catalogo-card-title">Cantones</h3>

        <form class="catalogo-alta" @submit.prevent="agregarCanton">
          <input
            v-model="nuevoCanton"
            type="text"
            placeholder="Nombre del cantón"
            aria-label="Nombre del cantón"
          />
          <button type="submit" class="btn-alta">Agregar</button>
        </form>

        <ul class="catalogo-lista">
          <li v-for="canton in cantones" :key="canton.id" class="catalogo-fila">
            <template v-if="cantonEditandoId === canton.id">
              <input v-model="nombreEditado" type="text" aria-label="Nuevo nombre" />
              <div class="catalogo-acciones">
                <button type="button" class="btn-action btn-edit" @click="guardarCanton(canton.id)">
                  Guardar
                </button>
                <button type="button" class="btn-action btn-cancel" @click="cancelarEdicion">
                  Cancelar
                </button>
              </div>
            </template>
            <template v-else>
              <span class="catalogo-nombre">📍 {{ canton.nombre }}</span>
              <div class="catalogo-acciones">
                <button
                  type="button"
                  class="btn-icon btn-icon-edit"
                  aria-label="Renombrar cantón"
                  title="Renombrar"
                  @click="empezarEdicionCanton(canton)"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                  </svg>
                </button>
                <button
                  type="button"
                  class="btn-icon btn-icon-delete"
                  aria-label="Eliminar cantón"
                  title="Eliminar"
                  @click="borrarCanton(canton)"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 6h18" />
                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6M14 11v6" />
                  </svg>
                </button>
              </div>
            </template>
          </li>
        </ul>

        <p v-if="!cantones.length" class="catalogo-vacio">Aún no hay cantones.</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.catalogos-panel {
  margin-bottom: var(--spacing-8);
}

.catalogos-header {
  margin-bottom: var(--spacing-4);
}

.catalogos-title {
  font-family: var(--font-headline);
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.catalogos-subtitle {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: var(--spacing-1) 0 0;
}

.catalogos-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-4);
}

@media (max-width: 900px) {
  .catalogos-grid {
    grid-template-columns: 1fr;
  }
}

.catalogo-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
  padding: var(--spacing-5);
}

.catalogo-card-title {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-4);
}

.catalogo-alta {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-4);
}

.catalogo-alta input {
  padding: var(--spacing-2) var(--spacing-3);
  font-size: var(--font-size-sm);
  border-radius: var(--radius-md);
}

.catalogo-edicion-categoria {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  flex: 1;
}

.catalogo-edicion-categoria input {
  flex: 1;
  min-width: 0;
}

.btn-alta {
  flex-shrink: 0;
  padding: var(--spacing-2) var(--spacing-4);
  background-color: var(--color-primary-600);
  color: var(--text-inverse);
  border-radius: var(--radius-full);
  font-weight: 600;
  font-size: var(--font-size-sm);
}

.btn-alta:hover {
  background-color: var(--color-primary-700);
}

.catalogo-lista {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  max-height: 360px;
  overflow-y: auto;

  /* Scrollbar delgado y discreto; sin flechas nativas en los extremos. */
  scrollbar-width: thin;
  scrollbar-color: var(--color-neutral-300) transparent;
}

.catalogo-lista::-webkit-scrollbar {
  width: 6px;
}

.catalogo-lista::-webkit-scrollbar-track {
  background: transparent;
}

.catalogo-lista::-webkit-scrollbar-thumb {
  background-color: var(--color-neutral-300);
  border-radius: var(--radius-full);
}

.catalogo-lista::-webkit-scrollbar-thumb:hover {
  background-color: var(--color-neutral-400);
}

.catalogo-lista::-webkit-scrollbar-button {
  display: none;
  height: 0;
  width: 0;
}

.catalogo-fila {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-3);
  padding: var(--spacing-2) var(--spacing-3);
  border-bottom: 1px solid var(--color-neutral-200);
}

.catalogo-fila:last-child {
  border-bottom: none;
}

.catalogo-fila input {
  padding: var(--spacing-1) var(--spacing-2);
  font-size: var(--font-size-sm);
  border-radius: var(--radius-md);
}

.catalogo-nombre {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  font-weight: 500;
}

.catalogo-icono {
  flex-shrink: 0;
  line-height: 1;
}

.catalogo-acciones {
  display: inline-flex;
  gap: var(--spacing-2);
  flex-shrink: 0;
}

.btn-action {
  padding: 4px 10px;
  font-size: var(--font-size-xs);
  font-weight: 500;
  border-radius: var(--radius-md);
}

.btn-edit {
  background-color: var(--color-primary-100);
  color: var(--color-primary-700);
}

.btn-edit:hover {
  background-color: var(--color-primary-200);
}

.btn-cancel {
  background-color: var(--color-neutral-100);
  color: var(--color-neutral-600);
}

.btn-cancel:hover {
  background-color: var(--color-neutral-200);
}

/* Íconos de editar/eliminar: sin fondo en reposo, solo aparece al hover. */
.btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: var(--radius-full);
  color: var(--text-muted);
  background-color: transparent;
  transition: background-color var(--transition-fast), color var(--transition-fast);
}

.btn-icon svg {
  width: 15px;
  height: 15px;
}

.btn-icon-edit:hover {
  background-color: var(--color-primary-50);
  color: var(--color-primary-600);
}

.btn-icon-delete:hover {
  background-color: #fee2e2;
  color: #991b1b;
}

.catalogo-vacio {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}
</style>
