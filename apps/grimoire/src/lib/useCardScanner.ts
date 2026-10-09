// Everything behind the scan screen: the camera, snapping a frame, reading it,
// and the auto-capture loop. The component only renders what this returns.

import { useCallback, useEffect, useRef, useState } from 'react';
import {
    AUTO_CAPTURE,
    createDetector,
    toGray,
    type Detector,
    type Reading,
} from '@/lib/autoCapture';
import { CAPTURE_MAX_EDGE, CAPTURE_QUALITY, fitWithin } from '@/lib/capture';
import {
    matchReadName,
    type CardEntry,
    type CardIndex,
} from '@/lib/cardSearch';
import { useAddCard, useIdentify } from '@/lib/queries';

export type Phase = 'idle' | 'starting' | 'live' | 'reading' | 'result';

export interface Outcome {
    /** What the model read off the card, or null if it could not read one. */
    read: string | null;
    /** Cards in the list that match it, best first. */
    matches: CardEntry[];
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

export function useCardScanner(index: CardIndex | null) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [phase, setPhase] = useState<Phase>('idle');
    const [outcome, setOutcome] = useState<Outcome | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [auto, setAuto] = useState(false);
    const [debug, setDebug] = useState(false);
    const [reading, setReading] = useState<Reading | null>(null);
    const detectorRef = useRef<Detector | null>(null);
    const sampleRef = useRef<{
        canvas: HTMLCanvasElement;
        context: CanvasRenderingContext2D;
    } | null>(null);
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
        setAuto(false);
        setReading(null);
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
        // Whatever is in front of the camera now is being handled; don't recapture it.
        detectorRef.current?.hold();
        identify.mutate(blob, {
            onSuccess: ({ name }) => {
                setOutcome({
                    read: name,
                    matches: name && index ? matchReadName(index, name) : [],
                });
                setPhase('result');
            },
            onError: (error) => {
                // A failing or capped scan must never turn into a retry loop.
                setAuto(false);
                setMessage(
                    auto
                        ? `${error.message} Auto-capture is off.`
                        : error.message
                );
                setPhase('live');
            },
        });
    }, [index, identify, auto]);

    // Latest snap for the sampling timer, which outlives any one render.
    const snapRef = useRef(snap);
    useEffect(() => {
        snapRef.current = snap;
    }, [snap]);

    const toggleAuto = useCallback(() => {
        // A fresh detector learns the empty background from the scene as it is now.
        detectorRef.current = createDetector();
        setReading(null);
        setAuto((on) => !on);
    }, []);

    const toggleDebug = useCallback(() => {
        setReading(null);
        setDebug((on) => !on);
    }, []);

    // While live and in auto mode, watch the video and snap when a card settles.
    useEffect(() => {
        if (!auto || phase !== 'live') return;
        detectorRef.current ??= createDetector();
        const timer = setInterval(() => {
            const video = videoRef.current;
            const detector = detectorRef.current;
            if (!video || !detector || video.videoWidth === 0) return;

            if (!sampleRef.current) {
                const canvas = document.createElement('canvas');
                canvas.width = AUTO_CAPTURE.sampleWidth;
                canvas.height = AUTO_CAPTURE.sampleHeight;
                const context = canvas.getContext('2d', {
                    willReadFrequently: true,
                });
                if (!context) return;
                sampleRef.current = { canvas, context };
            }
            const { canvas, context } = sampleRef.current;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const { data } = context.getImageData(
                0,
                0,
                canvas.width,
                canvas.height
            );
            const result = detector.step(toGray(data), performance.now());
            if (debug) setReading(result);
            if (result.capture) void snapRef.current();
        }, AUTO_CAPTURE.sampleIntervalMs);
        return () => clearInterval(timer);
    }, [auto, phase, debug]);

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

    return {
        videoRef,
        phase,
        outcome,
        message,
        auto,
        debug,
        reading,
        adding: addCard.isPending,
        startCamera,
        closeCamera,
        snap,
        toggleAuto,
        toggleDebug,
        confirmAdd,
        dismiss,
    };
}
