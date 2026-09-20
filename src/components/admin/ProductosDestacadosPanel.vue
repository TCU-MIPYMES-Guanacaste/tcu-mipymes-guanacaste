<!--
  ProductosDestacadosPanel.vue - Productos destacados de un productor (admin).

  Lista los productos con miniatura, precio y disponibilidad, y despliega
  ProductoDestacadoForm para agregar o editar. Solo se usa en modo edición
  de un productor ya guardado (necesita su id).

  Props:
  - productorId (String): id del productor dueño de los productos
-->
<script setup>
import { onMounted, ref } from 'vue'
import { useProductosDestacados } from '@/composables/useProductosDestacados'
import { useToast } from '@/composables/useToast'
import { getPublicImageUrl } from '@/lib/supabase'
import { formatearPrecio } from '@/utils/precio'
import ProductoDestacadoForm from './ProductoDestacadoForm.vue'

const props = defineProps({
  productorId: {
    type: String,
    required: true,
  },
})

const {
  productos,
  loading,
  error,
  fetchProductos,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
} = useProductosDestacados()
const { mostrarExito, mostrarError } = useToast()

// null = formulario cerrado; { } = alta; { id, ... } = edición
const productoEnEdicion = ref(null)
const formularioAbierto = ref(false)

onMounted(() => {
  fetchProductos(props.productorId)
})

function abrirAlta() {
  productoEnEdicion.value = null
  formularioAbierto.value = true
}

function abrirEdicion(producto) {
  productoEnEdicion.value = producto
  formularioAbierto.value = true
}

function cerrarFormulario() {
  formularioAbierto.value = false
  productoEnEdicion.value = null
}

async function handleGuardar(datos) {
  const enEdicion = productoEnEdicion.value
  const resultado = enEdicion
    ? await actualizarProducto(enEdicion.id, datos)
    : await crearProducto(props.productorId, datos)

  if (!resultado) {
    mostrarError(error.value || 'No se pudo guardar el producto.')
    return
  }

  mostrarExito(enEdicion ? 'Producto actualizado.' : 'Producto agregado.')
  cerrarFormulario()
  await fetchProductos(props.productorId)
}

async function handleEliminar(producto) {
  const confirmado = window.confirm(`¿Eliminar el producto "${producto.nombre}"?`)
  if (!confirmado) return

  const ok = await eliminarProducto(producto.id)
  if (ok) {
    mostrarExito('Producto eliminado.')
  } else {
    mostrarError(error.value || 'No se pudo eliminar el producto.')
  }
}
</script>

<template>
  <section class="productos-panel">
    <header class="productos-header">
      <div>
        <h3 class="productos-title">Productos destacados</h3>
        <p class="productos-subtitle">
          Aparecen en la página pública del productor. Los no disponibles se ocultan.
        </p>
      </div>
      <button
        v-if="!formularioAbierto"
        type="button"
        class="btn-agregar"
        @click="abrirAlta"
      >
        ➕ Agregar producto
      </button>
    </header>

    <ProductoDestacadoForm
      v-if="formularioAbierto"
      :producto="productoEnEdicion"
      :loading="loading"
      @guardar="handleGuardar"
      @cancelar="cerrarFormulario"
    />

    <p v-if="error && productos.length === 0" class="productos-error">⚠️ {{ error }}</p>

    <ul v-if="productos.length" class="productos-lista">
      <li v-for="p in productos" :key="p.id" class="producto-fila">
        <div class="producto-miniatura">
          <img v-if="p.foto_url" :src="getPublicImageUrl(p.foto_url)" :alt="p.nombre" />
          <span v-else>🧺</span>
        </div>

        <div class="producto-datos">
          <span class="producto-nombre">{{ p.nombre }}</span>
          <span v-if="formatearPrecio(p.precio_referencia, p.unidad)" class="producto-precio">
            {{ formatearPrecio(p.precio_referencia, p.unidad) }}
          </span>
        </div>

        <span :class="['producto-estado', p.disponible ? 'estado-si' : 'estado-no']">
          {{ p.disponible ? 'Disponible' : 'No disponible' }}
        </span>

        <div class="producto-acciones">
          <button type="button" class="btn-action btn-edit" @click="abrirEdicion(p)">
            ✏️ Editar
          </button>
          <button type="button" class="btn-action btn-delete" @click="handleEliminar(p)">
            🗑️ Eliminar
          </button>
        </div>
      </li>
    </ul>

    <p v-else-if="!loading && !error" class="productos-vacio">
      Este productor aún no tiene productos destacados.
    </p>
  </section>
</template>

<style scoped>
.productos-panel {
  background-color: var(--bg-surface);
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  padding: var(--spacing-6);
}

.productos-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-5);
}

.productos-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.productos-subtitle {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  margin: var(--spacing-1) 0 0;
}

.btn-agregar {
  flex-shrink: 0;
  padding: var(--spacing-2) var(--spacing-5);
  background-color: var(--color-primary-600);
  color: var(--text-inverse);
  border-radius: var(--radius-full);
  font-weight: 600;
  font-size: var(--font-size-sm);
}

.btn-agregar:hover {
  background-color: var(--color-primary-700);
}

.productos-error {
  color: var(--color-error);
  font-size: var(--font-size-sm);
  font-weight: 500;
}

.productos-lista {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.producto-fila {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
  padding: var(--spacing-3);
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-md);
  background-color: var(--bg-primary);
}

.producto-miniatura {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border-radius: var(--radius-md);
  overflow: hidden;
  background-color: var(--bg-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.producto-miniatura img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.producto-datos {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.producto-nombre {
  font-weight: 600;
  font-size: var(--font-size-sm);
  color: var(--text-primary);
}

.producto-precio {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.producto-estado {
  font-size: var(--font-size-xs);
  font-weight: 600;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  white-space: nowrap;
}

/* Mismos colores de estado que la tabla de productores. */
.estado-si {
  background-color: var(--color-warm-100);
  color: var(--color-warm-800);
}

.estado-no {
  background-color: var(--color-neutral-200);
  color: var(--color-neutral-600);
}

.producto-acciones {
  display: inline-flex;
  gap: var(--spacing-2);
}

.btn-action {
  padding: 6px 12px;
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

.btn-delete {
  background-color: #fee2e2;
  color: #991b1b;
}

.btn-delete:hover {
  background-color: #fca5a5;
}

.productos-vacio {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

@media (max-width: 640px) {
  .producto-fila {
    flex-wrap: wrap;
  }

  .producto-acciones {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
