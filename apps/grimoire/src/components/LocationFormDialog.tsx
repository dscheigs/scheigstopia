'use client';

import { useState, type FormEvent } from 'react';
import { Button, Dialog, TextField, inputClasses } from '@scheigs/sylva-ui';
import type { LocationKind } from '@/lib/locationKinds';
import { kindLabel } from '@/lib/locationsPage';

export type LocationFormValues = {
    kind: Exclude<LocationKind, 'unsorted'>;
    label: string;
    note: string | null;
};

interface LocationFormDialogProps {
    /** Create a new location, or rename (and re-note) this one. */
    mode: 'create' | 'rename';
    initial?: { label: string; note: string | null };
    pending: boolean;
    error: string | null;
    onSubmit: (values: LocationFormValues) => void;
    onClose: () => void;
}

const FORM_ID = 'location-form';
const KINDS = ['bulk', 'keepers', 'deck'] as const;

/** Create a location, or rename one. Mounted only while open. */
export default function LocationFormDialog({
    mode,
    initial,
    pending,
    error,
    onSubmit,
    onClose,
}: LocationFormDialogProps) {
    const [kind, setKind] = useState<(typeof KINDS)[number]>('bulk');
    const [label, setLabel] = useState(initial?.label ?? '');
    const [note, setNote] = useState(initial?.note ?? '');
    const [problem, setProblem] = useState<string | null>(null);

    const submit = (event: FormEvent) => {
        event.preventDefault();
        if (label.trim().length === 0) {
            setProblem('Give it a name.');
            return;
        }
        setProblem(null);
        onSubmit({ kind, label: label.trim(), note: note.trim() || null });
    };

    const message = problem ?? error;

    return (
        <Dialog
            open
            onClose={() => {
                if (!pending) onClose();
            }}
            title={mode === 'create' ? 'New location' : 'Rename location'}
            secondaryAction={
                <Button
                    type="button"
                    variant="secondary"
                    onClick={onClose}
                    disabled={pending}
                >
                    Cancel
                </Button>
            }
            primaryAction={
                <Button
                    type="submit"
                    form={FORM_ID}
                    variant="primary"
                    disabled={pending}
                >
                    {pending ? 'Saving...' : 'Save'}
                </Button>
            }
        >
            <form id={FORM_ID} onSubmit={submit} className="space-y-4">
                {mode === 'create' && (
                    <div className="space-y-1">
                        <label htmlFor="location-kind" className="text-body">
                            Kind
                        </label>
                        <select
                            id="location-kind"
                            className={inputClasses}
                            value={kind}
                            onChange={(event) =>
                                setKind(
                                    event.target.value as (typeof KINDS)[number]
                                )
                            }
                        >
                            {KINDS.map((value) => (
                                <option key={value} value={value}>
                                    {kindLabel(value)}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
                <div className="space-y-1">
                    <label htmlFor="location-label" className="text-body">
                        Name
                    </label>
                    <TextField
                        id="location-label"
                        value={label}
                        onChange={(event) => setLabel(event.target.value)}
                        placeholder="Shoebox"
                        autoComplete="off"
                    />
                </div>
                <div className="space-y-1">
                    <label htmlFor="location-note" className="text-body">
                        Note (optional)
                    </label>
                    <TextField
                        id="location-note"
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        autoComplete="off"
                    />
                </div>
                {message && (
                    <p role="alert" className="text-caption text-error">
                        {message}
                    </p>
                )}
            </form>
        </Dialog>
    );
}
