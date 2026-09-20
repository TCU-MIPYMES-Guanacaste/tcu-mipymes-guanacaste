<!--
  SelectorIconoCategoria.vue - Elegir el emoji de una categoría.

  Combina una lista rápida de emojis comunes de alimentos con un campo
  de texto libre (para pegar un emoji propio, ej. Win+. / Cmd+Ctrl+Espacio).
  Ambos escriben sobre el mismo v-model: elegir de la lista solo rellena
  el campo de texto, que es el valor real que se envía al guardar.
-->
<script setup>
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

function elegirDeLaLista(evento) {
  const emoji = evento.target.value
  if (emoji) modelValue.value = emoji
  evento.target.value = ''
}
</script>

<template>
  <div class="selector-icono">
    <select class="selector-icono-lista" aria-label="Elegir emoji de la lista" @change="elegirDeLaLista">
      <option value="">🔽 Elegir…</option>
      <option v-for="op in OPCIONES" :key="op.emoji" :value="op.emoji">
        {{ op.emoji }} {{ op.etiqueta }}
      </option>
    </select>
    <input
      v-model="modelValue"
      type="text"
      class="selector-icono-texto"
      maxlength="4"
      placeholder="🏷️"
      aria-label="Emoji personalizado"
    />
  </div>
</template>

<style scoped>
.selector-icono {
  display: flex;
  gap: var(--spacing-2);
  align-items: center;
}

.selector-icono-lista {
  flex: 1;
  min-width: 0;
  padding: var(--spacing-2) var(--spacing-3);
  font-size: var(--font-size-sm);
  border-radius: var(--radius-md);
}

.selector-icono-texto {
  width: 56px;
  flex-shrink: 0;
  text-align: center;
  padding: var(--spacing-2) var(--spacing-3);
  font-size: var(--font-size-sm);
  border-radius: var(--radius-md);
}
</style>
