'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
                    className="h-auto max-h-full w-auto max-w-full rounded-surface object-contain"
                />
            </div>
            <Button
                onClick={onClose}
                aria-label="Close preview"
                variant="secondary"
                size="icon"
                className="absolute right-4 top-4 bg-surface-minimal"
            >
                <X aria-hidden="true" />
            </Button>
        </dialog>
    );
}

/**
 * The hover preview, in a portal on `document.body` so no row, stacking
 * context or `overflow-hidden` in the list can cover or clip it. It sits
 * to the right of the thumbnail (`anchor`), flips to the left when there is no
 * room, and is clamped so the whole card stays in the viewport. The padding
 * around the image is the gap to the thumbnail and to the screen edge.
 */
function HoverPreview({
    imageId,
    anchor,
}: {
    imageId: string;
    anchor: DOMRect;
}) {
    const ref = useRef<HTMLSpanElement>(null);
    const [position, setPosition] = useState<{
        left: number;
        top: number;
    } | null>(null);
    const normal = CARD_IMAGE_DIMENSIONS.normal;

    useLayoutEffect(() => {
        const box = ref.current?.getBoundingClientRect();
        if (!box) return;
        const { innerWidth, innerHeight } = window;
        let left = anchor.right;
        if (left + box.width > innerWidth) left = anchor.left - box.width;
        left = Math.max(0, Math.min(left, innerWidth - box.width));
        const top = Math.max(0, Math.min(anchor.top, innerHeight - box.height));
        setPosition({ left, top });
    }, [anchor]);

    return createPortal(
        <span
            ref={ref}
            aria-hidden="true"
            data-card-preview=""
            className={`pointer-events-none fixed z-50 block p-3 ${
                position ? '' : 'invisible'
            }`}
            style={{ left: position?.left ?? 0, top: position?.top ?? 0 }}
        >
            {/* eslint-disable-next-line @next/next/no-img-element -- Scryfall's CDN already serves right-sized images */}
            <img
                src={cardImageUrl(imageId, 'normal') ?? undefined}
                alt=""
                width={normal.width}
                height={normal.height}
                className="h-auto w-64 rounded-surface shadow-lg"
            />
        </span>,
        document.body
    );
}

/**
 * A card's small image for a list row. Hovering it (desktop) shows the larger
 * image beside it, in a portal; tapping or clicking it (phones, keyboards) opens the same
 * image full screen. The larger image starts loading on the first pointer or
 * focus event, so it is usually ready by the time it is shown.
 *
 * With `interactive={false}` it is only a picture (plus the hover preview), for
 * use inside a button, which cannot hold another button.
 */
export default function CardThumbnail({
    imageId,
    name,
    interactive = true,
}: {
    imageId: string | undefined;
    name: string;
    interactive?: boolean;
}) {
    const [open, setOpen] = useState(false);
    // The thumbnail's box while the mouse is over it; null otherwise.
    const [hoverAnchor, setHoverAnchor] = useState<DOMRect | null>(null);
    const wrapperRef = useRef<HTMLSpanElement>(null);
    const small = CARD_IMAGE_DIMENSIONS.small;
    const normal = CARD_IMAGE_DIMENSIONS.normal;
    const thumbUrl = imageId ? cardImageUrl(imageId, 'small') : null;

    // The preview is fixed to the screen, so it would be left behind by a scroll.
    const hovering = hoverAnchor !== null;
    useEffect(() => {
        if (!hovering) return;
        const hide = () => setHoverAnchor(null);
        window.addEventListener('scroll', hide, true);
        return () => window.removeEventListener('scroll', hide, true);
    }, [hovering]);

    // Same footprint with or without an image, so rows don't shift.
    const frame = 'h-14 w-10 shrink-0 rounded-thumb';
    if (!imageId || !thumbUrl) {
        return (
            <span
                aria-hidden="true"
                className={`${frame} border border-border-minimal`}
            />
        );
    }

    const preload = () => preloadCardImage(imageId);
    // Mouse only: a finger has no hover, and its tap must not leave a preview.
    const showPreview = (event: React.PointerEvent) => {
        if (event.pointerType !== 'mouse') return;
        const box = wrapperRef.current?.getBoundingClientRect();
        if (box) setHoverAnchor(box);
    };
    const hidePreview = () => setHoverAnchor(null);

    // eslint-disable-next-line @next/next/no-img-element -- Scryfall's CDN already serves right-sized images
    const image = (
        <img
            src={thumbUrl}
            alt=""
            width={small.width}
            height={small.height}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
        />
    );

    return (
        <span
            ref={wrapperRef}
            className="shrink-0"
            onPointerEnter={showPreview}
            onPointerLeave={hidePreview}
        >
            {interactive ? (
                <button
                    type="button"
                    aria-label={`Show ${name}`}
                    onPointerEnter={preload}
                    onPointerDown={preload}
                    onFocus={preload}
                    onClick={() => setOpen(true)}
                    className={`${frame} block cursor-zoom-in overflow-hidden`}
                >
                    {image}
                </button>
            ) : (
                <span
                    onPointerEnter={preload}
                    onPointerDown={preload}
                    className={`${frame} block overflow-hidden`}
                >
                    {image}
                </span>
            )}
            {hoverAnchor && (
                <HoverPreview imageId={imageId} anchor={hoverAnchor} />
            )}
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
