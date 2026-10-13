import { describe, expect, it } from 'vitest';
import {
    CARD_ASPECT,
    isConvex,
    judgeQuad,
    judgeQuads,
    polygonArea,
    quadAspect,
    type Point,
    type ShapeRules,
} from '@/lib/cardShape';

const FRAME = { width: 320, height: 240 };
const RULES: ShapeRules = {
    aspectTolerance: 0.15,
    minAreaShare: 0.1,
    maxAreaShare: 0.95,
};

/** An upright rectangle with its top-left at (x, y). */
function rect(x: number, y: number, w: number, h: number): Point[] {
    return [
        { x, y },
        { x: x + w, y },
        { x: x + w, y: y + h },
        { x, y: y + h },
    ];
}

describe('quad geometry', () => {
    it('measures area and aspect of a rectangle', () => {
        const quad = rect(10, 10, 100, 200);
        expect(polygonArea(quad)).toBe(20_000);
        expect(quadAspect(quad)).toBe(2);
    });

    it('reads the same aspect in either orientation', () => {
        expect(quadAspect(rect(0, 0, 88, 63))).toBeCloseTo(CARD_ASPECT);
        expect(quadAspect(rect(0, 0, 63, 88))).toBeCloseTo(CARD_ASPECT);
    });

    it('tells convex from dented and from a bow-tie', () => {
        expect(isConvex(rect(0, 0, 10, 10))).toBe(true);
        const dent = [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 5, y: 4 },
            { x: 10, y: 10 },
            { x: 0, y: 10 },
        ];
        expect(isConvex(dent)).toBe(false);
        const bowTie = [
            { x: 0, y: 0 },
            { x: 10, y: 10 },
            { x: 10, y: 0 },
            { x: 0, y: 10 },
        ];
        expect(isConvex(bowTie)).toBe(false);
    });
});

describe('judgeQuad', () => {
    it('accepts a card-sized, card-shaped rectangle in either orientation', () => {
        expect(judgeQuad(rect(80, 20, 126, 176), FRAME, RULES).found).toBe(
            true
        );
        expect(judgeQuad(rect(20, 40, 176, 126), FRAME, RULES).found).toBe(
            true
        );
    });

    it('rejects a square (a face) and a long strip', () => {
        expect(judgeQuad(rect(60, 20, 160, 160), FRAME, RULES).found).toBe(
            false
        );
        expect(judgeQuad(rect(10, 100, 300, 40), FRAME, RULES).found).toBe(
            false
        );
    });

    it('rejects one that is too small or fills the whole frame', () => {
        expect(judgeQuad(rect(10, 10, 40, 56), FRAME, RULES).found).toBe(false);
        expect(judgeQuad(rect(0, 0, 320, 240), FRAME, RULES).found).toBe(false);
    });

    it('widens with the tolerance', () => {
        const slightlySquare = rect(60, 20, 140, 160); // aspect about 1.14
        expect(judgeQuad(slightlySquare, FRAME, RULES).found).toBe(false);
        expect(
            judgeQuad(slightlySquare, FRAME, {
                ...RULES,
                aspectTolerance: 0.25,
            }).found
        ).toBe(true);
    });

    it('rejects a non-convex outline and a missing one', () => {
        const dented = [
            { x: 80, y: 20 },
            { x: 206, y: 20 },
            { x: 140, y: 100 },
            { x: 206, y: 196 },
        ];
        expect(judgeQuad(dented, FRAME, RULES).found).toBe(false);
        expect(judgeQuad(null, FRAME, RULES)).toEqual({
            found: false,
            corners: null,
            aspect: null,
        });
    });

    it('returns the corners and measured aspect', () => {
        const quad = rect(80, 20, 126, 176);
        const result = judgeQuad(quad, FRAME, RULES);
        expect(result.corners).toBe(quad);
        expect(result.aspect).toBeCloseTo(176 / 126);
    });
});

describe('judgeQuads', () => {
    it('finds the card even when a frame-sized quad is larger', () => {
        const result = judgeQuads(
            [rect(0, 0, 320, 240), rect(80, 20, 126, 176)],
            FRAME,
            RULES
        );
        expect(result.found).toBe(true);
    });

    it('reports a near miss of plausible size, or nothing', () => {
        const result = judgeQuads(
            [rect(0, 0, 320, 240), rect(60, 20, 160, 160)],
            FRAME,
            RULES
        );
        expect(result.found).toBe(false);
        expect(result.aspect).toBeCloseTo(1, 1);
        expect(judgeQuads([], FRAME, RULES).found).toBe(false);
    });
});
