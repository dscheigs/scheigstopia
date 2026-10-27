'use client';

import { useMemo, useState } from 'react';
import { Button, Plus, Spinner } from '@scheigs/sylva-ui';
import CardThumbnail from '@/components/CardThumbnail';
import ScryfallFallback from '@/components/ScryfallFallback';
import {
    CATALOG_MIN_QUERY_LENGTH,
    CATALOG_RESULT_LIMIT,
    searchCards,
    type CardEntry,
    type CardIndex,
} from '@/lib/cardSearch';
import { useAddCard } from '@/lib/queries';

/** How many more matches to ask for than we show, so owned cards cannot use up the limit. */
const OVER_FETCH = 3;

export type CardListState = 'loading' | 'missing' | 'ready';

type CatalogResultsProps = {
    /** What the user typed, already debounced. */
    query: string;
    /** The catalog index; null until the card list has loaded. */
    index: CardIndex | null;
    cardListState: CardListState;
    /** Cards already in the collection; they are not suggested again. */
    ownedIds: Set<string>;
    /** oracleId -> Scryfall image id; empty until the card list loads. */
    imageIds: Map<string, string>;
    /** Called after a card is added, so the page can put focus back in the search field. */
    onAdded?: () => void;
};

/**
 * "Not in collection": cards from the whole catalog that match the search and
 * that the user does not own, each with a "+" that adds it. Shown from
 * `CATALOG_MIN_QUERY_LENGTH` characters, at most `CATALOG_RESULT_LIMIT` rows
 * (so it is not virtualized). Put it below the collection list, not above: the
 * list measures its offset from the top of the page once, so nothing above it
 * may change height. A failed add is reported by the global error toast.
 */
export default function CatalogResults({
    query,
    index,
    cardListState,
    ownedIds,
    imageIds,
    onAdded,
}: CatalogResultsProps) {
    const addCard = useAddCard();
    // The name just added and the query it was added under, so the note goes
    // away when the user searches for something else.
    const [added, setAdded] = useState<{ name: string; query: string } | null>(
        null
    );

    const trimmed = query.trim();
    const active = trimmed.length >= CATALOG_MIN_QUERY_LENGTH;

    const matches = useMemo(
        () =>
            index && active
                ? searchCards(
                      index,
                      trimmed,
                      CATALOG_RESULT_LIMIT * OVER_FETCH,
                      CATALOG_MIN_QUERY_LENGTH
                  )
                : [],
        [index, active, trimmed]
    );
    const suggestions = useMemo(
        () =>
            matches
                .filter((card) => !ownedIds.has(card.oracleId))
                .slice(0, CATALOG_RESULT_LIMIT),
        [matches, ownedIds]
    );

    if (!active) return null;

    const busyId = (addCard.isPending && addCard.variables.oracleId) || null;
    const add = (card: CardEntry) => {
        addCard.mutate(card, {
            onSuccess: () => {
                setAdded({ name: card.name, query: trimmed });
                onAdded?.();
            },
        });
    };

    return (
        <section aria-labelledby="catalog-heading" className="space-y-3">
            <h3 id="catalog-heading" className="text-subheading">
                Not in collection
            </h3>

            {cardListState === 'loading' && (
                <div className="flex justify-center">
                    <Spinner className="text-text-minimal" />
                </div>
            )}
            {cardListState === 'missing' && (
                <p className="text-caption text-text-minimal">
                    The card list has not been built yet, so there are no
                    suggestions. Run{' '}
                    <code className="font-mono">
                        pnpm nx run grimoire:card-names
                    </code>{' '}
                    and reload.
                </p>
            )}

            {suggestions.length > 0 && (
                <ul className="divide-y divide-border-minimal rounded-surface border border-border-minimal bg-surface-minimal">
                    {suggestions.map((card) => (
                        <li
                            key={card.oracleId}
                            className="flex items-center gap-3 px-4 py-3"
                        >
                            <CardThumbnail
                                imageId={imageIds.get(card.oracleId)}
                                name={card.name}
                            />
                            <span
                                className="min-w-0 flex-1 truncate text-body"
                                title={card.name}
                            >
                                {card.name}
                            </span>
                            <Button
                                variant="secondary"
                                size="icon"
                                aria-label={`Add ${card.name} to your collection`}
                                disabled={busyId === card.oracleId}
                                onClick={() => add(card)}
                            >
                                {busyId === card.oracleId ? (
                                    <Spinner size="sm" label="Adding" />
                                ) : (
                                    <Plus aria-hidden="true" />
                                )}
                            </Button>
                        </li>
                    ))}
                </ul>
            )}

            {/* Cards newer than the list: only when the list matched nothing at all
                (an owned card does not count as nothing). */}
            {index && (
                <ScryfallFallback
                    query={trimmed}
                    listEmpty={matches.length === 0}
                    action="Add"
                    busy={addCard.isPending}
                    onPick={add}
                />
            )}

            <p role="status" className="text-caption text-text-minimal">
                {added && added.query === trimmed
                    ? `Added ${added.name}.`
                    : null}
            </p>
        </section>
    );
}
