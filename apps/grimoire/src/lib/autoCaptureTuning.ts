// TEMPORARY: lets the stillness values and the rectangle check be tuned live
// from a phone.
// Delete this file, TuningPanel.tsx and their use in useCardScanner/ScanCard
// once the right values are baked into AUTO_CAPTURE.

import { AUTO_CAPTURE, type AutoCaptureConfig } from '@/lib/autoCapture';

export type TuningKey =
    | 'presentFraction'
    | 'stillFraction'
    | 'pixelDelta'
    | 'stableMs'
    | 'sampleIntervalMs'
    | 'aspectTolerance';

export type Tuning = Pick<AutoCaptureConfig, TuningKey> & {
    /** Require a card-shaped rectangle before capturing (loads OpenCV.js). */
    shapeCheck: boolean;
};

/** The part of Tuning the detector reads from its config. */
export function configValues(
    tuning: Tuning
): Pick<AutoCaptureConfig, TuningKey> {
    return {
        presentFraction: tuning.presentFraction,
        stillFraction: tuning.stillFraction,
        pixelDelta: tuning.pixelDelta,
        stableMs: tuning.stableMs,
        sampleIntervalMs: tuning.sampleIntervalMs,
        aspectTolerance: tuning.aspectTolerance,
    };
}

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
        key: 'presentFraction',
        label: 'Card in frame',
        min: 0.02,
        max: 0.4,
        step: 0.01,
        format: (v) => `${(v * 100).toFixed(0)}%`,
        help: 'Share of the frame that must differ from the empty background before a card counts as there. Lower catches dark cards on dark tables and cards that do not fill the frame, but may mistake shadows or a hand for a card.',
    },
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
    {
        key: 'aspectTolerance',
        label: 'Card shape tolerance',
        min: 0.02,
        max: 0.4,
        step: 0.01,
        format: (v) => `${(v * 100).toFixed(0)}%`,
        help: "Only used when the rectangle check is on. How far the rectangle's long-to-short ratio may be from a card's 63:88. Higher accepts cards held at an angle, but lets more non-card shapes through.",
    },
];

const STORAGE_KEY = 'grimoire.autoCaptureTuning';

export function defaultTuning(): Tuning {
    return {
        presentFraction: AUTO_CAPTURE.presentFraction,
        stillFraction: AUTO_CAPTURE.stillFraction,
        pixelDelta: AUTO_CAPTURE.pixelDelta,
        stableMs: AUTO_CAPTURE.stableMs,
        sampleIntervalMs: AUTO_CAPTURE.sampleIntervalMs,
        aspectTolerance: AUTO_CAPTURE.aspectTolerance,
        shapeCheck: false,
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
            if (
                typeof (saved as Record<string, unknown>).shapeCheck ===
                'boolean'
            ) {
                tuning.shapeCheck = (
                    saved as { shapeCheck: boolean }
                ).shapeCheck;
            }
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
