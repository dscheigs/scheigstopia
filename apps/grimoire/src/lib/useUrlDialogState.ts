'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useDialogState, type DialogState } from '@scheigs/sylva-ui';

function readParam(param: string): string | null {
    return new URLSearchParams(window.location.search).get(param);
}

function urlWith(param: string, value: string | null): string {
    const params = new URLSearchParams(window.location.search);
    if (value === null) params.delete(param);
    else params.set(param, value);
    const search = params.toString();
    return `${window.location.pathname}${search ? `?${search}` : ''}${window.location.hash}`;
}

/**
 * `useDialogState<string>` that mirrors its payload into a query parameter, so
 * Back closes the dialog (on a phone, Back would otherwise leave the page) and
 * a link with the parameter opens it. Showing pushes a history entry; closing
 * goes back to it, or just drops the parameter when the page was opened with it.
 * Uses the History API, which Next.js integrates with its router.
 */
export function useUrlDialogState(param: string): DialogState<string> {
    const state = useDialogState<string>();
    const { show: showState, close: closeState } = state;
    // Whether the current history entry was pushed by show().
    const pushed = useRef(false);

    // Open from the address on load, and follow Back / Forward.
    useEffect(() => {
        const sync = () => {
            pushed.current = false;
            const id = readParam(param);
            if (id === null) closeState();
            else showState(id);
        };
        sync();
        window.addEventListener('popstate', sync);
        return () => window.removeEventListener('popstate', sync);
    }, [param, showState, closeState]);

    const show = useCallback(
        (id: string) => {
            if (readParam(param) === null) {
                window.history.pushState(null, '', urlWith(param, id));
                pushed.current = true;
            } else {
                window.history.replaceState(null, '', urlWith(param, id));
            }
            showState(id);
        },
        [param, showState]
    );

    const close = useCallback(() => {
        closeState();
        if (readParam(param) === null) return;
        if (pushed.current) {
            pushed.current = false;
            window.history.back();
        } else {
            window.history.replaceState(null, '', urlWith(param, null));
        }
    }, [param, closeState]);

    return { open: state.open, value: state.value, show, close };
}
