// Sound, wake lock and vibration for hands-free scanning. This is the plain
// logic behind useScanFeedback; it takes its browser APIs as arguments so tests
// can swap in fakes. The sounds are synthesized, so there are no audio files.

export interface FeedbackState {
    /** The AudioContext exists and is running, so sounds will play. */
    audioActive: boolean;
    /** A screen wake lock is currently held. */
    wakeLockActive: boolean;
    /** Sounds are muted. Vibration (where supported) still fires. */
    muted: boolean;
}

export interface ScanFeedbackEnv {
    /** Returns a new AudioContext, or null where Web Audio is missing. */
    createAudioContext: () => AudioContext | null;
    /** The Screen Wake Lock API, or null where unsupported. */
    wakeLock: { request: (type: 'screen') => Promise<WakeLockSentinel> } | null;
    /** navigator.vibrate, or null where unsupported (iOS). */
    vibrate: ((pattern: number | number[]) => boolean) | null;
    /** Visibility of the page; the wake lock is dropped when it is hidden. */
    isVisible: () => boolean;
    /** Subscribes to visibility changes and returns the unsubscribe. */
    onVisibilityChange: (listener: () => void) => () => void;
    /** Where the mute choice is remembered. Optional; defaults to unmuted. */
    muted?: { load: () => boolean; save: (muted: boolean) => void };
}

export interface ScanFeedback {
    /** Call from a user tap: unlocks audio and starts holding the wake lock. */
    start: () => Promise<void>;
    /** Releases the wake lock and stops listening. Audio stays unlocked. */
    stop: () => void;
    /** A frame was captured: soft chime and a short buzz. */
    notifyCaptured: () => void;
    /** Something was flagged or failed: a lower, doubled tone and a long buzz. */
    notifyAttention: () => void;
    /** Silences (or restores) the sounds. The choice is remembered. */
    setMuted: (muted: boolean) => void;
    getState: () => FeedbackState;
    subscribe: (listener: () => void) => () => void;
}

interface Note {
    freq: number;
    start: number;
    duration: number;
}

// Capture: one soft sine ding (C6) that rings out. Attention: two low square
// beeps, which cannot be mistaken for the chime when you are not looking.
const CHIME: Note[] = [{ freq: 1047, start: 0, duration: 0.45 }];
const ATTENTION: Note[] = [
    { freq: 330, start: 0, duration: 0.18 },
    { freq: 330, start: 0.26, duration: 0.18 },
];
const MUTED_STORAGE_KEY = 'grimoire.scanMuted';
const CHIME_BUZZ = 40;
const ATTENTION_BUZZ = [120, 80, 120];
// The ding is quieter than the attention tone, which must be heard when you
// are not looking.
const CHIME_GAIN = 0.12;
const ATTENTION_GAIN = 0.25;

export function createScanFeedback(env: ScanFeedbackEnv): ScanFeedback {
    let ctx: AudioContext | null = null;
    let sentinel: WakeLockSentinel | null = null;
    let active = false;
    let unwatch: (() => void) | null = null;
    let muted = env.muted?.load() ?? false;
    let state: FeedbackState = {
        audioActive: false,
        wakeLockActive: false,
        muted,
    };
    const listeners = new Set<() => void>();

    function publish() {
        const next: FeedbackState = {
            audioActive: ctx !== null && ctx.state === 'running',
            wakeLockActive: sentinel !== null && !sentinel.released,
            muted,
        };
        if (
            next.audioActive === state.audioActive &&
            next.wakeLockActive === state.wakeLockActive &&
            next.muted === state.muted
        ) {
            return;
        }
        state = next;
        listeners.forEach((listener) => listener());
    }

    async function unlockAudio() {
        if (!ctx) ctx = env.createAudioContext();
        if (!ctx) return;
        try {
            if (ctx.state !== 'running') await ctx.resume();
        } catch {
            // Stays inactive; the sounds are skipped.
        }
    }

    async function acquireWakeLock() {
        if (!env.wakeLock || !active || !env.isVisible()) return;
        if (sentinel && !sentinel.released) return;
        try {
            const lock = await env.wakeLock.request('screen');
            if (!active) {
                // stop() ran while the request was in flight.
                void lock.release().catch(() => undefined);
                return;
            }
            sentinel = lock;
            lock.addEventListener('release', publish);
        } catch {
            // Denied (low battery, etc.). Scanning works, the screen may sleep.
        }
        publish();
    }

    function play(notes: Note[], shape: OscillatorType, peak: number) {
        if (muted || !ctx || ctx.state !== 'running') return;
        const now = ctx.currentTime;
        for (const note of notes) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = shape;
            osc.frequency.value = note.freq;
            const at = now + note.start;
            const end = at + note.duration;
            // A fast attack and decay avoids clicks.
            gain.gain.setValueAtTime(0, at);
            gain.gain.linearRampToValueAtTime(peak, at + 0.01);
            gain.gain.linearRampToValueAtTime(0, end);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(at);
            osc.stop(end + 0.02);
        }
    }

    function buzz(pattern: number | number[]) {
        try {
            env.vibrate?.(pattern);
        } catch {
            // Vibration is a bonus.
        }
    }

    return {
        async start() {
            active = true;
            if (!unwatch) {
                unwatch = env.onVisibilityChange(() => {
                    // The browser drops the lock when the tab is hidden.
                    if (active && env.isVisible()) void acquireWakeLock();
                    publish();
                });
            }
            await Promise.all([unlockAudio(), acquireWakeLock()]);
            publish();
        },
        stop() {
            active = false;
            unwatch?.();
            unwatch = null;
            const held = sentinel;
            sentinel = null;
            if (held && !held.released) {
                void held.release().catch(() => undefined);
            }
            publish();
        },
        notifyCaptured() {
            play(CHIME, 'sine', CHIME_GAIN);
            buzz(CHIME_BUZZ);
        },
        notifyAttention() {
            play(ATTENTION, 'square', ATTENTION_GAIN);
            buzz(ATTENTION_BUZZ);
        },
        setMuted(next) {
            muted = next;
            try {
                env.muted?.save(next);
            } catch {
                // Not remembering the choice is not worth surfacing.
            }
            publish();
        },
        getState: () => state,
        subscribe(listener) {
            listeners.add(listener);
            return () => {
                listeners.delete(listener);
            };
        },
    };
}

/** The real browser environment. Only call this in the browser. */
export function browserFeedbackEnv(): ScanFeedbackEnv {
    const AudioCtor: typeof AudioContext | undefined =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;
    return {
        createAudioContext: () => (AudioCtor ? new AudioCtor() : null),
        wakeLock:
            'wakeLock' in navigator && navigator.wakeLock
                ? navigator.wakeLock
                : null,
        vibrate:
            typeof navigator.vibrate === 'function'
                ? navigator.vibrate.bind(navigator)
                : null,
        muted: {
            load: () => {
                try {
                    return localStorage.getItem(MUTED_STORAGE_KEY) === '1';
                } catch {
                    return false;
                }
            },
            save: (muted) => {
                try {
                    localStorage.setItem(MUTED_STORAGE_KEY, muted ? '1' : '0');
                } catch {
                    // Storage can be blocked.
                }
            },
        },
        isVisible: () => document.visibilityState === 'visible',
        onVisibilityChange: (listener) => {
            document.addEventListener('visibilitychange', listener);
            return () =>
                document.removeEventListener('visibilitychange', listener);
        },
    };
}
