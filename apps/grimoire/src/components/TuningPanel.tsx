'use client';

// TEMPORARY debug panel: sliders for the auto-capture stillness values and the
// rectangle-check switch.
// Remove with lib/autoCaptureTuning.ts once the values are settled.

import { useState } from 'react';
import { buttonClasses, secondaryButtonClasses } from '@/components/styles';
import { TUNABLES, type Tuning, type TuningKey } from '@/lib/autoCaptureTuning';
import type { ShapeStatus } from '@/lib/useCardScanner';

interface Props {
    tuning: Tuning;
    shapeStatus: ShapeStatus;
    onChange: (key: TuningKey, value: number) => void;
    onShapeCheck: (on: boolean) => void;
    onReset: () => void;
}

const SHAPE_STATUS_TEXT: Record<ShapeStatus, string> = {
    off: 'Off: a card is anything that changes the picture, as before.',
    loading:
        'Downloading OpenCV.js (several MB); capturing on motion only until it is ready.',
    ready: 'On: a card must also be a card-shaped rectangle.',
    failed: 'Could not load OpenCV.js; capturing on motion only.',
};

export default function TuningPanel({
    tuning,
    shapeStatus,
    onChange,
    onShapeCheck,
    onReset,
}: Props) {
    const [open, setOpen] = useState<TuningKey | null>(null);

    return (
        <div
            className="space-y-4 rounded-lg border border-border-minimal bg-surface-minimal p-4"
            aria-label="Auto-capture tuning"
        >
            <div
                className="space-y-1"
                role="group"
                aria-label="Rectangle check"
            >
                <div className="flex items-center justify-between gap-2">
                    <span className="text-body">Rectangle check</span>
                    <div className="flex gap-2">
                        {[false, true].map((on) => (
                            <button
                                key={String(on)}
                                type="button"
                                onClick={() => onShapeCheck(on)}
                                aria-pressed={tuning.shapeCheck === on}
                                className={
                                    tuning.shapeCheck === on
                                        ? buttonClasses
                                        : secondaryButtonClasses
                                }
                            >
                                {on ? 'On' : 'Off'}
                            </button>
                        ))}
                    </div>
                </div>
                <p
                    className="text-caption text-text-minimal"
                    aria-live="polite"
                >
                    {SHAPE_STATUS_TEXT[tuning.shapeCheck ? shapeStatus : 'off']}
                </p>
            </div>
            {TUNABLES.map((tunable) => {
                const id = `tune-${tunable.key}`;
                const helpOpen = open === tunable.key;
                return (
                    <div key={tunable.key} className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1">
                                <label htmlFor={id} className="text-body">
                                    {tunable.label}
                                </label>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setOpen(helpOpen ? null : tunable.key)
                                    }
                                    aria-expanded={helpOpen}
                                    aria-label={`What is ${tunable.label}?`}
                                    className="inline-flex size-11 items-center justify-center rounded-full text-caption text-text-minimal"
                                >
                                    <span className="inline-flex size-5 items-center justify-center rounded-full border border-border-minimal font-mono">
                                        i
                                    </span>
                                </button>
                            </div>
                            <span className="font-mono text-body">
                                {tunable.format(tuning[tunable.key])}
                            </span>
                        </div>
                        {helpOpen && (
                            <p className="text-caption text-text-minimal">
                                {tunable.help}
                            </p>
                        )}
                        <input
                            id={id}
                            type="range"
                            min={tunable.min}
                            max={tunable.max}
                            step={tunable.step}
                            value={tuning[tunable.key]}
                            onChange={(event) =>
                                onChange(
                                    tunable.key,
                                    Number(event.target.value)
                                )
                            }
                            className="h-11 w-full accent-neutral-800 dark:accent-neutral-200"
                        />
                    </div>
                );
            })}
            <button
                type="button"
                onClick={onReset}
                className={secondaryButtonClasses}
            >
                Reset to defaults
            </button>
        </div>
    );
}
