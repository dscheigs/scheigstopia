import { describe, expect, it } from 'vitest';
import {
    formatLocationSheet,
    locationSheetFilename,
} from '@/lib/locationSheet';

const DATE = new Date('2026-11-26T12:00:00Z');

describe('formatLocationSheet', () => {
    it('writes the label, the date and "<quantity> <name>" lines', () => {
        expect(
            formatLocationSheet(
                { label: 'Bulk bag 1' },
                [
                    { name: 'Lightning Bolt', quantity: 4 },
                    { name: 'Sol Ring', quantity: 1 },
                ],
                DATE
            )
        ).toBe('Bulk bag 1\n2026-11-26\n\n4 Lightning Bolt\n1 Sol Ring\n');
    });

    it('says so when the location is empty', () => {
        expect(formatLocationSheet({ label: 'Empty' }, [], DATE)).toBe(
            'Empty\n2026-11-26\n\nNo cards.\n'
        );
    });
});

describe('locationSheetFilename', () => {
    it('slugs the label', () => {
        expect(locationSheetFilename('Bulk bag #1')).toBe(
            'grimoire-bulk-bag-1.txt'
        );
    });

    it('falls back when nothing is left', () => {
        expect(locationSheetFilename('***')).toBe('grimoire-location.txt');
    });
});
