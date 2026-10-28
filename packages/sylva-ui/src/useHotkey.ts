'use client';

import { useEffect, useRef } from 'react';
import { isApplePlatform } from './platform';

/** True while a modal dialog is open: the page behind it is inert. */
function isModalOpen(): boolean {
    return Array.from(document.querySelectorAll('dialog[open]')).some(
        (dialog) => {
            try {
                return dialog.matches(':modal');
            } catch {
                // An engine without `:modal`: any open dialog counts.
                return true;
            }
        }
    );
}

/**
 * Run `handler` when the shortcut is pressed anywhere on the page. Only
 * `mod+<key>` combos are supported (for example `mod+k`): `mod` is Command on
 * Apple platforms and Ctrl elsewhere. It calls `preventDefault()` so the
 * browser's own shortcut does not also fire, works while a field has focus,
 * and does nothing while a modal dialog is open. The listener is removed on
 * unmount.
 */
export function useHotkey(
    combo: string,
    handler: (event: KeyboardEvent) => void
) {
    const handlerRef = useRef(handler);
    useEffect(() => {
        handlerRef.current = handler;
    });

    useEffect(() => {
        const [modifier, key] = combo.toLowerCase().split('+');
        if (modifier !== 'mod' || !key) {
            throw new Error(`useHotkey supports "mod+<key>", got "${combo}"`);
        }
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key?.toLowerCase() !== key) return;
            if (event.altKey || event.shiftKey) return;
            const hasModifier = isApplePlatform()
                ? event.metaKey && !event.ctrlKey
                : event.ctrlKey && !event.metaKey;
            if (!hasModifier) return;
            if (isModalOpen()) return;
            event.preventDefault();
            handlerRef.current(event);
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [combo]);
}
