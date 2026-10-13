'use client';

import type { CardEntry } from '@/lib/cardSearch';
import { useScryfallCard } from '@/lib/queries';
import { useDebouncedValue } from '@/lib/useDebouncedValue';

// Longer than the list search: each settled query is a request to Scryfall.
const LOOKUP_DEBOUNCE_MS = 500;

interface ScryfallFallbackProps {
    /** What the user typed. */
    query: string;
    /** True once the card list is loaded and found nothing for the query. */
    listEmpty: boolean;
    /** Verb on the button, for example "Add" or "Use". */
    action: string;
    /** Disables the button while a pick is in flight. */
    busy?: boolean;
    onPick: (card: CardEntry) => void;
}

/**
 * When the card list has no match for a typed name, ask Scryfall (it knows
 * cards newer than the list). A hit is offered as one tappable choice; nothing
 * is picked without the tap. No hit, or a failed lookup, shows no match.
 */
export default function ScryfallFallback({
    query,
    listEmpty,
    action,
    busy = false,
    onPick,
}: ScryfallFallbackProps) {
    const settled = useDebouncedValue(query, LOOKUP_DEBOUNCE_MS);
    const lookup = useScryfallCard(settled, listEmpty && settled === query);

    if (!listEmpty || query.trim().length < 2) return null;
    if (lookup.isFetching || settled !== query) {
        return <p className="text-caption text-text-minimal">Searching...</p>;
    }
    const found = lookup.data;
    if (!found) {
        return (
            <p className="text-caption text-text-minimal">No matching cards.</p>
        );
    }
    return (
        <div className="space-y-2">
            <p className="text-caption text-text-minimal">
                Not in the card list yet. Is this the card?
            </p>
            <ul className="divide-y divide-border-minimal overflow-hidden rounded-lg border border-border-minimal">
                <li>
                    <button
                        type="button"
                        onClick={() => onPick({ ...found, front: found.name })}
                        disabled={busy}
                        className="flex min-h-11 w-full items-center justify-between gap-3 px-4 py-2 text-left text-body transition-colors hover:bg-surface-minimal-hover disabled:opacity-50"
                    >
                        <span>{found.name}</span>
                        <span className="text-caption text-text-minimal">
                            {action}
                        </span>
                    </button>
                </li>
            </ul>
        </div>
    );
}
