import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useDialogState } from './useDialogState';

describe('useDialogState', () => {
    it('opens with no payload and closes again', () => {
        const { result } = renderHook(() => useDialogState());
        expect(result.current.open).toBe(false);
        expect(result.current.value).toBeNull();

        act(() => result.current.show());
        expect(result.current.open).toBe(true);
        expect(result.current.value).toBe(true);

        act(() => result.current.close());
        expect(result.current.open).toBe(false);
        expect(result.current.value).toBeNull();
    });

    it('keeps the payload of a keyed dialog while open', () => {
        const { result } = renderHook(() => useDialogState<string>());
        act(() => result.current.show('oracle-1'));
        expect(result.current.value).toBe('oracle-1');
        act(() => result.current.show('oracle-2'));
        expect(result.current.value).toBe('oracle-2');
    });

    it('still opens for a falsy payload', () => {
        const zero = renderHook(() => useDialogState<number>());
        act(() => zero.result.current.show(0));
        expect(zero.result.current.open).toBe(true);
        expect(zero.result.current.value).toBe(0);

        const empty = renderHook(() => useDialogState<string>());
        act(() => empty.result.current.show(''));
        expect(empty.result.current.open).toBe(true);
        expect(empty.result.current.value).toBe('');
    });

    it('keeps show and close stable across renders', () => {
        const { result, rerender } = renderHook(() => useDialogState());
        const { show, close } = result.current;
        rerender();
        expect(result.current.show).toBe(show);
        expect(result.current.close).toBe(close);
    });
});
