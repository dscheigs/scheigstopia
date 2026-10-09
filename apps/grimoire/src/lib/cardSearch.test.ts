import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { slimOracleCards } from '../../scripts/cardNamesLib.mjs';
import {
    buildIndex,
    matchReadName,
    searchCards,
    type CardIndex,
} from '@/lib/cardSearch';

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

describe('matchReadName', () => {
    it('finds the card for an exact name', () => {
        expect(matchReadName(index, 'Lightning Bolt')[0]?.name).toBe(
            'Lightning Bolt'
        );
    });

    it('puts an exact name ahead of longer fuzzy hits', () => {
        const names = matchReadName(index, 'Lightning Bolt').map((c) => c.name);
        expect(names[0]).toBe('Lightning Bolt');
    });

    it('ignores case and extra spaces', () => {
        expect(matchReadName(index, '  sol   RING ')[0]?.name).toBe('Sol Ring');
    });

    it('matches a double-faced card by its front face', () => {
        expect(matchReadName(index, 'Delver of Secrets')[0]?.name).toBe(
            'Delver of Secrets // Insectile Aberration'
        );
    });

    it('tolerates a small misreading', () => {
        expect(matchReadName(index, 'Lightnng Bolt')[0]?.name).toBe(
            'Lightning Bolt'
        );
    });

    it('returns nothing for text that is not a card name', () => {
        expect(
            matchReadName(index, "I can't read a card in this image")
        ).toEqual([]);
        expect(matchReadName(index, '')).toEqual([]);
    });

    it('respects the limit', () => {
        expect(matchReadName(index, 'er', 2).length).toBeLessThanOrEqual(2);
    });
});
