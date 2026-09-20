<!--
  SearchBar.vue - Componente de barra de búsqueda principal.

  Permite al usuario buscar productores por nombre de negocio.
  Emite el texto de búsqueda al componente padre para filtrar resultados.

  Emits:
  - search (String): Texto de búsqueda ingresado por el usuario
-->
<script setup>
import { ref } from 'vue'

const emit = defineEmits(['search'])

// Texto de búsqueda local
const searchText = ref('')

/** Emitir el evento de búsqueda con el texto actual */
function handleSearch() {
  emit('search', searchText.value.trim())
}

/** Limpiar el campo de búsqueda y emitir búsqueda vacía */
function clearSearch() {
  searchText.value = ''
  emit('search', '')
}
</script>

<template>
  <div class="search-bar">
    <div class="search-input-wrapper">
      <span class="search-icon">🔍</span>
      <input
        v-model="searchText"
        type="text"
        class="search-input"
        placeholder="Buscar por nombre o descripción..."
        aria-label="Buscar productores"
        @keyup.enter="handleSearch"
      />
      <button
        v-if="searchText"
        class="search-clear"
        aria-label="Limpiar búsqueda"
        @click="clearSearch"
      >
        ✕
      </button>
    </div>
    <button class="search-button" @click="handleSearch">
      Buscar
    </button>
  </div>
</template>

<style scoped>
.search-bar {
  display: flex;
  gap: 0.75rem;
  width: 100%;
  max-width: 600px;
}

.search-input-wrapper {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  font-size: 1rem;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.75rem 2.5rem 0.75rem 2.5rem;
  border: 1px solid var(--color-neutral-300);
  border-radius: var(--radius-full);
  background-color: var(--bg-surface);
  color: var(--text-primary);
  font-size: 1rem;
  font-family: inherit;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary-600);
  box-shadow: 0 0 0 3px rgba(140, 59, 38, 0.15);
}

.search-clear {
  position: absolute;
  right: 0.75rem;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  font-size: 1rem;
  padding: 0.25rem;
}

.search-button {
  padding: 0.75rem 1.5rem;
  background-color: var(--color-primary-600);
  color: var(--text-inverse);
  border: none;
  border-radius: var(--radius-full);
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.search-button:hover {
  background-color: var(--color-primary-700);
}
</style>
