import { describe, expect, it } from 'vitest';
import { formatTextExport } from '@/lib/export';

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
