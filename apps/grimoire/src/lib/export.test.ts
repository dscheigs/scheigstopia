import { describe, expect, it } from 'vitest';
import { formatCsvExport, formatTextExport } from '@/lib/export';

describe('formatTextExport', () => {
    it('writes one "<quantity> <name>" line per card', () => {
        expect(
            formatTextExport([
                { name: 'Lightning Bolt', quantity: 4 },
                { name: 'Sol Ring', quantity: 1 },
            ])
        ).toBe('4 Lightning Bolt\n1 Sol Ring\n');
    });

    it('keeps double-faced names intact', () => {
        expect(
            formatTextExport([
                {
                    name: 'Delver of Secrets // Insectile Aberration',
                    quantity: 2,
                },
            ])
        ).toBe('2 Delver of Secrets // Insectile Aberration\n');
    });

    it('returns an empty string for an empty collection', () => {
        expect(formatTextExport([])).toBe('');
    });
});

describe('formatCsvExport', () => {
    it('writes a header and one row per card, after a byte order mark', () => {
        expect(
            formatCsvExport([
                { name: 'Sol Ring', quantity: 1, oracleId: 'abc' },
            ])
        ).toBe('\uFEFFName,Quantity,Oracle ID\r\nSol Ring,1,abc\r\n');
    });

    it('quotes names with commas and doubles embedded quotes', () => {
        const csv = formatCsvExport([
            { name: 'Jace, the Mind Sculptor', quantity: 2, oracleId: 'a' },
            { name: 'The "Pit"', quantity: 1, oracleId: 'b' },
        ]);
        expect(csv).toContain('"Jace, the Mind Sculptor",2,a');
        expect(csv).toContain('"The ""Pit""",1,b');
    });

    it('is only the header for an empty collection', () => {
        expect(formatCsvExport([])).toBe('\uFEFFName,Quantity,Oracle ID\r\n');
    });
});
