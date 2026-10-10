'use client';

import { useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { inputClasses, secondaryButtonClasses } from '@/components/styles';
import { searchCards, type CardEntry, type CardIndex } from '@/lib/cardSearch';
import { useAddCard } from '@/lib/queries';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { useModalDialog } from '@/lib/useModalDialog';

const SEARCH_DEBOUNCE_MS = 150;

interface AddCardDialogProps {
    /** Null while the card list loads or if it is missing. */
    index: CardIndex | null;
    /** True when the card list was never built. */
    missing: boolean;
    onClose: () => void;
}

/**
 * Modal for adding a card to the collection by name. It stays open after an
 * add so several cards can be entered in a row. It uses the native dialog
 * element, so Escape, focus trapping and restoring focus come from the browser.
 */
export default function AddCardDialog({
    index,
    missing,
    onClose,
}: AddCardDialogProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const handleClose = useModalDialog(dialogRef, onClose);
    const searchRef = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState('');
    const [lastAdded, setLastAdded] = useState<string | null>(null);
    const addCard = useAddCard();

    const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
    const results = useMemo(
        () => (index ? searchCards(index, debouncedQuery) : []),
        [index, debouncedQuery]
    );
    const busyId = (addCard.isPending && addCard.variables.oracleId) || null;

    const add = (card: CardEntry) => {
        setLastAdded(null);
        addCard.mutate(card, {
            onSuccess: () => {
                setQuery('');
                setLastAdded(card.name);
                searchRef.current?.focus();
            },
        });
    };

    return (
        <dialog
            ref={dialogRef}
            aria-labelledby="add-card-title"
            onClose={handleClose}
            onClick={(event) => {
                // A click on the backdrop lands on the dialog itself.
                if (event.target === event.currentTarget) onClose();
            }}
            className="m-auto w-full max-w-md rounded-lg border border-border-minimal bg-surface-minimal p-0 text-foreground backdrop:bg-neutral-950/60"
        >
            <div className="space-y-4 p-4">
                <div className="flex items-start justify-between gap-3">
                    <h2 id="add-card-title" className="text-subheading">
                        Add cards
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className={`${secondaryButtonClasses} min-w-11 px-0`}
                    >
                        <X aria-hidden="true" />
                    </button>
                </div>

                <div className="space-y-2">
                    <label htmlFor="add-card-search" className="sr-only">
                        Card name
                    </label>
                    <input
                        id="add-card-search"
                        ref={searchRef}
                        type="search"
                        autoFocus
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Start typing a card name"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="none"
                        spellCheck={false}
                        disabled={!index}
                        className={inputClasses}
                    />
                    {missing && (
                        <p className="text-caption text-text-minimal">
                            The card list has not been built yet. Run{' '}
                            <code className="font-mono">
                                pnpm nx run grimoire:card-names
                            </code>{' '}
                            and reload.
                        </p>
                    )}
                    {results.length > 0 && (
                        <ul className="divide-y divide-border-minimal overflow-hidden rounded-lg border border-border-minimal">
                            {results.map((card) => (
                                <li key={card.oracleId}>
                                    <button
                                        type="button"
                                        onClick={() => add(card)}
                                        disabled={busyId === card.oracleId}
                                        className="flex min-h-11 w-full items-center justify-between gap-3 px-4 py-2 text-left text-body transition-colors hover:bg-surface-minimal-hover disabled:opacity-50"
                                    >
                                        <span>{card.name}</span>
                                        <span className="text-caption text-text-minimal">
                                            Add
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                    {index &&
                        debouncedQuery.trim().length >= 2 &&
                        results.length === 0 && (
                            <p className="text-caption text-text-minimal">
                                No matching cards.
                            </p>
                        )}
                </div>

                <p role="status" className="text-caption text-text-minimal">
                    {lastAdded ? `Added ${lastAdded}.` : null}
                </p>
                <p
                    role="alert"
                    aria-live="polite"
                    className="text-body text-error"
                >
                    {addCard.error?.message}
                </p>
            </div>
        </dialog>
    );
}
