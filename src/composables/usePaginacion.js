/**
 * Composable de paginación en el cliente.
 *
 * No consulta nada: recibe un ref con la lista COMPLETA (la que ya trajo
 * el composable de datos) y solo corta lo que se muestra. Así la búsqueda
 * local de la tabla admin y los KPIs del panel siguen operando sobre el
 * arreglo entero.
 */
import { computed, ref } from 'vue'

/**
 * @param {import('vue').Ref<Array>} itemsRef - Lista completa (ref o computed)
 * @param {number} [pageSize] - Elementos por página
 * @returns {{
 *   page: import('vue').ComputedRef<number>,
 *   totalPages: import('vue').ComputedRef<number>,
 *   pageItems: import('vue').ComputedRef<Array>,
 *   irAPagina: (n: number) => void,
 *   siguiente: () => void,
 *   anterior: () => void,
 *   resetear: () => void,
 * }}
 */
export function usePaginacion(itemsRef, pageSize = 12) {
  const tamano = Math.max(1, Math.trunc(pageSize))

  // Página pedida por el usuario. `page` la acota a lo que existe hoy, así
  // que si la lista se encoge no hace falta ningún watch para corregirla.
  const paginaPedida = ref(1)

  const totalPages = computed(() => {
    const total = itemsRef.value?.length ?? 0
    return Math.max(1, Math.ceil(total / tamano))
  })

  const page = computed(() => Math.min(paginaPedida.value, totalPages.value))

  const pageItems = computed(() => {
    const inicio = (page.value - 1) * tamano
    return (itemsRef.value ?? []).slice(inicio, inicio + tamano)
  })

  /** Va a una página, recortando al rango válido. Ignora valores no numéricos. */
  function irAPagina(n) {
    const numero = Math.trunc(Number(n))
    if (!Number.isFinite(numero)) return
    paginaPedida.value = Math.min(Math.max(1, numero), totalPages.value)
  }

  function siguiente() {
    irAPagina(page.value + 1)
  }

  function anterior() {
    irAPagina(page.value - 1)
  }

  /** Vuelve a la primera página (al cambiar filtros o búsqueda). */
  function resetear() {
    paginaPedida.value = 1
  }

  return { page, totalPages, pageItems, irAPagina, siguiente, anterior, resetear }
}
