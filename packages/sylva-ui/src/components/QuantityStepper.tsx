'use client';

import { useState } from 'react';
import Button from './Button';

export type QuantityStepperProps = {
    value: number;
    /** Called with the next quantity, already clamped to `min` and `max`. */
    onChange: (next: number) => void;
    /** The "−" button disables here, and a typed value is raised to it. Default 0. */
    min?: number;
    /** The "+" button disables here, and a typed value is lowered to it. Default none. */
    max?: number;
    disabled?: boolean;
    /** Accessible name of the "−" button, such as "Remove one Island". */
    decrementLabel: string;
    /** Accessible name of the "+" button, such as "Add one Island". */
    incrementLabel: string;
    /** Accessible name of the value, such as "3 owned". */
    valueLabel: string;
    /** Show the value as a text field the user can type into, not plain text. */
    editable?: boolean;
};

function withinRange(n: number, min: number, max: number | undefined) {
    const lower = Math.max(n, min);
    return max === undefined ? lower : Math.min(lower, max);
}

/**
 * A "−" button, a number and a "+" button. Presentational: it holds no
 * quantity of its own and reports every change through `onChange`.
 *
 * With `editable`, the number is a text field. A typed value is reported on
 * commit (blur or Enter), clamped to `min`/`max`; an empty or non-numeric
 * entry reverts to the current value, and Escape abandons the edit. The field
 * uses `text-input` (a fixed 1rem) so iOS Safari does not zoom on focus.
 */
export default function QuantityStepper({
    value,
    onChange,
    min = 0,
    max,
    disabled = false,
    decrementLabel,
    incrementLabel,
    valueLabel,
    editable = false,
}: QuantityStepperProps) {
    // The text being typed, or null when the field just shows `value`.
    const [draft, setDraft] = useState<string | null>(null);

    function commit() {
        if (draft === null) return;
        setDraft(null);
        const text = draft.trim();
        if (!/^\d+$/.test(text)) return;
        const next = withinRange(Number(text), min, max);
        if (next !== value) onChange(next);
    }

    return (
        <div className="flex items-center gap-2">
            <Button
                aria-label={decrementLabel}
                disabled={disabled || value <= min}
                onClick={() => onChange(withinRange(value - 1, min, max))}
                size="icon"
                variant="primary"
            >
                −
            </Button>
            {editable ? (
                <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    aria-label={valueLabel}
                    disabled={disabled}
                    value={draft ?? String(value)}
                    onChange={(event) => setDraft(event.target.value)}
                    onFocus={(event) => event.target.select()}
                    onBlur={commit}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                            commit();
                        } else if (event.key === 'Escape') {
                            setDraft(null);
                        }
                    }}
                    className="min-h-11 w-16 rounded-control border border-border-minimal bg-surface-minimal px-2 text-center text-input font-medium disabled:opacity-50"
                />
            ) : (
                <span
                    className="min-w-8 text-center text-body font-medium"
                    aria-label={valueLabel}
                >
                    {value}
                </span>
            )}
            <Button
                aria-label={incrementLabel}
                disabled={disabled || (max !== undefined && value >= max)}
                onClick={() => onChange(withinRange(value + 1, min, max))}
                size="icon"
                variant="primary"
            >
                +
            </Button>
        </div>
    );
}
