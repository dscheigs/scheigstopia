import { useSyncExternalStore } from 'react';

/** True on macOS and iOS, where the shortcut modifier is Command rather than Ctrl. */
export function isApplePlatform(): boolean {
    if (typeof navigator === 'undefined') return false;
    const nav = navigator as Navigator & {
        userAgentData?: { platform?: string };
    };
    const platform = nav.userAgentData?.platform || nav.platform || '';
    return /mac|iphone|ipad|ipod/i.test(platform);
}

/** A device whose primary input cannot hover is a touch-only one: no keyboard shortcuts. */
const TOUCH_ONLY = '(hover: none)';

type Snapshot = 'apple' | 'other' | 'none';

function subscribe(onChange: () => void) {
    if (typeof window === 'undefined' || !window.matchMedia) return () => {};
    const query = window.matchMedia(TOUCH_ONLY);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
}

function getSnapshot(): Snapshot {
    if (window.matchMedia?.(TOUCH_ONLY).matches) return 'none';
    return isApplePlatform() ? 'apple' : 'other';
}

const getServerSnapshot = (): Snapshot => 'none';

/**
 * Which modifier to show in a shortcut hint: `apple` (Command), `other` (Ctrl),
 * or null on the server, before the first client render settles, and on
 * touch-only devices. The server and the first client render agree on null, so
 * there is no hydration mismatch.
 */
export function useShortcutPlatform(): 'apple' | 'other' | null {
    const snapshot = useSyncExternalStore(
        subscribe,
        getSnapshot,
        getServerSnapshot
    );
    return snapshot === 'none' ? null : snapshot;
}
