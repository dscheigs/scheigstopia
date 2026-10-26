import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    QUANTITY_SETTLE_MS,
    useDebouncedQuantity,
} from './useDebouncedQuantity';

/** A save the test settles by hand, like a slow network. */
function deferred() {
    let resolve!: () => void;
    let reject!: (error: Error) => void;
    const promise = new Promise<void>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

const settle = () => act(() => vi.advanceTimersByTimeAsync(QUANTITY_SETTLE_MS));

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('useDebouncedQuantity', () => {
    it('shows each click at once and saves once, with the final count', async () => {
        const save = vi.fn().mockResolvedValue(undefined);
        const { result } = renderHook(() =>
            useDebouncedQuantity({ saved: 1, save })
        );

        for (const next of [2, 3, 4, 5]) {
            act(() => result.current.setQuantity(next));
            expect(result.current.quantity).toBe(next);
            await act(() =>
                vi.advanceTimersByTimeAsync(QUANTITY_SETTLE_MS - 1)
            );
        }
        expect(save).not.toHaveBeenCalled();
        expect(result.current.pending).toBe(true);

        await settle();
        expect(save).toHaveBeenCalledTimes(1);
        expect(save).toHaveBeenCalledWith(5);
    });

    it('stays pending until the save lands, then follows the saved count', async () => {
        const request = deferred();
        const save = vi.fn().mockReturnValue(request.promise);
        const { result, rerender } = renderHook(
            ({ saved }) => useDebouncedQuantity({ saved, save }),
            { initialProps: { saved: 1 } }
        );
        act(() => result.current.setQuantity(2));
        await settle();
        expect(result.current.pending).toBe(true);
        expect(result.current.quantity).toBe(2);

        await act(async () => request.resolve());
        rerender({ saved: 2 });
        expect(result.current.pending).toBe(false);
        expect(result.current.quantity).toBe(2);
        expect(result.current.error).toBeNull();
    });

    it('saves a change made during a save after it settles, and never snaps back', async () => {
        const first = deferred();
        const second = deferred();
        const save = vi
            .fn()
            .mockReturnValueOnce(first.promise)
            .mockReturnValueOnce(second.promise);
        const { result, rerender } = renderHook(
            ({ saved }) => useDebouncedQuantity({ saved, save }),
            { initialProps: { saved: 1 } }
        );
        act(() => result.current.setQuantity(2));
        await settle();
        expect(save).toHaveBeenCalledTimes(1);

        // The user keeps clicking while the first save is out.
        act(() => result.current.setQuantity(3));
        await settle();
        expect(save).toHaveBeenCalledTimes(1);
        expect(result.current.quantity).toBe(3);

        // The first response arrives with the older count: the display keeps
        // the newer one, and the newer one goes out.
        await act(async () => first.resolve());
        rerender({ saved: 2 });
        expect(result.current.quantity).toBe(3);
        expect(save).toHaveBeenCalledTimes(2);
        expect(save).toHaveBeenLastCalledWith(3);
        expect(result.current.pending).toBe(true);

        await act(async () => second.resolve());
        rerender({ saved: 3 });
        expect(result.current.pending).toBe(false);
        expect(result.current.quantity).toBe(3);
    });

    it('rolls back to the last saved count and reports a failed save', async () => {
        const save = vi.fn().mockRejectedValue(new Error('Server said no.'));
        const { result } = renderHook(() =>
            useDebouncedQuantity({ saved: 2, save })
        );
        act(() => result.current.setQuantity(7));
        expect(result.current.quantity).toBe(7);

        await settle();
        expect(result.current.quantity).toBe(2);
        expect(result.current.pending).toBe(false);
        expect(result.current.error).toBe('Server said no.');

        // A new click clears the message.
        act(() => result.current.setQuantity(3));
        expect(result.current.error).toBeNull();
    });

    it('does not save a count that ends up equal to the saved one', async () => {
        const save = vi.fn().mockResolvedValue(undefined);
        const { result } = renderHook(() =>
            useDebouncedQuantity({ saved: 2, save })
        );
        act(() => result.current.setQuantity(3));
        act(() => result.current.setQuantity(2));
        await settle();
        expect(save).not.toHaveBeenCalled();
        expect(result.current.pending).toBe(false);
    });

    it('saves a pending count when it unmounts', async () => {
        const save = vi.fn().mockResolvedValue(undefined);
        const { result, unmount } = renderHook(() =>
            useDebouncedQuantity({ saved: 1, save })
        );
        act(() => result.current.setQuantity(4));
        expect(save).not.toHaveBeenCalled();

        unmount();
        expect(save).toHaveBeenCalledWith(4);
    });

    it('saves a pending count when the page is hidden', () => {
        const save = vi.fn().mockResolvedValue(undefined);
        const { result } = renderHook(() =>
            useDebouncedQuantity({ saved: 1, save })
        );
        act(() => result.current.setQuantity(4));
        act(() => {
            window.dispatchEvent(new Event('pagehide'));
        });
        expect(save).toHaveBeenCalledWith(4);
    });

    it('drops a pending count on cancel, even at unmount', async () => {
        const save = vi.fn().mockResolvedValue(undefined);
        const { result, unmount } = renderHook(() =>
            useDebouncedQuantity({ saved: 1, save })
        );
        act(() => result.current.setQuantity(4));
        act(() => result.current.cancel());
        expect(result.current.quantity).toBe(1);

        await settle();
        unmount();
        expect(save).not.toHaveBeenCalled();
    });
});
