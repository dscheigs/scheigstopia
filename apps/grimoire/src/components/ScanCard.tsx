'use client';

import { buttonClasses, secondaryButtonClasses } from '@/components/styles';
import type { CardIndex } from '@/lib/card-search';
import { AUTO_CAPTURE } from '@/lib/auto-capture';
import { useCardScanner } from '@/lib/useCardScanner';

interface Props {
    index: CardIndex | null;
}

/** Point the camera at one card, snap it, and add it once you confirm the match. */
export default function ScanCard({ index }: Props) {
    const {
        videoRef,
        phase,
        outcome,
        message,
        auto,
        debug,
        reading,
        adding,
        startCamera,
        closeCamera,
        snap,
        toggleAuto,
        toggleDebug,
        confirmAdd,
        dismiss,
    } = useCardScanner(index);

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
            <div className={cameraOn ? 'relative' : 'hidden'}>
                <video
                    ref={videoRef}
                    playsInline
                    muted
                    aria-label="Camera view"
                    className="aspect-[4/3] w-full rounded-lg bg-neutral-950 object-cover"
                />
                {auto && debug && reading && (
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
                            {(AUTO_CAPTURE.stillFraction * 100).toFixed(0)}%)
                        </div>
                        <div>
                            still: {reading.stillForMs}/{AUTO_CAPTURE.stableMs}{' '}
                            ms
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
                    {auto
                        ? 'Auto-capture is on. Start with nothing in frame, then hold each card still, flat and filling the frame. Take it away before the next one.'
                        : 'Hold one card flat, fill the frame, and keep the title sharp.'}
                </p>
            )}

            {(phase === 'live' || phase === 'reading') && (
                <div className="flex flex-wrap gap-2">
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
                        onClick={toggleAuto}
                        disabled={phase === 'reading'}
                        aria-pressed={auto}
                        className={secondaryButtonClasses}
                    >
                        {auto ? 'Auto-capture: on' : 'Auto-capture: off'}
                    </button>
                    {auto && (
                        <button
                            type="button"
                            onClick={toggleDebug}
                            aria-pressed={debug}
                            className={secondaryButtonClasses}
                        >
                            Debug
                        </button>
                    )}
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
                                    disabled={adding}
                                    className={buttonClasses}
                                >
                                    Add to collection
                                </button>
                                <button
                                    type="button"
                                    onClick={dismiss}
                                    disabled={adding}
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
                                                    disabled={adding}
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
