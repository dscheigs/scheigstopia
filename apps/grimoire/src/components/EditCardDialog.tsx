'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { inputClasses, secondaryButtonClasses } from '@/components/styles';
import { searchCards, type CardEntry, type CardIndex } from '@/lib/cardSearch';

interface EditCardDialogProps {
    /** What the row is called now, shown as the dialog title context. */
    label: string;
    index: CardIndex | null;
    onPick: (card: CardEntry) => void;
    onClose: () => void;
    /** Room for content above the search, such as suggestions or the image. */
    children?: ReactNode;
}

/**
 * Modal for fixing a queue item's card. Mount it while editing and unmount it
 * on close. It uses the native dialog element, so Escape, focus trapping and
 * restoring focus to the pencil button come from the browser.
 */
export default function EditCardDialog({
    label,
    index,
    onPick,
    onClose,
    children,
}: EditCardDialogProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [query, setQuery] = useState('');
    const results = useMemo(
        () => (index ? searchCards(index, query) : []),
        [index, query]
    );

    useEffect(() => {
        const dialog = dialogRef.current;
        if (dialog && !dialog.open) dialog.showModal();
        return () => dialog?.close();
    }, []);

    return (
        <dialog
            ref={dialogRef}
            aria-labelledby="edit-card-title"
            onClose={onClose}
            onClick={(event) => {
                // A click on the backdrop lands on the dialog itself.
                if (event.target === event.currentTarget) onClose();
            }}
            className="m-auto w-full max-w-md rounded-lg border border-border-minimal bg-surface-minimal p-0 text-foreground backdrop:bg-neutral-950/60"
        >
            <div className="space-y-4 p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h2 id="edit-card-title" className="text-subheading">
                            Edit card
                        </h2>
                        <p className="text-caption text-text-minimal">
                            Now: {label}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className={`${secondaryButtonClasses} min-w-11 px-0`}
                    >
                        <X aria-hidden="true" />
                    </button>
                </div>

                {children}

                <div className="space-y-2">
                    <label htmlFor="edit-card-search" className="sr-only">
                        Card name
                    </label>
                    <input
                        id="edit-card-search"
                        type="search"
                        autoFocus
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder={
                            index
                                ? 'Search the card list'
                                : 'Card list unavailable'
                        }
                        disabled={!index}
                        autoComplete="off"
                        className={inputClasses}
                    />
                    {results.length > 0 && (
                        <ul className="divide-y divide-border-minimal overflow-hidden rounded-lg border border-border-minimal">
                            {results.map((card) => (
                                <li key={card.oracleId}>
                                    <button
                                        type="button"
                                        onClick={() => onPick(card)}
                                        className="flex min-h-11 w-full items-center px-4 py-2 text-left text-body transition-colors hover:bg-surface-minimal-hover"
                                    >
                                        {card.name}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </dialog>
    );
}
