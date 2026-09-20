import { describe, it, expect } from 'vitest'
import { computed, ref } from 'vue'
import { usePaginacion } from '@/composables/usePaginacion'

/** Lista [1..n] para comprobar los cortes con comodidad. */
function lista(n) {
  return Array.from({ length: n }, (_, i) => i + 1)
}

describe('usePaginacion', () => {
  it('pageItems devuelve solo los elementos de la página actual', () => {
    const items = ref(lista(25))
    const { pageItems, irAPagina } = usePaginacion(items, 10)

    expect(pageItems.value).toEqual(lista(10))

    irAPagina(2)
    expect(pageItems.value).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20])

    irAPagina(3)
    expect(pageItems.value).toEqual([21, 22, 23, 24, 25])
  })

  it('totalPages redondea hacia arriba', () => {
    expect(usePaginacion(ref(lista(25)), 10).totalPages.value).toBe(3)
    expect(usePaginacion(ref(lista(20)), 10).totalPages.value).toBe(2)
    expect(usePaginacion(ref(lista(1)), 10).totalPages.value).toBe(1)
  })

  it('siguiente y anterior se mueven una página', () => {
    const { page, siguiente, anterior } = usePaginacion(ref(lista(25)), 10)

    expect(page.value).toBe(1)
    siguiente()
    expect(page.value).toBe(2)
    anterior()
    expect(page.value).toBe(1)
  })

  it('no pasa del último ni antes del primero', () => {
    const { page, siguiente, anterior } = usePaginacion(ref(lista(25)), 10)

    siguiente()
    siguiente()
    siguiente()
    siguiente()
    expect(page.value).toBe(3)

    anterior()
    anterior()
    anterior()
    anterior()
    expect(page.value).toBe(1)
  })

  it('irAPagina ignora valores fuera de rango o no numéricos', () => {
    const { page, irAPagina } = usePaginacion(ref(lista(25)), 10)

    irAPagina(99)
    expect(page.value).toBe(3)

    irAPagina(0)
    expect(page.value).toBe(1)

    irAPagina('abc')
    expect(page.value).toBe(1)
  })

  it('con la lista vacía hay una página y ningún elemento', () => {
    const { page, totalPages, pageItems } = usePaginacion(ref([]), 10)

    expect(page.value).toBe(1)
    expect(totalPages.value).toBe(1)
    expect(pageItems.value).toEqual([])
  })

  it('resetear vuelve a la primera página', () => {
    const { page, irAPagina, resetear } = usePaginacion(ref(lista(25)), 10)

    irAPagina(3)
    expect(page.value).toBe(3)

    resetear()
    expect(page.value).toBe(1)
  })

  it('si la lista se encoge, la página se ajusta sin quedar vacía', () => {
    const items = ref(lista(25))
    const { page, pageItems, irAPagina } = usePaginacion(items, 10)

    irAPagina(3)
    expect(page.value).toBe(3)

    // Un filtro deja solo 12 elementos: ya no existe la página 3
    items.value = lista(12)
    expect(page.value).toBe(2)
    expect(pageItems.value).toEqual([11, 12])
  })

  it('funciona con un computed como origen (caso de ProducerTable)', () => {
    const origen = ref(lista(25))
    const filtrados = computed(() => origen.value.filter((n) => n % 2 === 0))
    const { totalPages, pageItems } = usePaginacion(filtrados, 5)

    expect(totalPages.value).toBe(3)
    expect(pageItems.value).toEqual([2, 4, 6, 8, 10])
  })
})
