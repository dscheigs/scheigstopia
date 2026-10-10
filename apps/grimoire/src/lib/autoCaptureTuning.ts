// TEMPORARY: lets the four stillness values be tuned live from a phone.
// Delete this file, TuningPanel.tsx and their use in useCardScanner/ScanCard
// once the right values are baked into AUTO_CAPTURE.

import { AUTO_CAPTURE, type AutoCaptureConfig } from '@/lib/autoCapture';

export type TuningKey =
    | 'stillFraction'
    | 'pixelDelta'
    | 'stableMs'
    | 'sampleIntervalMs';

export type Tuning = Pick<AutoCaptureConfig, TuningKey>;

export interface Tunable {
    key: TuningKey;
    label: string;
    min: number;
    max: number;
    step: number;
    /** Text shown next to the slider. */
    format: (value: number) => string;
    /** What it controls and which way to move it. */
    help: string;
}

export const TUNABLES: Tunable[] = [
    {
        key: 'stillFraction',
        label: 'Motion allowed',
        min: 0,
        max: 0.2,
        step: 0.005,
        format: (v) => `${(v * 100).toFixed(1)}%`,
        help: 'Share of the frame that may change between samples and still count as "still". Higher forgives shaky hands and noisy light, but may snap mid-motion.',
    },
    {
        key: 'pixelDelta',
        label: 'Pixel change',
        min: 5,
        max: 80,
        step: 1,
        format: (v) => `${v}`,
        help: 'How far a pixel must change (0-255 gray levels) to count as different. Higher ignores camera noise and flicker, but also makes cards harder to detect.',
    },
    {
        key: 'stableMs',
        label: 'Hold still for',
        min: 100,
        max: 1500,
        step: 50,
        format: (v) => `${v} ms`,
        help: 'How long the card must stay still before it is captured. Lower is faster, higher gives the camera time to focus and settle.',
    },
    {
        key: 'sampleIntervalMs',
        label: 'Sample every',
        min: 50,
        max: 500,
        step: 25,
        format: (v) => `${v} ms`,
        help: 'How often the camera is checked. Shorter gaps make frame-to-frame changes smaller, so stillness is easier to hit, at a little more CPU.',
    },
];

const STORAGE_KEY = 'grimoire.autoCaptureTuning';

export function defaultTuning(): Tuning {
    return {
        stillFraction: AUTO_CAPTURE.stillFraction,
        pixelDelta: AUTO_CAPTURE.pixelDelta,
        stableMs: AUTO_CAPTURE.stableMs,
        sampleIntervalMs: AUTO_CAPTURE.sampleIntervalMs,
    };
}

/** Saved values, clamped to the slider ranges; defaults for anything missing. */
export function loadTuning(): Tuning {
    const tuning = defaultTuning();
    try {
        const saved: unknown = JSON.parse(
            localStorage.getItem(STORAGE_KEY) ?? 'null'
        );
        if (saved && typeof saved === 'object') {
            for (const { key, min, max } of TUNABLES) {
                const value = (saved as Record<string, unknown>)[key];
                if (typeof value === 'number' && Number.isFinite(value)) {
                    tuning[key] = Math.min(max, Math.max(min, value));
                }
            }
        }
    } catch {
        // Storage can be blocked or hold junk; fall back to the defaults.
    }
    return tuning;
}

export function saveTuning(tuning: Tuning) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tuning));
    } catch {
        // Not worth surfacing for a debug tool.
    }
}
