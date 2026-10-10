// Decides when a card is in front of the camera, from tiny grayscale frames.
// No DOM in here: the component samples the video and feeds frames in, so the
// logic can be tested with synthetic frames. Every threshold is in AUTO_CAPTURE.

export interface AutoCaptureConfig {
    /** Size of the downscaled frame the detector looks at. */
    sampleWidth: number;
    sampleHeight: number;
    /** How often the component samples the video. */
    sampleIntervalMs: number;
    /** Gray levels (0-255) a pixel must change by to count as different. */
    pixelDelta: number;
    /** Share of pixels that differ from the empty background: a card is there. */
    presentFraction: number;
    /** Share of pixels that changed since the last frame: at or below is "still". */
    stillFraction: number;
    /** How long a card must sit still before it is captured. */
    stableMs: number;
    /** How long the frame must be empty before the next card is armed. */
    emptyMs: number;
    /** Minimum gap between captures, so a fast hand can't cause a burst. */
    minIntervalMs: number;
    /** How often the empty background is re-learned, to follow slow light changes. */
    backgroundRefreshMs: number;
    /** Share of pixels that differ from the last captured card: a new card. */
    swapFraction: number;
}

export const AUTO_CAPTURE: AutoCaptureConfig = {
    sampleWidth: 64,
    sampleHeight: 48,
    sampleIntervalMs: 100,
    pixelDelta: 25,
    presentFraction: 0.2,
    stillFraction: 0.05,
    stableMs: 500,
    emptyMs: 800,
    minIntervalMs: 2000,
    backgroundRefreshMs: 1000,
    swapFraction: 0.25,
};

/** Luma (0-255) of each pixel in RGBA data, one byte per pixel. */
export function toGray(rgba: ArrayLike<number>): Uint8Array {
    const gray = new Uint8Array(rgba.length / 4);
    for (let i = 0; i < gray.length; i++) {
        const o = i * 4;
        gray[i] = (rgba[o] * 77 + rgba[o + 1] * 150 + rgba[o + 2] * 29) >> 8;
    }
    return gray;
}

/** Share (0-1) of pixels whose gray level differs by more than `delta`. */
export function changedFraction(
    a: Uint8Array,
    b: Uint8Array,
    delta: number
): number {
    if (a.length === 0 || a.length !== b.length) return 0;
    let changed = 0;
    for (let i = 0; i < a.length; i++) {
        if (Math.abs(a[i] - b[i]) > delta) changed++;
    }
    return changed / a.length;
}

/**
 * armed: nothing is in frame (or a card is arriving); the next still card fires.
 * captured: a card was just captured; wait for it to leave or be replaced.
 */
export type DetectorState = 'armed' | 'captured';

export interface Reading {
    state: DetectorState;
    /** True on the one frame where a capture should be taken. */
    capture: boolean;
    /** Share of the frame that differs from the empty background. */
    vsBackground: number;
    /** Share of the frame that moved since the last sample. */
    vsPrevious: number;
    /** How long the card has been still, in ms (0 when not counting). */
    stillForMs: number;
    /** How long the frame has been empty, in ms (0 when not counting). */
    emptyForMs: number;
}

export interface Detector {
    step(gray: Uint8Array, nowMs: number): Reading;
    /**
     * Stop capturing until the scene changes. Call when a capture is being
     * handled, so the card still sitting there is not captured again.
     */
    hold(): void;
}

export function createDetector(
    config: AutoCaptureConfig = AUTO_CAPTURE
): Detector {
    let state: DetectorState = 'armed';
    let previous: Uint8Array | null = null;
    let background: Uint8Array | null = null;
    let snapshot: Uint8Array | null = null;
    let backgroundAt = 0;
    let lastCaptureAt = -Infinity;
    let stillSince: number | null = null;
    let emptySince: number | null = null;

    function step(gray: Uint8Array, now: number): Reading {
        // The first frame is taken to be the empty background.
        if (!previous || !background) {
            previous = gray;
            background = gray;
            backgroundAt = now;
            return reading(0, 0, now, false);
        }

        const vsPrevious = changedFraction(gray, previous, config.pixelDelta);
        previous = gray;
        const still = vsPrevious <= config.stillFraction;

        // Right after hold(): remember what is in front of the camera now.
        if (state === 'captured' && !snapshot) snapshot = gray;

        const vsBackground = changedFraction(
            gray,
            background,
            config.pixelDelta
        );
        const present = vsBackground >= config.presentFraction;
        let capture = false;

        if (!present) {
            stillSince = null;
            if (still && now - backgroundAt >= config.backgroundRefreshMs) {
                background = gray;
                backgroundAt = now;
            }
            if (state === 'captured') {
                emptySince ??= now;
                if (now - emptySince >= config.emptyMs) {
                    state = 'armed';
                    snapshot = null;
                    emptySince = null;
                }
            }
        } else {
            emptySince = null;
            // A card counts as new when armed, or when it differs from the last one.
            const isNew =
                state === 'armed' ||
                (snapshot !== null &&
                    changedFraction(gray, snapshot, config.pixelDelta) >=
                        config.swapFraction);
            if (!isNew || !still) {
                stillSince = null;
            } else {
                stillSince ??= now;
                if (
                    now - stillSince >= config.stableMs &&
                    now - lastCaptureAt >= config.minIntervalMs
                ) {
                    capture = true;
                    state = 'captured';
                    snapshot = gray;
                    lastCaptureAt = now;
                    stillSince = null;
                }
            }
        }

        return reading(vsBackground, vsPrevious, now, capture);
    }

    function reading(
        vsBackground: number,
        vsPrevious: number,
        now: number,
        capture: boolean
    ): Reading {
        return {
            state,
            capture,
            vsBackground,
            vsPrevious,
            stillForMs: stillSince === null ? 0 : now - stillSince,
            emptyForMs: emptySince === null ? 0 : now - emptySince,
        };
    }

    function hold() {
        state = 'captured';
        snapshot = null;
        stillSince = null;
        emptySince = null;
    }

    return { step, hold };
}
