import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useToastState } from '../../../src/viewmodels/useToastState';

describe('useToastState', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('expoe o estado inicial esperado', () => {
    const { result } = renderHook(() => useToastState());

    expect(result.current.toasts).toEqual([]);
    expect(result.current.activeToasts.size).toBe(0);
    expect(result.current.toastQueue).toEqual([]);
    expect(result.current.maxToasts).toBe(5);
    expect(result.current.defaultDuration).toBe(5000);
  });

  it('adiciona toast e remove automaticamente ao fim da duracao', async () => {
    const { result } = renderHook(() => useToastState());

    let toastId = '';
    act(() => {
      toastId = result.current.actions.showToast('Salvo com sucesso', 'success', { duration: 1000 });
    });

    expect(toastId).toBe('toast-1');
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.helpers.isToastActive(toastId)).toBe(true);

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.toasts).toHaveLength(0);
    expect(result.current.helpers.isToastActive(toastId)).toBe(false);
  });

  it('mantem toast persistente ate remocao manual', async () => {
    const { result } = renderHook(() => useToastState());

    let toastId = '';
    act(() => {
      toastId = result.current.actions.showToast('Importante', 'warning', { persistent: true });
    });

    await act(async () => {
      vi.advanceTimersByTime(10000);
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.helpers.isToastActive(toastId)).toBe(true);

    act(() => {
      result.current.actions.hideToast(toastId);
    });

    expect(result.current.toasts).toHaveLength(0);
    expect(result.current.helpers.isToastActive(toastId)).toBe(false);
  });

  it('enfileira novos toasts quando atinge o limite e promove a fila ao esconder um item', async () => {
    const { result } = renderHook(() => useToastState());

    const visibleIds: string[] = [];
    act(() => {
      for (let index = 0; index < 5; index += 1) {
        visibleIds.push(result.current.actions.showToast(`Toast ${index + 1}`, 'info', { persistent: true }));
      }
    });

    expect(result.current.toasts).toHaveLength(5);
    expect(result.current.toastQueue).toHaveLength(0);

    let queuedId = '';
    act(() => {
      queuedId = result.current.actions.showToast('Toast em fila', 'error', { persistent: true });
    });

    expect(queuedId).toBe('toast-6');
    expect(result.current.toasts).toHaveLength(5);
    expect(result.current.toastQueue).toHaveLength(1);
    expect(result.current.toastQueue[0]?.id).toBe('toast-6');

    act(() => {
      result.current.actions.hideToast(visibleIds[0]);
    });

    expect(result.current.toasts).toHaveLength(5);
    expect(result.current.toastQueue).toHaveLength(0);
    expect(result.current.helpers.isToastActive('toast-6')).toBe(true);
  });

  it('atualiza toast existente e permite remover a acao associada', () => {
    const { result } = renderHook(() => useToastState());
    const onClick = vi.fn();

    let toastId = '';
    act(() => {
      toastId = result.current.actions.showToast('Conexao perdida', 'error', {
        persistent: true,
        action: { onClick }
      });
    });

    act(() => {
      result.current.actions.updateToast(toastId, { message: 'Conexao restaurada', type: 'success' });
    });

    expect(result.current.toasts[0]?.message).toBe('Conexao restaurada');
    expect(result.current.toasts[0]?.type).toBe('success');

    act(() => {
      expect(result.current.actions.executeToastAction(toastId)).toBe(true);
    });
    expect(onClick).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.actions.removeToastAction(toastId);
    });

    expect(result.current.toasts[0]?.action).toBeNull();
  });

  it('limpa toasts por tipo e limpa tudo quando solicitado', () => {
    const { result } = renderHook(() => useToastState());

    act(() => {
      result.current.actions.showToast('Info', 'info', { persistent: true });
      result.current.actions.showToast('Erro', 'error', { persistent: true });
      result.current.actions.showToast('Sucesso', 'success', { persistent: true });
    });

    expect(result.current.toasts).toHaveLength(3);

    act(() => {
      result.current.actions.clearByType('info');
    });

    expect(result.current.toasts.map((toast) => toast.type)).toEqual(['error', 'success']);

    act(() => {
      result.current.actions.clearAll();
    });

    expect(result.current.toasts).toEqual([]);
    expect(result.current.toastQueue).toEqual([]);
    expect(result.current.activeToasts.size).toBe(0);
  });
});
