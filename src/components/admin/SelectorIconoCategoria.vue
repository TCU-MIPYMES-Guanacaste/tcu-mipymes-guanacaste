<!--
  SelectorIconoCategoria.vue - Elegir el emoji de una categoría.

  Combo compacto: el emoji actual a la izquierda (click para editarlo a
  mano, ej. pegando uno con Win+. / Cmd+Ctrl+Espacio) y una flecha a la
  derecha que despliega una lista rápida de emojis comunes de alimentos.
  Ambos caminos escriben sobre el mismo v-model.
-->
<script setup>
import { nextTick, ref } from 'vue'

const modelValue = defineModel({ type: String, default: '' })

const OPCIONES = [
  { emoji: '🥤', etiqueta: 'Bebidas' },
  { emoji: '🥩', etiqueta: 'Carnes y embutidos' },
  { emoji: '🥦', etiqueta: 'Frutas y verduras' },
  { emoji: '🌾', etiqueta: 'Granos y cereales' },
  { emoji: '🧀', etiqueta: 'Lácteos' },
  { emoji: '🍞', etiqueta: 'Panadería y repostería' },
  { emoji: '🍯', etiqueta: 'Miel y derivados' },
  { emoji: '🐟', etiqueta: 'Pescados y mariscos' },
  { emoji: '🌶️', etiqueta: 'Condimentos y especias' },
  { emoji: '☕', etiqueta: 'Café y cacao' },
  { emoji: '🍫', etiqueta: 'Dulces y snacks' },
  { emoji: '🥫', etiqueta: 'Conservas y procesados' },
  { emoji: '🌿', etiqueta: 'Orgánicos / Hierbas' },
  { emoji: '📦', etiqueta: 'Varios / Alimentos preparados' },
]

// Reconoce caracteres emoji (con modificadores/secuencias ZWJ y variación).
// Es un filtro de mejor esfuerzo: no existe una validación 100% infalible.
const PATRON_EMOJI = /\p{Extended_Pictographic}(‍\p{Extended_Pictographic})*️?/gu

const abierto = ref(false)
const editando = ref(false)
const contenedorRef = ref(null)
const inputRef = ref(null)

function alternarLista() {
  editando.value = false
  abierto.value = !abierto.value
}

function elegir(emoji) {
  modelValue.value = emoji
  abierto.value = false
}

async function activarEdicion() {
  abierto.value = false
  editando.value = true
  await nextTick()
  inputRef.value?.focus()
  inputRef.value?.select()
}

function terminarEdicion() {
  editando.value = false
}

/** Deja solo lo que parece emoji en lo que el usuario tipeó o pegó. */
function filtrarEmoji(evento) {
  const coincidencias = evento.target.value.match(PATRON_EMOJI)
  modelValue.value = coincidencias ? coincidencias.join('').slice(0, 4) : ''
}

/**
 * Cierra el desplegable/la edición si el foco sale de todo el combo.
 *
 * No se puede confiar en `event.relatedTarget`: al pasar de botón a
 * input (activarEdicion), Vue destruye el botón enfocado antes de que
 * el input nuevo reciba el foco, así que el navegador dispara este
 * evento con `relatedTarget: null` en pleno cambio legítimo. Por eso
 * se revisa `document.activeElement` en el siguiente frame, cuando el
 * foco ya se asentó donde tenga que asentarse.
 */
function alPerderFoco() {
  requestAnimationFrame(() => {
    if (!contenedorRef.value?.contains(document.activeElement)) {
      abierto.value = false
      editando.value = false
    }
  })
}
</script>

<template>
  <div ref="contenedorRef" class="icono-combo" @focusout="alPerderFoco">
    <input
      v-if="editando"
      ref="inputRef"
      type="text"
      class="icono-combo-input"
      maxlength="4"
      :value="modelValue"
      aria-label="Emoji personalizado"
      @input="filtrarEmoji"
      @keydown.enter.prevent="terminarEdicion"
    />
    <button
      v-else
      type="button"
      class="icono-combo-emoji"
      title="Escribir un emoji propio"
      aria-label="Editar emoji"
      @click="activarEdicion"
    >
      {{ modelValue || '🏷️' }}
    </button>

    <button
      type="button"
      class="icono-combo-flecha"
      aria-label="Elegir de la lista"
      aria-haspopup="listbox"
      :aria-expanded="abierto"
      @click="alternarLista"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M6 9l6 6 6-6" />
      </svg>
    </button>

    <ul v-if="abierto" class="icono-combo-lista" role="listbox">
      <li v-for="op in OPCIONES" :key="op.emoji">
        <button type="button" class="icono-combo-opcion" @click="elegir(op.emoji)">
          {{ op.emoji }} {{ op.etiqueta }}
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.icono-combo {
  position: relative;
  display: inline-flex;
  align-items: stretch;
  flex-shrink: 0;
  border: 1px solid var(--color-neutral-300);
  border-radius: var(--radius-md);
  background: var(--bg-surface);
}

.icono-combo-emoji,
.icono-combo-input {
  width: 40px;
  border: none;
  background: transparent;
  text-align: center;
  font-size: var(--font-size-base);
  padding: var(--spacing-2) 0;
}

.icono-combo-emoji {
  cursor: pointer;
}

.icono-combo-emoji:hover {
  background-color: var(--bg-muted);
}

.icono-combo-input {
  outline: none;
}

.icono-combo-flecha {
  width: 22px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-left: 1px solid var(--color-neutral-200);
  background: transparent;
  color: var(--text-muted);
}

.icono-combo-flecha:hover {
  background-color: var(--bg-muted);
  color: var(--text-primary);
}

.icono-combo-flecha svg {
  width: 12px;
  height: 12px;
}

.icono-combo-lista {
  position: absolute;
  top: calc(100% + var(--spacing-1));
  left: 0;
  z-index: 20;
  min-width: 220px;
  max-height: 260px;
  overflow-y: auto;
  margin: 0;
  padding: var(--spacing-1);
  list-style: none;
  background: var(--bg-surface);
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
}

.icono-combo-opcion {
  display: block;
  width: 100%;
  text-align: left;
  padding: var(--spacing-2) var(--spacing-3);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  background: transparent;
}

.icono-combo-opcion:hover {
  background-color: var(--color-primary-50);
  color: var(--color-primary-700);
}
</style>
