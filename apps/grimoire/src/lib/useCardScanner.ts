// Everything behind the scan screen: the camera and the auto-capture loop. A
// captured frame goes straight into the scan queue; the background worker reads
// it. The component only renders what this returns.

import { useCallback, useEffect, useRef, useState } from 'react';
import {
    AUTO_CAPTURE,
    createDetector,
    toGray,
    type AutoCaptureConfig,
    type Detector,
    type Reading,
} from '@/lib/autoCapture';
import {
    defaultTuning,
    loadTuning,
    saveTuning,
    type Tuning,
    type TuningKey,
} from '@/lib/autoCaptureTuning';
import {
    CAPTURE_MAX_EDGE,
    CAPTURE_QUALITY,
    THUMBNAIL_MAX_EDGE,
    THUMBNAIL_QUALITY,
    fitWithin,
} from '@/lib/capture';
import { putBlobs } from '@/lib/scanQueueBlobs';
import { requestPersistentStorage } from '@/lib/scanQueueStore';
import type { QueueItemStatus } from '@/lib/scanQueueTypes';
import { newlyAttentionIds, statusSnapshot } from '@/lib/scanSession';
import { useScanFeedback } from '@/lib/useScanFeedback';
import { useScanQueue } from '@/lib/useScanQueue';

export type Phase = 'idle' | 'starting' | 'live';

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

function toJpeg(canvas: HTMLCanvasElement, quality: number) {
    return new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', quality)
    );
}

export function useCardScanner(userId: string) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [phase, setPhase] = useState<Phase>('idle');
    const [message, setMessage] = useState<string | null>(null);
    // Set by the first Start and kept, so the queue keeps draining after the
    // camera closes.
    const [workerOn, setWorkerOn] = useState(false);
    const [debug, setDebug] = useState(false);
    const [reading, setReading] = useState<Reading | null>(null);
    // TEMPORARY: live-tunable stillness values (see autoCaptureTuning.ts). The
    // detector reads this object on every step, so edits apply without a restart.
    const [tuning, setTuning] = useState<Tuning>(loadTuning);
    const configRef = useRef<AutoCaptureConfig>({
        ...AUTO_CAPTURE,
        ...tuning,
    });
    const detectorRef = useRef<Detector | null>(null);
    const sampleRef = useRef<{
        canvas: HTMLCanvasElement;
        context: CanvasRenderingContext2D;
    } | null>(null);
    const { items, ready, store } = useScanQueue(userId);
    const feedback = useScanFeedback();
    const { start: startFeedback, stop: stopFeedback } = feedback;
    const { notifyCaptured, notifyAttention } = feedback;

    const stopCamera = useCallback(() => {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        if (videoRef.current) videoRef.current.srcObject = null;
    }, []);

    // Release the camera when leaving the page.
    useEffect(() => stopCamera, [stopCamera]);

    const startCamera = useCallback(async () => {
        setMessage(null);
        if (!navigator.mediaDevices?.getUserMedia) {
            setMessage('The camera needs a secure (HTTPS) connection.');
            return;
        }
        setPhase('starting');
        // Inside the tap: unlocks audio and takes the wake lock.
        void startFeedback();
        void requestPersistentStorage();
        setWorkerOn(true);
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
            // A fresh detector learns the empty background from the scene as it is now.
            detectorRef.current = createDetector(configRef.current);
            setReading(null);
            setPhase('live');
        } catch (error) {
            stopCamera();
            stopFeedback();
            setMessage(cameraProblem(error));
            setPhase('idle');
        }
    }, [stopCamera, startFeedback, stopFeedback]);

    const closeCamera = useCallback(() => {
        stopCamera();
        stopFeedback();
        setReading(null);
        setMessage(null);
        setPhase('idle');
    }, [stopCamera, stopFeedback]);

    const capture = useCallback(async () => {
        const video = videoRef.current;
        if (!video || video.videoWidth === 0) return;
        // Whatever is in front of the camera now is handled; don't recapture it.
        detectorRef.current?.hold();

        const { width, height } = fitWithin(
            video.videoWidth,
            video.videoHeight,
            CAPTURE_MAX_EDGE
        );
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d')?.drawImage(video, 0, 0, width, height);

        const thumbSize = fitWithin(width, height, THUMBNAIL_MAX_EDGE);
        const thumbCanvas = document.createElement('canvas');
        thumbCanvas.width = thumbSize.width;
        thumbCanvas.height = thumbSize.height;
        thumbCanvas
            .getContext('2d')
            ?.drawImage(canvas, 0, 0, thumbSize.width, thumbSize.height);

        const [image, thumbnail] = await Promise.all([
            toJpeg(canvas, CAPTURE_QUALITY),
            toJpeg(thumbCanvas, THUMBNAIL_QUALITY),
        ]);
        if (!image) {
            setMessage('Could not capture that frame.');
            return;
        }
        const id = crypto.randomUUID();
        try {
            // Blobs first, so the worker never sees an item with no image.
            await putBlobs(id, { image, ...(thumbnail ? { thumbnail } : {}) });
        } catch {
            setMessage('Could not save that capture on this device.');
            return;
        }
        store.getState().add({ id });
        setMessage(null);
        notifyCaptured();
    }, [store, notifyCaptured]);

    // Latest capture for the sampling timer, which outlives any one render.
    const captureRef = useRef(capture);
    useEffect(() => {
        captureRef.current = capture;
    }, [capture]);

    const applyTuning = useCallback((next: Tuning) => {
        Object.assign(configRef.current, next);
        setTuning(next);
        saveTuning(next);
    }, []);

    const changeTuning = useCallback(
        (key: TuningKey, value: number) =>
            applyTuning({ ...tuning, [key]: value }),
        [applyTuning, tuning]
    );

    const resetTuning = useCallback(
        () => applyTuning(defaultTuning()),
        [applyTuning]
    );

    const toggleDebug = useCallback(() => {
        setReading(null);
        setDebug((on) => !on);
    }, []);

    // While the camera is live, watch the video and capture when a card settles.
    useEffect(() => {
        if (phase !== 'live') return;
        detectorRef.current ??= createDetector(configRef.current);
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
            if (result.capture) void captureRef.current();
        }, tuning.sampleIntervalMs);
        return () => clearInterval(timer);
    }, [phase, debug, tuning.sampleIntervalMs]);

    // Play the attention tone once when an item becomes flagged or failed.
    const seenRef = useRef<ReadonlyMap<string, QueueItemStatus> | null>(null);
    useEffect(() => {
        if (phase !== 'live' || !ready) {
            seenRef.current = null;
            return;
        }
        // The first look is the baseline: older items already had their say.
        if (
            seenRef.current &&
            newlyAttentionIds(seenRef.current, items).length > 0
        ) {
            notifyAttention();
        }
        seenRef.current = statusSnapshot(items);
    }, [phase, ready, items, notifyAttention]);

    return {
        videoRef,
        phase,
        message,
        debug,
        reading,
        tuning,
        changeTuning,
        resetTuning,
        items,
        workerOn,
        startCamera,
        closeCamera,
        toggleDebug,
    };
}
