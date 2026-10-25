'use client';

import { useRef, useState } from 'react';
import { Button, X } from '@scheigs/sylva-ui';
import {
    CARD_IMAGE_DIMENSIONS,
    cardImageUrl,
    preloadCardImage,
} from '@/lib/cardImages';
import { useModalDialog } from '@/lib/useModalDialog';

/** Full-screen preview on the native dialog element; mount it while open. */
function CardPreview({
    imageId,
    name,
    onClose,
}: {
    imageId: string;
    name: string;
    onClose: () => void;
}) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const handleClose = useModalDialog(dialogRef, onClose);
    const { width, height } = CARD_IMAGE_DIMENSIONS.normal;

    return (
        <dialog
            ref={dialogRef}
            aria-label={name}
            onClose={handleClose}
            onClick={onClose}
            className="m-0 h-dvh max-h-none w-dvw max-w-none bg-neutral-950/90 p-0 backdrop:bg-neutral-950/90"
        >
            <div className="flex h-full w-full items-center justify-center p-4">
                {/* eslint-disable-next-line @next/next/no-img-element -- Scryfall's CDN already serves right-sized images */}
                <img
                    src={cardImageUrl(imageId, 'normal') ?? undefined}
                    alt={name}
                    width={width}
                    height={height}
                    className="h-auto max-h-full w-auto max-w-full rounded-lg object-contain"
                />
            </div>
            <Button
                onClick={onClose}
                aria-label="Close preview"
                variant="secondary"
                className="absolute right-4 top-4 min-w-11 bg-surface-minimal px-0"
            >
                <X aria-hidden="true" />
            </Button>
        </dialog>
    );
}

/**
 * A card's small image for a list row. Hovering it (desktop) shows the larger
 * image beside it; tapping or clicking it (phones, keyboards) opens the same
 * image full screen. The larger image starts loading on the first pointer or
 * focus event, so it is usually ready by the time it is shown.
 */
export default function CardThumbnail({
    imageId,
    name,
}: {
    imageId: string | undefined;
    name: string;
}) {
    const [open, setOpen] = useState(false);
    const small = CARD_IMAGE_DIMENSIONS.small;
    const normal = CARD_IMAGE_DIMENSIONS.normal;
    const thumbUrl = imageId ? cardImageUrl(imageId, 'small') : null;

    // Same footprint with or without an image, so rows don't shift.
    const frame = 'h-14 w-10 shrink-0 rounded-sm';
    if (!imageId || !thumbUrl) {
        return (
            <span
                aria-hidden="true"
                className={`${frame} border border-border-minimal`}
            />
        );
    }

    const preload = () => preloadCardImage(imageId);

    return (
        <span className="group relative shrink-0">
            <button
                type="button"
                aria-label={`Show ${name}`}
                onPointerEnter={preload}
                onPointerDown={preload}
                onFocus={preload}
                onClick={() => setOpen(true)}
                className={`${frame} block cursor-zoom-in overflow-hidden`}
            >
                {/* eslint-disable-next-line @next/next/no-img-element -- Scryfall's CDN already serves right-sized images */}
                <img
                    src={thumbUrl}
                    alt=""
                    width={small.width}
                    height={small.height}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                />
            </button>
            {/* Hover only: hover: never matches on touch screens. */}
            <span
                aria-hidden="true"
                className="pointer-events-none absolute left-full top-0 z-20 ml-3 hidden w-64 group-hover:block"
            >
                {/* eslint-disable-next-line @next/next/no-img-element -- Scryfall's CDN already serves right-sized images */}
                <img
                    src={cardImageUrl(imageId, 'normal') ?? undefined}
                    alt=""
                    width={normal.width}
                    height={normal.height}
                    loading="lazy"
                    className="h-auto w-full rounded-lg shadow-lg"
                />
            </span>
            {open && (
                <CardPreview
                    imageId={imageId}
                    name={name}
                    onClose={() => setOpen(false)}
                />
            )}
        </span>
    );
}
