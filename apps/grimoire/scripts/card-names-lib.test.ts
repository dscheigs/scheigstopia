import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { slimOracleCards } from './card-names-lib.mjs';

async function loadFixture(): Promise<unknown[]> {
    const file = path.join(
        __dirname,
        '..',
        'fixtures',
        'oracle-cards.sample.json'
    );
    return JSON.parse(await readFile(file, 'utf8'));
}

describe('slimOracleCards', () => {
    it('keeps real cards, sorted by name, as [oracleId, name] pairs', async () => {
        const slim = slimOracleCards(await loadFixture(), 'test');
        const names = slim.cards.map(([, name]) => name);

        expect(slim.version).toBe('test');
        expect(slim.count).toBe(slim.cards.length);
        expect(names).toEqual(
            [...names].sort((a, b) => a.localeCompare(b, 'en'))
        );
        expect(names).toContain('Lightning Bolt');
        expect(names).toContain('Delver of Secrets // Insectile Aberration');
    });

    it('drops tokens and art series cards', async () => {
        const names = slimOracleCards(await loadFixture(), 'test').cards.map(
            ([, name]) => name
        );
        expect(names).not.toContain('Goblin');
        expect(names).not.toContain('Lightning Bolt Art Card');
    });

    it('dedupes by oracle id and skips cards without one', async () => {
        const slim = slimOracleCards(await loadFixture(), 'test');
        const ids = slim.cards.map(([id]) => id);
        expect(new Set(ids).size).toBe(ids.length);
        expect(
            slim.cards.filter(([, name]) => name === 'Lightning Bolt')
        ).toHaveLength(1);
        expect(slim.cards.map(([, name]) => name)).not.toContain(
            'Card Without An Oracle Id'
        );
    });

    it('reads the oracle id from the faces of reversible cards', async () => {
        const slim = slimOracleCards(await loadFixture(), 'test');
        expect(slim.cards).toContainEqual([
            '00000000-0000-4000-8000-00000000000d',
            'Reversible Example // Reversible Example',
        ]);
    });

    it('ignores junk entries', () => {
        expect(slimOracleCards([null, 5, 'x', {}], 'v').count).toBe(0);
    });
});
