'use client';

import { useCallback, useState } from 'react';

/** `show` takes no argument for a payload-less dialog and one payload otherwise. */
export type ShowDialog<T> = (
    ...payload: [T] extends [true] ? [] : [payload: T]
) => void;

export type DialogState<T> = {
    /** True while the dialog is open. Never a truthiness check on the payload. */
    open: boolean;
    /** The payload while open, null when closed. */
    value: T | null;
    /**
     * Opens the dialog. Call it as `() => show()` or `() => show(id)`, not as
     * `onClick={show}`, which would pass the click event as the payload.
     */
    show: ShowDialog<T>;
    close: () => void;
};

/**
 * Local open/closed state for a controlled `Dialog`, backed by one
 * `useState<T | null>`. `T` defaults to `true` for a dialog with no payload
 * (`useDialogState()`); a keyed dialog is `useDialogState<string>()` with
 * `show(id)`. A payload of `0` or `''` still opens it. It holds no provider
 * or global state: two distant components that open the same dialog need
 * something bigger than this.
 */
export function useDialogState<T = true>(): DialogState<T> {
    const [value, setValue] = useState<T | null>(null);

    const show = useCallback(
        (...payload: unknown[]) =>
            setValue(payload.length === 0 ? (true as T) : (payload[0] as T)),
        []
    ) as ShowDialog<T>;
    const close = useCallback(() => setValue(null), []);

    return { open: value !== null, value, show, close };
}
