'use client';

// TEMPORARY debug panel: sliders for the auto-capture stillness values.
// Remove with lib/autoCaptureTuning.ts once the values are settled.

import { useState } from 'react';
import { secondaryButtonClasses } from '@/components/styles';
import { TUNABLES, type Tuning, type TuningKey } from '@/lib/autoCaptureTuning';

interface Props {
    tuning: Tuning;
    onChange: (key: TuningKey, value: number) => void;
    onReset: () => void;
}

export default function TuningPanel({ tuning, onChange, onReset }: Props) {
    const [open, setOpen] = useState<TuningKey | null>(null);

    return (
        <div
            className="space-y-4 rounded-lg border border-border-minimal bg-surface-minimal p-4"
            aria-label="Auto-capture tuning"
        >
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
