'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { buttonClasses, secondaryButtonClasses } from '@/components/styles';
import {
    matchReadName,
    type CardEntry,
    type CardIndex,
} from '@/lib/card-search';
import { CAPTURE_MAX_EDGE, CAPTURE_QUALITY, fitWithin } from '@/lib/capture';
import { useAddCard, useIdentify } from '@/lib/queries';

type Phase = 'idle' | 'starting' | 'live' | 'reading' | 'result';

interface Outcome {
    /** What the model read off the card, or null if it could not read one. */
    read: string | null;
    /** Cards in the list that match it, best first. */
    matches: CardEntry[];
}

interface Props {
    index: CardIndex | null;
}

function cameraProblem(error: unknown): string {
    const name = error instanceof DOMException ? error.name : '';
    if (name === 'NotAllowedError' || name === 'SecurityError') {
        return 'Camera access was blocked. Allow it for this site in your browser settings, then try again.';
    }
    if (name === 'NotFoundError' || name === 'OverconstrainedError') {
        return 'No camera was found on this device.';
    }
    return 'Could not start the camera.';
}

/** Point the camera at one card, snap it, and add it once you confirm the match. */
export default function ScanCard({ index }: Props) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [phase, setPhase] = useState<Phase>('idle');
    const [outcome, setOutcome] = useState<Outcome | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const identify = useIdentify();
    const addCard = useAddCard();

    const stopCamera = useCallback(() => {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        if (videoRef.current) videoRef.current.srcObject = null;
    }, []);

    // Release the camera when leaving the page.
    useEffect(() => stopCamera, [stopCamera]);

    const startCamera = useCallback(async () => {
        setMessage(null);
        setOutcome(null);
        if (!navigator.mediaDevices?.getUserMedia) {
            setMessage('The camera needs a secure (HTTPS) connection.');
            return;
        }
        setPhase('starting');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: { ideal: 'environment' },
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                },
                audio: false,
            });
            streamRef.current = stream;
            const video = videoRef.current;
            if (video) {
                video.srcObject = stream;
                await video.play();
            }
            setPhase('live');
        } catch (error) {
            stopCamera();
            setMessage(cameraProblem(error));
            setPhase('idle');
        }
    }, [stopCamera]);

    const closeCamera = useCallback(() => {
        stopCamera();
        setOutcome(null);
        setMessage(null);
        setPhase('idle');
    }, [stopCamera]);

    const snap = useCallback(async () => {
        const video = videoRef.current;
        if (!video || video.videoWidth === 0) return;

        const { width, height } = fitWithin(
            video.videoWidth,
            video.videoHeight,
            CAPTURE_MAX_EDGE
        );
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d')?.drawImage(video, 0, 0, width, height);
        const blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, 'image/jpeg', CAPTURE_QUALITY)
        );
        if (!blob) {
            setMessage('Could not capture that frame. Try again.');
            return;
        }

        setMessage(null);
        setPhase('reading');
        identify.mutate(blob, {
            onSuccess: ({ name }) => {
                setOutcome({
                    read: name,
                    matches: name && index ? matchReadName(index, name) : [],
                });
                setPhase('result');
            },
            onError: (error) => {
                setMessage(error.message);
                setPhase('live');
            },
        });
    }, [index, identify]);

    // On failure the result stays up so you can retry.
    const confirmAdd = useCallback(
        (card: CardEntry) => {
            setMessage(null);
            addCard.mutate(card, {
                onSuccess: () => {
                    setOutcome(null);
                    setPhase('live');
                },
                onError: (error) => setMessage(error.message),
            });
        },
        [addCard]
    );

    const dismiss = useCallback(() => {
        setOutcome(null);
        setPhase('live');
    }, []);

    const cameraOn =
        phase === 'live' || phase === 'reading' || phase === 'result';
    const best = outcome?.matches[0];
    const others = outcome?.matches.slice(1) ?? [];

    return (
        <div className="space-y-3">
            {phase === 'idle' || phase === 'starting' ? (
                <button
                    type="button"
                    onClick={() => void startCamera()}
                    disabled={phase === 'starting' || index === null}
                    className={buttonClasses}
                >
                    {phase === 'starting'
                        ? 'Starting camera...'
                        : 'Scan a card'}
                </button>
            ) : null}

            {/* Always mounted so the stream can attach; hidden until the camera is on. */}
            <video
                ref={videoRef}
                playsInline
                muted
                aria-label="Camera view"
                className={
                    cameraOn
                        ? 'aspect-[4/3] w-full rounded-lg bg-neutral-950 object-cover'
                        : 'hidden'
                }
            />

            {cameraOn && (
                <p className="text-caption text-text-minimal">
                    Hold one card flat, fill the frame, and keep the title
                    sharp.
                </p>
            )}

            {(phase === 'live' || phase === 'reading') && (
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => void snap()}
                        disabled={phase === 'reading'}
                        className={buttonClasses}
                    >
                        {phase === 'reading' ? 'Reading...' : 'Snap'}
                    </button>
                    <button
                        type="button"
                        onClick={closeCamera}
                        disabled={phase === 'reading'}
                        className={secondaryButtonClasses}
                    >
                        Close camera
                    </button>
                </div>
            )}

            {phase === 'result' && outcome && (
                <div
                    className="space-y-3 rounded-lg border border-border-minimal bg-surface-minimal p-4"
                    aria-live="polite"
                >
                    {best ? (
                        <>
                            <p className="text-body">
                                Is this{' '}
                                <strong className="font-semibold">
                                    {best.name}
                                </strong>
                                ?
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => confirmAdd(best)}
                                    disabled={addCard.isPending}
                                    className={buttonClasses}
                                >
                                    Add to collection
                                </button>
                                <button
                                    type="button"
                                    onClick={dismiss}
                                    disabled={addCard.isPending}
                                    className={secondaryButtonClasses}
                                >
                                    Not it
                                </button>
                            </div>
                            {others.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-caption text-text-minimal">
                                        Or one of these:
                                    </p>
                                    <ul className="flex flex-wrap gap-2">
                                        {others.map((card) => (
                                            <li key={card.oracleId}>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        confirmAdd(card)
                                                    }
                                                    disabled={addCard.isPending}
                                                    className={
                                                        secondaryButtonClasses
                                                    }
                                                >
                                                    {card.name}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <p className="text-body">
                                {outcome.read
                                    ? `Read "${outcome.read}", but it isn't in the card list.`
                                    : "Couldn't read this. Try again in better light with the card filling the frame."}
                            </p>
                            <button
                                type="button"
                                onClick={dismiss}
                                className={buttonClasses}
                            >
                                Try again
                            </button>
                        </>
                    )}
                </div>
            )}

            <p role="alert" aria-live="polite" className="text-body text-error">
                {message}
            </p>
        </div>
    );
}
