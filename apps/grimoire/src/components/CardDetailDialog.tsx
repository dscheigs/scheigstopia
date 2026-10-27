'use client';

import {
    Button,
    Dialog,
    QuantityStepper,
    useDialogState,
} from '@scheigs/sylva-ui';
import { CARD_IMAGE_DIMENSIONS, cardImageUrl } from '@/lib/cardImages';
import type { CollectionItem } from '@/lib/collection';
import { useDebouncedQuantity } from '@/lib/useDebouncedQuantity';

type CardDetailDialogProps = {
    /** The card to show, or undefined to keep the sheet closed. */
    item: CollectionItem | undefined;
    /** Scryfall image id for the card, if the card list has loaded. */
    imageId: string | undefined;
    /**
     * Saves a quantity and rejects with a displayable message if it fails.
     * The sheet debounces: it is called once, with the final count.
     */
    onSaveQuantity: (
        item: CollectionItem,
        quantity: number
    ) => Promise<unknown>;
    onRemove: (item: CollectionItem) => void;
    onClose: () => void;
};

/**
 * What a collection row opens: the large card image, the quantity stepper and
 * Remove, in a bottom sheet on a phone and a centered dialog on desktop. It
 * shows whatever `item` it is given on each render and a removed card (item
 * undefined) closes it. The count changes at once on every click and is saved
 * once, after the user stops (see `useDebouncedQuantity`). Remove asks first,
 * in a second dialog stacked on top of the sheet.
 */
export default function CardDetailDialog({
    item,
    imageId,
    onSaveQuantity,
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
                    onSaveQuantity={onSaveQuantity}
                    onRemove={onRemove}
                />
            )}
        </Dialog>
    );
}

function CardDetailBody({
    item,
    imageId,
    onSaveQuantity,
    onRemove,
}: Omit<CardDetailDialogProps, 'item' | 'onClose'> & {
    item: CollectionItem;
}) {
    const confirm = useDialogState();
    const counter = useDebouncedQuantity({
        saved: item.quantity,
        save: (quantity) => onSaveQuantity(item, quantity),
    });
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
            {/* items-start: the stepper has a status line under its buttons, and centering would push Remove down to the middle of both. */}
            <div className="flex flex-wrap items-start justify-between gap-3">
                <QuantityStepper
                    value={counter.quantity}
                    onChange={counter.setQuantity}
                    min={1}
                    editable
                    pending={counter.pending}
                    error={counter.error}
                    decrementLabel={`Remove one ${item.name}`}
                    incrementLabel={`Add one ${item.name}`}
                    valueLabel={`${counter.quantity} owned`}
                />
                {/* Not while a save is pending: it could land after the remove. */}
                <Button
                    variant="destructive"
                    disabled={counter.pending}
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
                            counter.cancel();
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
