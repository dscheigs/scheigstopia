import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useUrlDialogState } from '@/lib/useUrlDialogState';

beforeEach(() => window.history.replaceState(null, '', '/'));
afterEach(() => window.history.replaceState(null, '', '/'));

const back = () =>
    act(async () => {
        window.history.back();
        await new Promise((resolve) => setTimeout(resolve, 20));
    });

describe('useUrlDialogState', () => {
    it('opens from the address on load', () => {
        window.history.replaceState(null, '', '/?card=abc');
        const { result } = renderHook(() => useUrlDialogState('card'));
        expect(result.current.open).toBe(true);
        expect(result.current.value).toBe('abc');
    });

    it('puts the id in the address when shown', () => {
        const { result } = renderHook(() => useUrlDialogState('card'));
        act(() => result.current.show('abc'));
        expect(result.current.value).toBe('abc');
        expect(window.location.search).toBe('?card=abc');
    });

    it('closes on Back', async () => {
        const { result } = renderHook(() => useUrlDialogState('card'));
        act(() => result.current.show('abc'));
        await back();
        expect(result.current.open).toBe(false);
        expect(window.location.search).toBe('');
    });

    it('goes back a step when closed after being shown', async () => {
        const { result } = renderHook(() => useUrlDialogState('card'));
        act(() => result.current.show('abc'));
        expect(window.location.search).toBe('?card=abc');
        act(() => result.current.close());
        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 20));
        });
        expect(result.current.open).toBe(false);
        expect(window.location.search).toBe('');
    });

    it('drops the parameter without leaving when opened from a link', () => {
        window.history.replaceState(null, '', '/?card=abc');
        const { result } = renderHook(() => useUrlDialogState('card'));
        const length = window.history.length;
        act(() => result.current.close());
        expect(result.current.open).toBe(false);
        expect(window.location.search).toBe('');
        expect(window.history.length).toBe(length);
    });
});
