import { describe, expect, it } from 'vitest';
import { fitWithin } from '@/lib/capture';

describe('fitWithin', () => {
    it('scales a landscape frame down by its longest side', () => {
        expect(fitWithin(1920, 1080, 1280)).toEqual({
            width: 1280,
            height: 720,
        });
    });

    it('scales a portrait frame down by its longest side', () => {
        expect(fitWithin(1080, 1920, 1280)).toEqual({
            width: 720,
            height: 1280,
        });
    });

    it('never scales up', () => {
        expect(fitWithin(640, 480, 1280)).toEqual({ width: 640, height: 480 });
        expect(fitWithin(1280, 720, 1280)).toEqual({
            width: 1280,
            height: 720,
        });
    });

    it('rounds to whole pixels', () => {
        const { width, height } = fitWithin(1999, 1001, 1280);
        expect(Number.isInteger(width)).toBe(true);
        expect(Number.isInteger(height)).toBe(true);
        expect(Math.max(width, height)).toBe(1280);
    });
});
