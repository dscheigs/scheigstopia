// Hands-free scanning feedback: capture chime, attention tone, wake lock and
// optional vibration. Standalone; the caller decides when to call each method.
// start() must run inside a user tap (the Start button) so audio can unlock.

import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import {
    browserFeedbackEnv,
    createScanFeedback,
    type FeedbackState,
    type ScanFeedback,
} from '@/lib/scanFeedback';

export interface UseScanFeedback extends FeedbackState {
    start: () => Promise<void>;
    stop: () => void;
    notifyCaptured: () => void;
    notifyAttention: () => void;
    setMuted: (muted: boolean) => void;
}

const SERVER_STATE: FeedbackState = {
    audioActive: false,
    wakeLockActive: false,
    muted: false,
};

export function useScanFeedback(): UseScanFeedback {
    const ref = useRef<ScanFeedback | null>(null);
    // Created lazily so it never touches `window` during server rendering.
    const get = (): ScanFeedback => {
        if (!ref.current)
            ref.current = createScanFeedback(browserFeedbackEnv());
        return ref.current;
    };

    const state = useSyncExternalStore(
        (listener) => get().subscribe(listener),
        () => get().getState(),
        () => SERVER_STATE
    );

    useEffect(
        () => () => {
            ref.current?.stop();
        },
        []
    );

    const actions = useMemo(
        () => ({
            start: () => get().start(),
            stop: () => get().stop(),
            notifyCaptured: () => get().notifyCaptured(),
            notifyAttention: () => get().notifyAttention(),
            setMuted: (muted: boolean) => get().setMuted(muted),
        }),
        // get only reads a ref, so it is stable.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    return { ...state, ...actions };
}
