import { useSyncExternalStore } from 'react';

/**
 * Whether a CSS media query matches. False on the server and where
 * `matchMedia` does not exist (jsdom), then it follows the real value.
 */
export function useMediaQuery(query: string): boolean {
    return useSyncExternalStore(
        (onChange) => {
            if (!window.matchMedia) return () => {};
            const list = window.matchMedia(query);
            list.addEventListener('change', onChange);
            return () => list.removeEventListener('change', onChange);
        },
        () => window.matchMedia?.(query).matches ?? false,
        () => false
    );
}
