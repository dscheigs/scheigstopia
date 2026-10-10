'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { secondaryButtonClasses } from '@/components/styles';
import { getBlobs, pickReviewBlob } from '@/lib/scanQueueBlobs';

/** Full-screen viewer on the native dialog element; mount it while open. */
function ReviewViewer({
    url,
    label,
    onClose,
}: {
    url: string;
    label: string;
    onClose: () => void;
}) {
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (dialog && !dialog.open) dialog.showModal();
        return () => dialog?.close();
    }, []);

    return (
        <dialog
            ref={dialogRef}
            aria-label={`Photo of ${label}`}
            onClose={onClose}
            onClick={onClose}
            className="m-0 h-dvh max-h-none w-dvw max-w-none bg-neutral-950/90 p-0 backdrop:bg-neutral-950/90"
        >
            <div className="flex h-full w-full items-center justify-center p-4">
                {/* eslint-disable-next-line @next/next/no-img-element -- a local blob URL */}
                <img
                    src={url}
                    alt={`Photo of ${label}`}
                    className="max-h-full max-w-full object-contain"
                />
            </div>
            <button
                type="button"
                onClick={onClose}
                aria-label="Close photo"
                className={`${secondaryButtonClasses} absolute right-4 top-4 min-w-11 bg-surface-minimal px-0`}
            >
                <X aria-hidden="true" />
            </button>
        </dialog>
    );
}

/** The row image. Tapping it opens the larger view. */
export default function ReviewThumbnail({
    id,
    label,
}: {
    id: string;
    label: string;
}) {
    const [url, setUrl] = useState<string | null>(null);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        let objectUrl: string | null = null;
        let cancelled = false;
        void getBlobs(id).then((blobs) => {
            const blob = pickReviewBlob(blobs);
            if (cancelled || !blob) return;
            objectUrl = URL.createObjectURL(blob);
            setUrl(objectUrl);
        });
        return () => {
            cancelled = true;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [id]);

    const frame =
        'h-16 w-12 shrink-0 overflow-hidden rounded-md border border-border-minimal bg-surface-minimal-hover';

    return (
        <>
            {url ? (
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    aria-label={`View photo of ${label}`}
                    className={`${frame} relative before:absolute before:-inset-1 before:content-['']`}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element -- a local blob URL */}
                    <img
                        src={url}
                        alt=""
                        className="h-full w-full object-cover"
                    />
                </button>
            ) : (
                <div className={frame} />
            )}
            {open && url && (
                <ReviewViewer
                    url={url}
                    label={label}
                    onClose={() => setOpen(false)}
                />
            )}
        </>
    );
}
