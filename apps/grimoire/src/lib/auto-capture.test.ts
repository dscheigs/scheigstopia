import { describe, expect, it } from 'vitest';
import {
    AUTO_CAPTURE,
    changedFraction,
    createDetector,
    toGray,
} from '@/lib/auto-capture';

const {
    sampleWidth: W,
    sampleHeight: H,
    sampleIntervalMs: STEP,
} = AUTO_CAPTURE;
const BACKGROUND = 100;

/** A flat frame, optionally with a bright or dark "card" block on it. */
function frame(card?: { value: number; offset?: number }): Uint8Array {
    const gray = new Uint8Array(W * H).fill(BACKGROUND);
    if (card) {
        const left = 12 + (card.offset ?? 0);
        for (let y = 8; y < 40; y++) {
            for (let x = left; x < left + 32; x++) gray[y * W + x] = card.value;
        }
    }
    return gray;
}

const EMPTY = frame();
const CARD_A = frame({ value: 200 });
const CARD_B = frame({ value: 30 });

/** Feeds frames at the sampling rate and counts captures. */
function run(detector = createDetector(), startMs = 0) {
    let now = startMs;
    let captures = 0;
    return {
        feed(gray: Uint8Array, ms: number) {
            for (let t = 0; t < ms; t += STEP) {
                if (detector.step(gray, now).capture) captures++;
                now += STEP;
            }
        },
        get captures() {
            return captures;
        },
        detector,
    };
}

describe('toGray / changedFraction', () => {
    it('turns RGBA into one luma byte per pixel', () => {
        const gray = toGray([255, 255, 255, 255, 0, 0, 0, 255]);
        expect(gray[0]).toBeGreaterThanOrEqual(254);
        expect(gray[1]).toBe(0);
    });

    it('counts only pixels that moved past the delta', () => {
        const a = new Uint8Array([0, 0, 0, 0]);
        const b = new Uint8Array([10, 30, 0, 200]);
        expect(changedFraction(a, b, 25)).toBe(0.5);
        expect(changedFraction(a, a, 25)).toBe(0);
    });
});

describe('createDetector', () => {
    it('does not capture an empty scene', () => {
        const r = run();
        r.feed(EMPTY, 10_000);
        expect(r.captures).toBe(0);
    });

    it('captures a card once it has been still long enough, and only once', () => {
        const r = run();
        r.feed(EMPTY, 1000);
        r.feed(CARD_A, AUTO_CAPTURE.stableMs - STEP * 2);
        expect(r.captures).toBe(0);
        r.feed(CARD_A, 10_000);
        expect(r.captures).toBe(1);
    });

    it('ignores a card that keeps moving', () => {
        const r = run();
        r.feed(EMPTY, 1000);
        for (let i = 0; i < 60; i++) {
            r.feed(frame({ value: 200, offset: i % 2 ? 8 : 0 }), STEP);
        }
        expect(r.captures).toBe(0);
    });

    it('ignores camera noise below the pixel delta', () => {
        const r = run();
        r.feed(EMPTY, 1000);
        for (let i = 0; i < 50; i++) {
            const noisy = EMPTY.map((v, p) => v + ((p + i) % 2 ? 5 : -5));
            r.feed(noisy, STEP);
        }
        expect(r.captures).toBe(0);
    });

    it('captures the next card after the frame empties', () => {
        const r = run();
        r.feed(EMPTY, 1000);
        r.feed(CARD_A, 3000);
        r.feed(EMPTY, AUTO_CAPTURE.emptyMs + STEP * 2);
        r.feed(CARD_A, 3000);
        expect(r.captures).toBe(2);
    });

    it('does not re-arm if the frame was only briefly empty', () => {
        const r = run();
        r.feed(EMPTY, 1000);
        r.feed(CARD_A, 3000);
        r.feed(EMPTY, AUTO_CAPTURE.emptyMs / 2);
        r.feed(CARD_A, 5000);
        expect(r.captures).toBe(1);
    });

    it('captures a different card swapped in without an empty frame', () => {
        const r = run();
        r.feed(EMPTY, 1000);
        r.feed(CARD_A, 3000);
        r.feed(CARD_B, 3000);
        expect(r.captures).toBe(2);
    });

    it('does not burst when cards are swapped faster than the minimum gap', () => {
        const r = run();
        r.feed(EMPTY, 1000);
        r.feed(CARD_A, AUTO_CAPTURE.stableMs + STEP * 2);
        r.feed(CARD_B, AUTO_CAPTURE.stableMs + STEP * 2);
        // Second card is held past the gap, so it is captured, but not before it.
        expect(r.captures).toBe(1);
        r.feed(CARD_B, AUTO_CAPTURE.minIntervalMs);
        expect(r.captures).toBe(2);
    });

    it('does not capture the same card again after hold()', () => {
        const r = run();
        r.feed(EMPTY, 1000);
        r.feed(CARD_A, 1500);
        expect(r.captures).toBe(1);
        r.detector.hold();
        r.feed(CARD_A, 10_000);
        expect(r.captures).toBe(1);
    });

    it('captures the next card after hold() once the frame empties', () => {
        const r = run();
        r.feed(EMPTY, 1000);
        r.feed(CARD_A, 1500);
        r.detector.hold();
        r.feed(CARD_A, 2000);
        r.feed(EMPTY, AUTO_CAPTURE.emptyMs + STEP * 2);
        r.feed(CARD_B, 3000);
        expect(r.captures).toBe(2);
    });

    it('follows slow lighting changes instead of seeing a card', () => {
        const r = run();
        r.feed(EMPTY, 1000);
        // Brighten by 10 levels every 2 seconds, below the pixel delta each step.
        for (let level = 1; level <= 6; level++) {
            r.feed(
                EMPTY.map((v) => v + level * 10),
                2000
            );
        }
        expect(r.captures).toBe(0);
    });

    it('turns about 20 cards at a normal pace into about 20 captures', () => {
        const r = run();
        r.feed(EMPTY, 1000);
        for (let i = 0; i < 20; i++) {
            // A hand slides the card in, it rests ~1.5s, then it is removed.
            r.feed(frame({ value: i % 2 ? 200 : 30, offset: 10 }), STEP);
            r.feed(frame({ value: i % 2 ? 200 : 30, offset: 4 }), STEP);
            r.feed(i % 2 ? CARD_A : CARD_B, 1500);
            r.feed(EMPTY, 1200);
        }
        expect(r.captures).toBe(20);
    });
});
