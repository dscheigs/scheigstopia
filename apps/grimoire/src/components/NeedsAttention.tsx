'use client';

import { useMemo } from 'react';
import { Button, Spinner } from '@scheigs/sylva-ui';
import { buildRarities } from '@/lib/cardSearch';
import { attentionList } from '@/lib/rareAttention';
import { useCardNames, useRareCandidates, useSetRareRule } from '@/lib/queries';

/**
 * Rares sitting in Unsorted or a bulk location, so they can be moved somewhere
 * safer (or marked as fine where they are). It only informs; nothing here
 * blocks anything.
 */
export default function NeedsAttention() {
    const candidates = useRareCandidates();
    const cardNames = useCardNames();
    const setRule = useSetRareRule();

    const list = useMemo(
        () =>
            candidates.data && cardNames.data
                ? attentionList(candidates.data, buildRarities(cardNames.data))
                : null,
        [candidates.data, cardNames.data]
    );
    const failed = candidates.isError || cardNames.isError;

    return (
        <div className="mx-auto max-w-5xl space-y-4 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
            <h1 className="text-subheading">Needs attention</h1>
            <p className="text-body text-text-minimal">
                Rares and mythics in Unsorted or a bulk location. Move them to a
                keepers location or a deck, or mark them as fine where they are.
            </p>
            {failed && (
                <p role="alert" className="text-body text-error">
                    Could not load the list.
                </p>
            )}
            {!failed && list === null && (
                <div className="flex justify-center">
                    <Spinner className="text-text-minimal" />
                </div>
            )}
            {list !== null && list.length === 0 && (
                <p className="text-body text-text-minimal">
                    Nothing needs attention.
                </p>
            )}
            {list !== null && list.length > 0 && (
                <ul className="divide-y divide-border-minimal rounded-surface border border-border-minimal">
                    {list.map((group) => (
                        <li
                            key={`${group.oracleId}:${group.locationId}:${group.rareRule}`}
                            className="flex items-center gap-3 px-4 py-3"
                        >
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-body">
                                    {group.name}
                                </span>
                                <span className="block truncate text-caption text-text-minimal">
                                    {group.quantity} in {group.label}
                                    {group.rareRule === 'keep'
                                        ? ' · marked to keep'
                                        : ''}
                                </span>
                            </span>
                            <Button
                                variant="secondary"
                                disabled={setRule.isPending}
                                onClick={() =>
                                    setRule.mutate({
                                        oracleId: group.oracleId,
                                        locationId: group.locationId,
                                        rule: 'bulk',
                                    })
                                }
                            >
                                Fine here
                            </Button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
