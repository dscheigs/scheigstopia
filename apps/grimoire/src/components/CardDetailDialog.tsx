'use client';

import { useState } from 'react';
import { Button, Dialog, useDialogState } from '@scheigs/sylva-ui';
import MoveCardsDialog from '@/components/MoveCardsDialog';
import { CARD_IMAGE_DIMENSIONS, cardImageUrl } from '@/lib/cardImages';
import type { CollectionItem } from '@/lib/collection';
import type { HistoryEntry, Placement } from '@/lib/locations';
import {
    describeMove,
    formatMoveDate,
    formatPlacements,
} from '@/lib/placementText';

type CardDetailDialogProps = {
    /** The card to show, or undefined to keep the sheet closed. */
    item: CollectionItem | undefined;
    /** Scryfall image id for the card, if the card list has loaded. */
    imageId: string | undefined;
    /** Where the copies are; leave out until loaded. */
    placements?: Placement[];
    /** The card's moves, newest first; leave out until loaded. */
    history?: HistoryEntry[];
    onRemove: (item: CollectionItem) => void;
    onClose: () => void;
};

/**
 * What a collection row opens: the large card image, where the copies are,
 * Move and Remove, in a bottom sheet on a phone and a centered dialog on
 * desktop. Copies change place by moving them, not by a counter. It shows
 * whatever `item` it is given on each render and a removed card (item
 * undefined) closes it. Remove asks first, in a second dialog stacked on top
 * of the sheet.
 */
export default function CardDetailDialog({
    item,
    imageId,
    placements,
    history,
    onRemove,
    onClose,
}: CardDetailDialogProps) {
    return (
        <Dialog open={item !== undefined} onClose={onClose} title={item?.name}>
            {/* Mounted only while open, so the confirm below starts closed. */}
            {item && (
                <CardDetailBody
                    item={item}
                    imageId={imageId}
                    placements={placements}
                    history={history}
                    onRemove={onRemove}
                />
            )}
        </Dialog>
    );
}

function CardDetailBody({
    item,
    imageId,
    placements,
    history,
    onRemove,
}: Omit<CardDetailDialogProps, 'item' | 'onClose'> & {
    item: CollectionItem;
}) {
    const confirm = useDialogState();
    const [moving, setMoving] = useState(false);
    const { width, height } = CARD_IMAGE_DIMENSIONS.normal;
    const imageUrl = imageId ? cardImageUrl(imageId, 'normal') : null;

    return (
        <div className="space-y-4">
            {imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- Scryfall's CDN already serves right-sized images
                <img
                    src={imageUrl}
                    alt={item.name}
                    width={width}
                    height={height}
                    className="mx-auto h-auto w-64 max-w-full rounded-surface"
                />
            )}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-body">{item.quantity} owned</p>
                <div className="flex gap-2">
                    <Button
                        variant="secondary"
                        disabled={!placements || placements.length === 0}
                        onClick={() => setMoving(true)}
                    >
                        Move
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={() => confirm.show()}
                    >
                        Remove
                    </Button>
                </div>
            </div>
            {placements && placements.length > 0 && (
                <section aria-labelledby="card-where-heading">
                    <h3 id="card-where-heading" className="text-subheading">
                        Where it is
                    </h3>
                    <p className="text-body text-text-minimal">
                        {formatPlacements(placements)}
                    </p>
                </section>
            )}
            {history && history.length > 0 && (
                <section aria-labelledby="card-history-heading">
                    <h3 id="card-history-heading" className="text-subheading">
                        History
                    </h3>
                    <ol className="mt-1 space-y-1">
                        {history.map((entry) => (
                            <li
                                key={entry.id}
                                className="flex items-baseline justify-between gap-3 text-body"
                            >
                                <span className="min-w-0">
                                    {describeMove(entry)}
                                    {entry.note && (
                                        <span className="text-text-minimal">
                                            {' '}
                                            · {entry.note}
                                        </span>
                                    )}
                                </span>
                                <time
                                    dateTime={entry.createdAt}
                                    className="shrink-0 text-caption text-text-minimal"
                                >
                                    {formatMoveDate(entry.createdAt)}
                                </time>
                            </li>
                        ))}
                    </ol>
                </section>
            )}
            {moving && placements && (
                <MoveCardsDialog
                    oracleId={item.oracleId}
                    name={item.name}
                    sources={placements}
                    onClose={() => setMoving(false)}
                />
            )}
            <Dialog
                open={confirm.open}
                onClose={confirm.close}
                title="Remove this card?"
                primaryAction={
                    <Button
                        variant="destructive"
                        onClick={() => {
                            confirm.close();
                            onRemove(item);
                        }}
                    >
                        Remove card
                    </Button>
                }
                secondaryAction={
                    <Button variant="secondary" onClick={confirm.close}>
                        Cancel
                    </Button>
                }
            >
                <p className="text-body text-text-minimal">
                    {item.name} will be removed from your collection.
                </p>
            </Dialog>
        </div>
    );
}
