import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useEventNotificationViewModel } from '@/viewmodels/useEventNotificationViewModel'

describe('useEventNotificationViewModel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('expõe o estado inicial esperado', () => {
    const { result } = renderHook(() => useEventNotificationViewModel())

    expect(result.current.loading).toBe(false)
    expect(result.current.upcomingEvents).toEqual([])
    expect(result.current.notifications).toEqual([])
    expect(result.current.preferences).toEqual({})
  })

  it('envia notificações e retorna um id gerado', async () => {
    const { result } = renderHook(() => useEventNotificationViewModel())

    let response: Awaited<ReturnType<typeof result.current.sendNotification>> | undefined
    await act(async () => {
      response = await result.current.sendNotification('client-1', 'Seu passeio e amanha', 'email')
    })

    expect(response).toEqual(expect.objectContaining({ success: true, notificationId: expect.stringContaining('notif-') }))
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
  })

  it('agenda notificações em lote', async () => {
    const { result } = renderHook(() => useEventNotificationViewModel())

    let response: Awaited<ReturnType<typeof result.current.scheduleNotifications>> | undefined
    await act(async () => {
      response = await result.current.scheduleNotifications([{ id: 'event-1' }, { id: 'event-2' }])
    })

    expect(response).toEqual({ success: true, scheduled: 2 })
    expect(result.current.loading).toBe(false)
  })

  it('atualiza preferências e faz refresh sem deixar loading preso', async () => {
    const { result } = renderHook(() => useEventNotificationViewModel())

    await act(async () => {
      await result.current.updatePreferences('client-1', { email: true })
      await result.current.refresh()
    })

    expect(result.current.loading).toBe(false)
  })
})
