'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { buttonClasses, secondaryButtonClasses } from '@/components/styles';
import TuningPanel from '@/components/TuningPanel';
import { AUTO_CAPTURE } from '@/lib/autoCapture';
import { summarizeQueue } from '@/lib/scanSession';
import { useCardScanner } from '@/lib/useCardScanner';
import { useScanQueueWorker } from '@/lib/useScanQueueWorker';

/** Runs the background worker while mounted; renders nothing. */
function QueueWorker({ userId }: { userId: string }) {
    useScanQueueWorker(userId);
    return null;
}

/** Hold a card, hear the chime, swap it. Captures go to the queue for review. */
export default function ScanCard({ userId }: { userId: string }) {
    const {
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
    } = useCardScanner(userId);

    const [tuningOpen, setTuningOpen] = useState(false);
    const cameraOn = phase === 'live';
    const summary = useMemo(() => summarizeQueue(items), [items]);

    return (
        <div className="space-y-3">
            {workerOn && <QueueWorker userId={userId} />}

            {phase === 'idle' || phase === 'starting' ? (
                <button
                    type="button"
                    onClick={() => void startCamera()}
                    disabled={phase === 'starting'}
                    className={buttonClasses}
                >
                    {phase === 'starting' ? 'Starting camera...' : 'Start'}
                </button>
            ) : null}

            {/* Always mounted so the stream can attach; hidden until the camera is on. */}
            <div className={cameraOn ? 'relative' : 'hidden'}>
                <video
                    ref={videoRef}
                    playsInline
                    muted
                    aria-label="Camera view"
                    className="aspect-[4/3] w-full rounded-lg bg-neutral-950 object-cover"
                />
                {debug && reading && (
                    <dl
                        className="absolute bottom-2 left-2 space-y-0.5 rounded-lg bg-neutral-950/80 p-2 font-mono text-caption text-neutral-100"
                        aria-label="Auto-capture readings"
                    >
                        <div>state: {reading.state}</div>
                        <div>
                            card in frame:{' '}
                            {(reading.vsBackground * 100).toFixed(0)}% (needs{' '}
                            {(AUTO_CAPTURE.presentFraction * 100).toFixed(0)}%)
                        </div>
                        <div>
                            motion: {(reading.vsPrevious * 100).toFixed(1)}%
                            (still at or under{' '}
                            {(tuning.stillFraction * 100).toFixed(0)}%)
                        </div>
                        <div>
                            still: {reading.stillForMs}/{tuning.stableMs} ms
                        </div>
                        <div>
                            empty: {reading.emptyForMs}/{AUTO_CAPTURE.emptyMs}{' '}
                            ms
                        </div>
                    </dl>
                )}
            </div>

            {cameraOn && (
                <p className="text-caption text-text-minimal">
                    Start with nothing in frame, then hold each card still, flat
                    and filling the frame. A chime means it was captured; take
                    it away before the next one. A low double tone means a card
                    needs your attention.
                </p>
            )}

            {workerOn && (
                <p
                    className="flex flex-wrap items-center gap-x-4 gap-y-1 text-body"
                    aria-label="Scan progress"
                    aria-live="off"
                >
                    <span>{summary.captured} captured</span>
                    <span>{summary.identified} identified</span>
                    <span>{summary.flagged} flagged</span>
                    <span>{summary.failed} failed</span>
                    <Link href="/queue" className="font-medium underline">
                        Review queue
                    </Link>
                </p>
            )}

            {cameraOn && (
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={toggleDebug}
                        aria-pressed={debug}
                        className={secondaryButtonClasses}
                    >
                        Debug
                    </button>
                    <button
                        type="button"
                        onClick={() => setTuningOpen((on) => !on)}
                        aria-pressed={tuningOpen}
                        className={secondaryButtonClasses}
                    >
                        Tune
                    </button>
                    <button
                        type="button"
                        onClick={closeCamera}
                        className={secondaryButtonClasses}
                    >
                        Close camera
                    </button>
                </div>
            )}

            {cameraOn && tuningOpen && (
                <TuningPanel
                    tuning={tuning}
                    onChange={changeTuning}
                    onReset={resetTuning}
                />
            )}

            <p role="alert" aria-live="polite" className="text-body text-error">
                {message}
            </p>
        </div>
    );
}
