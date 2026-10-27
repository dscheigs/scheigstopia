'use client';

import { useEffect, useRef, useState } from 'react';
import { Button, X } from '@scheigs/sylva-ui';
import {
    CARD_IMAGE_DIMENSIONS,
    cardImageUrl,
    preloadCardImage,
} from '@/lib/cardImages';
import { getBlobs, pickReviewBlob } from '@/lib/scanQueueBlobs';
import { useModalDialog } from '@/lib/useModalDialog';

/**
 * Full-screen viewer on the native dialog element; mount it while open. It
 * shows the user's photo, and the matched catalog card beside it when there is
 * one, so a wrong read is obvious at a glance.
 */
function ReviewViewer({
    photoUrl,
    cardUrl,
    label,
    onClose,
}: {
    photoUrl: string | null;
    cardUrl: string | null;
    label: string;
    onClose: () => void;
}) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const handleClose = useModalDialog(dialogRef, onClose);
    const comparing = photoUrl !== null && cardUrl !== null;
    const { width, height } = CARD_IMAGE_DIMENSIONS.normal;
    const imageClasses = 'min-h-0 w-full flex-1 object-contain';
    const figureClasses =
        'flex h-full min-h-0 min-w-0 flex-1 flex-col items-center gap-2';

    return (
        <dialog
            ref={dialogRef}
            aria-label={comparing ? `Compare ${label}` : `Photo of ${label}`}
            onClose={handleClose}
            onClick={onClose}
            className="m-0 h-dvh max-h-none w-dvw max-w-none bg-neutral-950/90 p-0 backdrop:bg-neutral-950/90"
        >
            <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-4 sm:flex-row">
                {cardUrl && (
                    <figure className={figureClasses}>
                        {/* eslint-disable-next-line @next/next/no-img-element -- Scryfall's CDN already serves right-sized images */}
                        <img
                            src={cardUrl}
                            alt={`${label} (matched card)`}
                            width={width}
                            height={height}
                            className={`${imageClasses} rounded-surface`}
                        />
                        {comparing && (
                            <figcaption className="text-caption text-neutral-50">
                                Matched card
                            </figcaption>
                        )}
                    </figure>
                )}
                {photoUrl && (
                    <figure className={figureClasses}>
                        {/* eslint-disable-next-line @next/next/no-img-element -- a local blob URL */}
                        <img
                            src={photoUrl}
                            alt={`Photo of ${label}`}
                            className={imageClasses}
                        />
                        {comparing && (
                            <figcaption className="text-caption text-neutral-50">
                                Your photo
                            </figcaption>
                        )}
                    </figure>
                )}
            </div>
            <Button
                onClick={onClose}
                aria-label={comparing ? 'Close comparison' : 'Close photo'}
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
 * The row image. By default it is the catalog card the scan matched (the thing
 * being added), so a wrong read stands out; tapping it opens a full-screen view
 * of that card beside the user's own photo. With no catalog image (no match, an
 * older card list, an unknown id) it is the photo, as before.
 */
export default function ReviewThumbnail({
    id,
    label,
    imageId,
}: {
    id: string;
    label: string;
    /** Scryfall image id of the matched card, if the card list has one. */
    imageId?: string;
}) {
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        let objectUrl: string | null = null;
        let cancelled = false;
        void getBlobs(id).then((blobs) => {
            const blob = pickReviewBlob(blobs);
            if (cancelled || !blob) return;
            objectUrl = URL.createObjectURL(blob);
            setPhotoUrl(objectUrl);
        });
        return () => {
            cancelled = true;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [id]);

    const thumbUrl = imageId ? cardImageUrl(imageId, 'small') : null;
    const largeUrl = imageId ? cardImageUrl(imageId, 'normal') : null;
    const showingCard = thumbUrl !== null;
    const shownUrl = thumbUrl ?? photoUrl;

    // Same footprint whichever image it shows, so rows don't shift.
    const frame =
        'h-16 w-12 shrink-0 overflow-hidden rounded-thumb border border-border-minimal bg-surface-minimal-hover';
    const preload = () => {
        if (imageId) preloadCardImage(imageId);
    };

    if (!shownUrl) return <div className={frame} />;

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                onPointerEnter={preload}
                onPointerDown={preload}
                onFocus={preload}
                aria-label={
                    showingCard
                        ? `Compare ${label} with your photo`
                        : `View photo of ${label}`
                }
                className={`${frame} relative before:absolute before:-inset-1 before:content-['']`}
            >
                {/* eslint-disable-next-line @next/next/no-img-element -- Scryfall's CDN or a local blob URL */}
                <img
                    src={shownUrl}
                    alt=""
                    {...(showingCard
                        ? {
                              width: CARD_IMAGE_DIMENSIONS.small.width,
                              height: CARD_IMAGE_DIMENSIONS.small.height,
                          }
                        : {})}
                    className="h-full w-full object-cover"
                />
            </button>
            {open && (
                <ReviewViewer
                    photoUrl={photoUrl}
                    cardUrl={largeUrl}
                    label={label}
                    onClose={() => setOpen(false)}
                />
            )}
        </>
    );
}
