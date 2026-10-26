'use client';

import {
    Button,
    Dialog,
    QuantityStepper,
    useDialogState,
} from '@scheigs/sylva-ui';
import { CARD_IMAGE_DIMENSIONS, cardImageUrl } from '@/lib/cardImages';
import type { CollectionItem } from '@/lib/collection';

type CardDetailDialogProps = {
    /** The card to show, or undefined to keep the sheet closed. */
    item: CollectionItem | undefined;
    /** Scryfall image id for the card, if the card list has loaded. */
    imageId: string | undefined;
    /** True while this card's quantity is being saved. */
    busy: boolean;
    onSetQuantity: (item: CollectionItem, quantity: number) => void;
    onRemove: (item: CollectionItem) => void;
    onClose: () => void;
};

/**
 * What a collection row opens: the large card image, the quantity stepper and
 * Remove, in a bottom sheet on a phone and a centered dialog on desktop. It
 * shows whatever `item` it is given on each render, so a quantity change
 * appears at once and a removed card (item undefined) closes it. Remove asks
 * first, in a second dialog stacked on top of the sheet.
 */
export default function CardDetailDialog({
    item,
    imageId,
    busy,
    onSetQuantity,
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
                    busy={busy}
                    onSetQuantity={onSetQuantity}
                    onRemove={onRemove}
                />
            )}
        </Dialog>
    );
}

function CardDetailBody({
    item,
    imageId,
    busy,
    onSetQuantity,
    onRemove,
}: Omit<CardDetailDialogProps, 'item' | 'onClose'> & {
    item: CollectionItem;
}) {
    const confirm = useDialogState();
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
                <QuantityStepper
                    value={item.quantity}
                    onChange={(next) => onSetQuantity(item, next)}
                    min={1}
                    disabled={busy}
                    editable
                    decrementLabel={`Remove one ${item.name}`}
                    incrementLabel={`Add one ${item.name}`}
                    valueLabel={`${item.quantity} owned`}
                />
                <Button
                    variant="destructive"
                    disabled={busy}
                    onClick={() => confirm.show()}
                >
                    Remove
                </Button>
            </div>
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
