'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Button, Volume2, VolumeOff } from '@scheigs/sylva-ui';
import TuningPanel from '@/components/TuningPanel';
import { videoPlacement } from '@/lib/addRoutes';
import { AUTO_CAPTURE } from '@/lib/autoCapture';
import { sessionNotice } from '@/lib/sessionNotice';
import { summarizeQueue } from '@/lib/scanSession';
import { useCardScanner } from '@/lib/useCardScanner';
import { useScanQueueWorker } from '@/lib/useScanQueueWorker';

/**
 * Runs the background worker while mounted (the Add Cards layout, so it stops
 * when the user leaves /add). Renders the sign-in notice when it is paused.
 */
function QueueWorker({ userId }: { userId: string }) {
    const { sessionExpired } = useScanQueueWorker(userId);
    const notice = sessionNotice(sessionExpired);
    if (!notice) return null;
    return (
        <p
            role="alert"
            className="mx-auto max-w-2xl px-4 pt-3 text-body text-error"
        >
            {notice.message}{' '}
            <Link href={notice.href} className="underline">
                {notice.linkLabel}
            </Link>
        </p>
    );
}

const VIDEO_PLACEMENT_CLASSES = {
    inline: 'relative',
    // Off-screen but still rendered, so the stream keeps updating.
    offscreen:
        'pointer-events-none fixed left-0 top-0 w-full -translate-x-full',
    hidden: 'hidden',
} as const;

/** Hold a card, hear the chime, swap it. Captures go to the queue for review. */
export default function ScanCard({
    userId,
    showCamera,
}: {
    userId: string;
    /** False on the queue screen: the stream keeps running, off-screen. */
    showCamera: boolean;
}) {
    const {
        videoRef,
        phase,
        message,
        debug,
        reading,
        tuning,
        changeTuning,
        setShapeCheck,
        resetTuning,
        shapeStatus,
        items,
        workerOn,
        muted,
        setMuted,
        startCamera,
        closeCamera,
        toggleDebug,
    } = useCardScanner(userId, showCamera);

    const [tuningOpen, setTuningOpen] = useState(false);
    const cameraOn = phase === 'live';
    const placement = videoPlacement(cameraOn, showCamera);
    const showControls = cameraOn && showCamera;
    const summary = useMemo(() => summarizeQueue(items), [items]);

    return (
        <div
            className={
                showCamera ? 'mx-auto max-w-2xl space-y-3 px-4 py-6' : undefined
            }
        >
            {workerOn && <QueueWorker userId={userId} />}

            {showCamera && (phase === 'idle' || phase === 'starting') ? (
                <Button
                    onClick={() => void startCamera()}
                    disabled={phase === 'starting'}
                    variant="primary"
                >
                    {phase === 'starting' ? 'Starting camera...' : 'Start'}
                </Button>
            ) : null}

            {/* Always mounted so the stream can attach; hidden until the camera is on. */}
            <div
                className={VIDEO_PLACEMENT_CLASSES[placement]}
                aria-hidden={placement === 'offscreen' ? true : undefined}
            >
                <video
                    ref={videoRef}
                    playsInline
                    muted
                    aria-label="Camera view"
                    className="aspect-[4/3] w-full rounded-surface bg-neutral-950 object-cover"
                />
                {showControls && tuning.shapeCheck && (
                    // The rectangle check needs all four card edges in view,
                    // so show where to hold the card. A guide, not a hard fit.
                    <div
                        aria-hidden="true"
                        data-testid="card-guide"
                        className="pointer-events-none absolute left-1/2 top-1/2 aspect-[63/88] h-5/6 -translate-x-1/2 -translate-y-1/2 rounded-surface border-2 border-dashed border-neutral-100/70"
                    />
                )}
                {showControls && (
                    <button
                        type="button"
                        onClick={() => setMuted(!muted)}
                        aria-pressed={muted}
                        aria-label="Mute sounds"
                        className="absolute right-2 top-2 inline-flex min-h-11 min-w-11 items-center justify-center rounded-control bg-neutral-950/80 text-neutral-100 transition-colors hover:bg-neutral-950"
                    >
                        {muted ? (
                            <VolumeOff aria-hidden="true" />
                        ) : (
                            <Volume2 aria-hidden="true" />
                        )}
                    </button>
                )}
                {showControls && debug && reading && (
                    <dl
                        className="absolute bottom-2 left-2 space-y-0.5 rounded-surface bg-neutral-950/80 p-2 font-mono text-caption text-neutral-100"
                        aria-label="Auto-capture readings"
                    >
                        <div>state: {reading.state}</div>
                        <div>
                            card in frame:{' '}
                            {(reading.vsBackground * 100).toFixed(0)}% (needs{' '}
                            {(tuning.presentFraction * 100).toFixed(0)}%)
                        </div>
                        <div>
                            motion: {(reading.vsPrevious * 100).toFixed(1)}%
                            (still at or under{' '}
                            {(tuning.stillFraction * 100).toFixed(0)}%)
                        </div>
                        <div>
                            still: {reading.stillForMs}/{tuning.stableMs} ms
                        </div>
                        {tuning.shapeCheck && (
                            <div>
                                rectangle:{' '}
                                {shapeStatus !== 'ready'
                                    ? shapeStatus
                                    : reading.shape === null
                                      ? 'not checked yet'
                                      : reading.shape.found
                                        ? 'found'
                                        : 'not found'}
                                {reading.shape?.aspect != null &&
                                    ` (aspect ${reading.shape.aspect.toFixed(2)}, card 1.40)`}
                            </div>
                        )}
                        <div>
                            empty: {reading.emptyForMs}/{AUTO_CAPTURE.emptyMs}{' '}
                            ms
                        </div>
                    </dl>
                )}
            </div>

            {showControls && (
                <p className="text-caption text-text-minimal">
                    Start with nothing in frame, then hold each card still, flat
                    and filling the frame. A chime means it was captured; take
                    it away before the next one. A low double tone means a card
                    needs your attention.
                    {tuning.shapeCheck &&
                        ' With the rectangle check on, fit the whole card, all four edges, inside the dashed outline.'}
                </p>
            )}

            {showCamera && workerOn && (
                <p
                    className="flex flex-wrap items-center gap-x-4 gap-y-1 text-body"
                    aria-label="Scan progress"
                    aria-live="off"
                >
                    <span>{summary.captured} captured</span>
                    <span>{summary.identified} identified</span>
                    <span>{summary.flagged} flagged</span>
                    <span>{summary.failed} failed</span>
                </p>
            )}

            {showControls && (
                <div className="flex flex-wrap gap-2">
                    <Button
                        onClick={toggleDebug}
                        aria-pressed={debug}
                        variant="secondary"
                    >
                        Debug
                    </Button>
                    <Button
                        onClick={() => setTuningOpen((on) => !on)}
                        aria-pressed={tuningOpen}
                        variant="secondary"
                    >
                        Tune
                    </Button>
                    <Button onClick={closeCamera} variant="secondary">
                        Close camera
                    </Button>
                </div>
            )}

            {showControls && tuningOpen && (
                <TuningPanel
                    tuning={tuning}
                    shapeStatus={shapeStatus}
                    onChange={changeTuning}
                    onShapeCheck={setShapeCheck}
                    onReset={resetTuning}
                />
            )}

            {showControls && tuning.shapeCheck && shapeStatus === 'failed' && (
                <p role="status" className="text-caption text-text-minimal">
                    The rectangle check could not load, so cards are captured on
                    motion alone.
                </p>
            )}

            {showCamera && (
                <p
                    role="alert"
                    aria-live="polite"
                    className="text-body text-error"
                >
                    {message}
                </p>
            )}
        </div>
    );
}
