import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { slimOracleCards } from '../../scripts/card-names-lib.mjs';
import { buildIndex, searchCards, type CardIndex } from '@/lib/card-search';

let index: CardIndex;

beforeAll(async () => {
    const fixture = JSON.parse(
        await readFile(
            path.join(
                __dirname,
                '..',
                '..',
                'fixtures',
                'oracle-cards.sample.json'
            ),
            'utf8'
        )
    );
    index = buildIndex(slimOracleCards(fixture, 'test'));
});

describe('searchCards', () => {
    it('finds a card from a partial name', () => {
        expect(searchCards(index, 'lightn')[0]?.name).toBe('Lightning Bolt');
    });

    it('tolerates a typo', () => {
        expect(searchCards(index, 'lightnig bolt')[0]?.name).toBe(
            'Lightning Bolt'
        );
    });

    it('is case-insensitive', () => {
        expect(searchCards(index, 'SOL RING')[0]?.name).toBe('Sol Ring');
    });

    it('matches a double-faced card by its front face', () => {
        const first = searchCards(index, 'Delver of Secrets')[0];
        expect(first?.name).toBe('Delver of Secrets // Insectile Aberration');
        expect(first?.front).toBe('Delver of Secrets');
    });

    it('returns nothing for empty or one-character queries', () => {
        expect(searchCards(index, '')).toEqual([]);
        expect(searchCards(index, ' a ')).toEqual([]);
    });

    it('respects the result limit', () => {
        expect(searchCards(index, 'er', 2).length).toBeLessThanOrEqual(2);
    });
});
