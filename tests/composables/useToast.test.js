import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useToast } from '@/composables/useToast'

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useToast().toasts.value = []
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('agrega un toast de éxito', () => {
    const { toasts, mostrarExito } = useToast()
    mostrarExito('Guardado')
    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0]).toMatchObject({ tipo: 'exito', mensaje: 'Guardado' })
  })

  it('agrega un toast de error', () => {
    const { toasts, mostrarError } = useToast()
    mostrarError('Falló')
    expect(toasts.value[0]).toMatchObject({ tipo: 'error', mensaje: 'Falló' })
  })

  it('el estado es compartido entre instancias', () => {
    const a = useToast()
    const b = useToast()
    a.mostrarExito('uno')
    expect(b.toasts.value).toHaveLength(1)
  })

  it('se autodescarta a los 4 segundos (éxito)', () => {
    const { toasts, mostrarExito } = useToast()
    mostrarExito('temporal')
    vi.advanceTimersByTime(3999)
    expect(toasts.value).toHaveLength(1)
    vi.advanceTimersByTime(1)
    expect(toasts.value).toHaveLength(0)
  })

  it('los errores duran 6 segundos', () => {
    const { toasts, mostrarError } = useToast()
    mostrarError('error largo')
    vi.advanceTimersByTime(4000)
    expect(toasts.value).toHaveLength(1)
    vi.advanceTimersByTime(2000)
    expect(toasts.value).toHaveLength(0)
  })

  it('cerrar(id) lo quita antes de tiempo', () => {
    const { toasts, mostrarExito, cerrar } = useToast()
    const id = mostrarExito('cerrable')
    cerrar(id)
    expect(toasts.value).toHaveLength(0)
  })
})
