import { buildSuggestions } from '@/lib/queueReview';
import type { MatchedCard, QueueItem } from '@/lib/scanQueueTypes';

interface CardSuggestionsProps {
    item: Pick<QueueItem, 'candidates' | 'matchedCard'>;
    onPick: (card: MatchedCard) => void;
}

/**
 * The card-list matches the worker found for a read, as tappable choices for
 * the edit modal. Renders nothing for items saved without candidates.
 */
export default function CardSuggestions({
    item,
    onPick,
}: CardSuggestionsProps) {
    const suggestions = buildSuggestions(item);
    if (suggestions.length === 0) return null;
    return (
        <section aria-labelledby="edit-card-suggestions" className="space-y-2">
            <h3
                id="edit-card-suggestions"
                className="text-caption text-text-minimal"
            >
                Or one of these
            </h3>
            <ul className="divide-y divide-border-minimal overflow-hidden rounded-lg border border-border-minimal">
                {suggestions.map((card) => (
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
        </section>
    );
}
