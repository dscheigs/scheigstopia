import { describe, expect, it, vi } from 'vitest';
import { createScanFeedback, type ScanFeedbackEnv } from '@/lib/scanFeedback';

function fakeParam() {
    return {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
    };
}

function fakeAudio(initial: 'suspended' | 'running' = 'suspended') {
    const oscillators: { frequency: { value: number }; type: string }[] = [];
    const ctx = {
        state: initial,
        currentTime: 0,
        destination: {},
        resume: vi.fn(async () => {
            ctx.state = 'running';
        }),
        createOscillator: vi.fn(() => {
            const osc = {
                type: 'sine',
                frequency: { value: 0 },
                connect: vi.fn(),
                start: vi.fn(),
                stop: vi.fn(),
            };
            oscillators.push(osc);
            return osc;
        }),
        createGain: vi.fn(() => ({ gain: fakeParam(), connect: vi.fn() })),
    };
    return { ctx, oscillators };
}

function fakeLock() {
    const listeners: (() => void)[] = [];
    const sentinel = {
        released: false,
        release: vi.fn(async () => {
            sentinel.released = true;
            listeners.forEach((l) => l());
        }),
        addEventListener: vi.fn((_: string, l: () => void) => {
            listeners.push(l);
        }),
    };
    return sentinel;
}

function setup(overrides: Partial<ScanFeedbackEnv> = {}) {
    const audio = fakeAudio();
    let visible = true;
    const visListeners = new Set<() => void>();
    const locks: ReturnType<typeof fakeLock>[] = [];
    const request = vi.fn(async () => {
        const lock = fakeLock();
        locks.push(lock);
        return lock as unknown as WakeLockSentinel;
    });
    const vibrate = vi.fn(() => true);
    const env: ScanFeedbackEnv = {
        createAudioContext: () => audio.ctx as unknown as AudioContext,
        wakeLock: { request },
        vibrate,
        isVisible: () => visible,
        onVisibilityChange: (l) => {
            visListeners.add(l);
            return () => visListeners.delete(l);
        },
        ...overrides,
    };
    return {
        feedback: createScanFeedback(env),
        audio,
        request,
        vibrate,
        locks,
        setVisible(v: boolean) {
            visible = v;
            visListeners.forEach((l) => l());
        },
        visListeners,
    };
}

describe('createScanFeedback', () => {
    it('starts inactive', () => {
        const { feedback } = setup();
        expect(feedback.getState()).toEqual({
            audioActive: false,
            wakeLockActive: false,
        });
    });

    it('start unlocks audio and takes the wake lock', async () => {
        const { feedback, audio, request } = setup();
        const listener = vi.fn();
        feedback.subscribe(listener);
        await feedback.start();
        expect(audio.ctx.resume).toHaveBeenCalledOnce();
        expect(request).toHaveBeenCalledWith('screen');
        expect(feedback.getState()).toEqual({
            audioActive: true,
            wakeLockActive: true,
        });
        expect(listener).toHaveBeenCalled();
    });

    it('does not resume or re-request when started twice', async () => {
        const { feedback, audio, request } = setup();
        await feedback.start();
        await feedback.start();
        expect(audio.ctx.resume).toHaveBeenCalledOnce();
        expect(request).toHaveBeenCalledOnce();
    });

    it('plays a soft ding and vibrates on capture', async () => {
        const { feedback, audio, vibrate } = setup();
        await feedback.start();
        feedback.notifyCaptured();
        expect(audio.oscillators).toHaveLength(1);
        expect(audio.oscillators[0].type).toBe('sine');
        expect(audio.oscillators[0].frequency.value).toBe(1047);
        expect(vibrate).toHaveBeenCalledWith(40);
    });

    it('plays a distinct attention tone', async () => {
        const { feedback, audio, vibrate } = setup();
        await feedback.start();
        feedback.notifyAttention();
        expect(audio.oscillators).toHaveLength(2);
        expect(audio.oscillators[0].type).toBe('square');
        expect(audio.oscillators[0].frequency.value).toBe(330);
        expect(vibrate).toHaveBeenCalledWith([120, 80, 120]);
    });

    it('stays silent before audio is unlocked', () => {
        const { feedback, audio } = setup();
        feedback.notifyCaptured();
        feedback.notifyAttention();
        expect(audio.oscillators).toHaveLength(0);
    });

    it('stays silent when resume fails', async () => {
        const { feedback, audio } = setup();
        audio.ctx.resume.mockRejectedValueOnce(new Error('blocked'));
        await feedback.start();
        feedback.notifyCaptured();
        expect(feedback.getState().audioActive).toBe(false);
        expect(audio.oscillators).toHaveLength(0);
    });

    it('works without Web Audio, Wake Lock or vibration', async () => {
        const { feedback } = setup({
            createAudioContext: () => null,
            wakeLock: null,
            vibrate: null,
        });
        await feedback.start();
        expect(() => {
            feedback.notifyCaptured();
            feedback.notifyAttention();
        }).not.toThrow();
        expect(feedback.getState()).toEqual({
            audioActive: false,
            wakeLockActive: false,
        });
    });

    it('survives a denied wake lock', async () => {
        const { feedback } = setup({
            wakeLock: {
                request: vi.fn().mockRejectedValue(new Error('denied')),
            },
        });
        await feedback.start();
        expect(feedback.getState().wakeLockActive).toBe(false);
        expect(feedback.getState().audioActive).toBe(true);
    });

    it('re-acquires the wake lock when the tab becomes visible again', async () => {
        const t = setup();
        await t.feedback.start();
        // The browser releases the lock when the tab is hidden.
        t.setVisible(false);
        await t.locks[0].release();
        expect(t.feedback.getState().wakeLockActive).toBe(false);
        t.setVisible(true);
        await vi.waitFor(() =>
            expect(t.feedback.getState().wakeLockActive).toBe(true)
        );
        expect(t.request).toHaveBeenCalledTimes(2);
    });

    it('does not request a lock while the tab is hidden', async () => {
        const t = setup();
        t.setVisible(false);
        await t.feedback.start();
        expect(t.request).not.toHaveBeenCalled();
    });

    it('stop releases the lock and stops watching visibility', async () => {
        const t = setup();
        await t.feedback.start();
        t.feedback.stop();
        expect(t.locks[0].release).toHaveBeenCalledOnce();
        expect(t.feedback.getState().wakeLockActive).toBe(false);
        expect(t.visListeners.size).toBe(0);
        // Audio stays unlocked for the next session.
        expect(t.feedback.getState().audioActive).toBe(true);
    });

    it('releases a lock that arrives after stop', async () => {
        let resolve!: (s: WakeLockSentinel) => void;
        const late = fakeLock();
        const t = setup({
            wakeLock: {
                request: () =>
                    new Promise<WakeLockSentinel>((r) => {
                        resolve = r;
                    }),
            },
        });
        const started = t.feedback.start();
        t.feedback.stop();
        resolve(late as unknown as WakeLockSentinel);
        await started;
        expect(late.release).toHaveBeenCalledOnce();
        expect(t.feedback.getState().wakeLockActive).toBe(false);
    });

    it('can start again after stop', async () => {
        const t = setup();
        await t.feedback.start();
        t.feedback.stop();
        await t.feedback.start();
        expect(t.request).toHaveBeenCalledTimes(2);
        expect(t.feedback.getState().wakeLockActive).toBe(true);
    });

    it('unsubscribed listeners are not called', async () => {
        const t = setup();
        const listener = vi.fn();
        const off = t.feedback.subscribe(listener);
        off();
        await t.feedback.start();
        expect(listener).not.toHaveBeenCalled();
    });
});
