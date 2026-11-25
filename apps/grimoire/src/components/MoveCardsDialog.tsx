'use client';

import { useState, type FormEvent } from 'react';
import { Button, Dialog, TextField, inputClasses } from '@scheigs/sylva-ui';
import { useLocations, useMoveCards } from '@/lib/queries';
import { checkMove } from '@/lib/moveForm';
import type { Placement } from '@/lib/locations';

interface MoveCardsDialogProps {
    oracleId: string;
    name: string;
    /** Where the copies are now; only these can be moved from. */
    sources: Placement[];
    onClose: () => void;
}

const FORM_ID = 'move-cards-form';

/**
 * Move copies of one card from one place to another, with an optional note.
 * Mount it while moving and unmount it on close, so each opening starts fresh.
 * A rejected move (such as too many copies) shows the server's message.
 */
export default function MoveCardsDialog({
    oracleId,
    name,
    sources,
    onClose,
}: MoveCardsDialogProps) {
    const locations = useLocations();
    const move = useMoveCards();
    const [from, setFrom] = useState(sources[0]?.locationId ?? '');
    const [to, setTo] = useState('');
    const [quantityText, setQuantityText] = useState('1');
    const [note, setNote] = useState('');
    const [problem, setProblem] = useState<string | null>(null);

    const max =
        sources.find((source) => source.locationId === from)?.quantity ?? 0;
    const destinations = (locations.data ?? []).filter(
        (location) => location.archivedAt === null && location.id !== from
    );

    const submit = (event: FormEvent) => {
        event.preventDefault();
        const check = checkMove({ from, to, quantityText, max });
        if (!check.ok) {
            setProblem(check.error);
            return;
        }
        setProblem(null);
        move.mutate(
            {
                moves: [{ oracleId, from, to, quantity: check.quantity }],
                note: note.trim() || null,
            },
            { onSuccess: onClose }
        );
    };

    const message = problem ?? (move.isError ? move.error.message : null);

    return (
        <Dialog
            open
            onClose={() => {
                if (!move.isPending) onClose();
            }}
            title={`Move ${name}`}
            secondaryAction={
                <Button
                    type="button"
                    variant="secondary"
                    onClick={onClose}
                    disabled={move.isPending}
                >
                    Cancel
                </Button>
            }
            primaryAction={
                <Button
                    type="submit"
                    form={FORM_ID}
                    variant="primary"
                    disabled={move.isPending}
                >
                    {move.isPending ? 'Moving...' : 'Move'}
                </Button>
            }
        >
            <form id={FORM_ID} onSubmit={submit} className="space-y-4">
                <div className="space-y-1">
                    <label htmlFor="move-from" className="text-body">
                        From
                    </label>
                    <select
                        id="move-from"
                        className={inputClasses}
                        value={from}
                        onChange={(event) => {
                            setFrom(event.target.value);
                            setTo('');
                        }}
                    >
                        {sources.map((source) => (
                            <option
                                key={source.locationId}
                                value={source.locationId}
                            >
                                {source.label} ({source.quantity})
                            </option>
                        ))}
                    </select>
                </div>
                <div className="space-y-1">
                    <label htmlFor="move-to" className="text-body">
                        To
                    </label>
                    <select
                        id="move-to"
                        className={inputClasses}
                        value={to}
                        onChange={(event) => setTo(event.target.value)}
                    >
                        <option value="">Choose a place</option>
                        {destinations.map((location) => (
                            <option key={location.id} value={location.id}>
                                {location.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="space-y-1">
                    <label htmlFor="move-quantity" className="text-body">
                        Copies
                    </label>
                    <TextField
                        id="move-quantity"
                        inputMode="numeric"
                        value={quantityText}
                        onChange={(event) =>
                            setQuantityText(event.target.value)
                        }
                        autoComplete="off"
                    />
                </div>
                <div className="space-y-1">
                    <label htmlFor="move-note" className="text-body">
                        Note (optional)
                    </label>
                    <TextField
                        id="move-note"
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
