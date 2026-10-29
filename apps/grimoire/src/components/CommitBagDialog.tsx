'use client';

import { useState, type FormEvent } from 'react';
import { Button, Dialog, TextField, inputClasses } from '@scheigs/sylva-ui';
import {
    bagOptions,
    initialChoice,
    toDestination,
    type BagChoice,
    type CommitDestination,
} from '@/lib/commitBag';
import type { LocationItem } from '@/lib/locations';

interface CommitBagDialogProps {
    open: boolean;
    /** Cards the commit will add, for the confirm button. */
    count: number;
    /** The user's locations; only the open bags are offered. */
    locations: LocationItem[];
    /** The bag the last commit went into, if remembered. */
    lastBagId: string | null;
    /** Today, passed in so the default label is testable. */
    today: Date;
    pending: boolean;
    /** A failed commit's message, shown in the dialog. */
    error: string | null;
    onCommit: (destination: CommitDestination) => void;
    onClose: () => void;
}

const FORM_ID = 'commit-bag-form';

/**
 * Asks which bag a scan session goes into: a new one (labelled with today's
 * date unless changed) or an existing one. It mounts its state only while
 * open, so each opening starts from the remembered bag.
 */
export default function CommitBagDialog(props: CommitBagDialogProps) {
    return props.open ? <OpenDialog {...props} /> : null;
}

function OpenDialog({
    count,
    locations,
    lastBagId,
    today,
    pending,
    error,
    onCommit,
    onClose,
}: CommitBagDialogProps) {
    const bags = bagOptions(locations);
    const [choice, setChoice] = useState<BagChoice>(() =>
        initialChoice(lastBagId, bags, today)
    );
    const [problem, setProblem] = useState<string | null>(null);

    const pickNew = () => setChoice(initialChoice(null, [], today));
    const pickExisting = () =>
        setChoice({ mode: 'existing', locationId: bags[0]?.id ?? '' });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        const result = toDestination(choice);
        if (!result.ok) {
            setProblem(result.error);
            return;
        }
        setProblem(null);
        onCommit(result.destination);
    };

    const message = problem ?? error;

    return (
        <Dialog
            open
            onClose={() => {
                if (!pending) onClose();
            }}
            title="Commit to a bag"
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
                    {pending
                        ? 'Committing...'
                        : `Commit ${count} ${count === 1 ? 'card' : 'cards'}`}
                </Button>
            }
        >
            <form id={FORM_ID} onSubmit={submit} className="space-y-4">
                <fieldset className="space-y-2" disabled={pending}>
                    <legend className="sr-only">Which bag</legend>
                    <label className="flex min-h-11 items-center gap-3 text-body">
                        <input
                            type="radio"
                            name="bag-mode"
                            checked={choice.mode === 'new'}
                            onChange={pickNew}
                        />
                        A new bag
                    </label>
                    {choice.mode === 'new' && (
                        <div className="space-y-2 pl-8">
                            <label htmlFor="bag-label" className="sr-only">
                                Bag label
                            </label>
                            <TextField
                                id="bag-label"
                                value={choice.label}
                                onChange={(event) =>
                                    setChoice({
                                        ...choice,
                                        label: event.target.value,
                                    })
                                }
                                autoComplete="off"
                            />
                            <label htmlFor="bag-note" className="sr-only">
                                Name (optional)
                            </label>
                            <TextField
                                id="bag-note"
                                value={choice.note}
                                onChange={(event) =>
                                    setChoice({
                                        ...choice,
                                        note: event.target.value,
                                    })
                                }
                                placeholder="Name (optional)"
                                autoComplete="off"
                            />
                        </div>
                    )}
                    <label className="flex min-h-11 items-center gap-3 text-body">
                        <input
                            type="radio"
                            name="bag-mode"
                            checked={choice.mode === 'existing'}
                            onChange={pickExisting}
                            disabled={bags.length === 0}
                        />
                        An existing bag
                    </label>
                    {choice.mode === 'existing' && (
                        <div className="pl-8">
                            <label htmlFor="bag-existing" className="sr-only">
                                Existing bag
                            </label>
                            <select
                                id="bag-existing"
                                className={inputClasses}
                                value={choice.locationId}
                                onChange={(event) =>
                                    setChoice({
                                        mode: 'existing',
                                        locationId: event.target.value,
                                    })
                                }
                            >
                                {bags.map((bag) => (
                                    <option key={bag.id} value={bag.id}>
                                        {bag.label} ({bag.cardCount})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </fieldset>

                {message && (
                    <p role="alert" className="text-caption text-error">
                        {message}
                    </p>
                )}
            </form>
        </Dialog>
    );
}
