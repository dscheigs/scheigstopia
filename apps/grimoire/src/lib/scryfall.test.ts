import { describe, expect, it, vi } from 'vitest';
import { lookupScryfallCard } from '@/lib/scryfall';

const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status });

describe('lookupScryfallCard', () => {
    it('returns the oracle id and name for a hit, with one fuzzy request', async () => {
        const fetchMock = vi.fn(async () =>
            json({ layout: 'normal', oracle_id: 'o1', name: 'New Card' })
        );
        const found = await lookupScryfallCard(
            'new card',
            fetchMock as unknown as typeof fetch
        );
        expect(found).toEqual({ oracleId: 'o1', name: 'New Card' });
        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [url, init] = fetchMock.mock.calls[0] as unknown as [
            string,
            RequestInit,
        ];
        expect(url).toBe('https://api.scryfall.com/cards/named?fuzzy=new+card');
        expect(init.headers).toEqual({ Accept: 'application/json' });
    });

    it('takes the oracle id from the faces of a reversible card', async () => {
        const found = await lookupScryfallCard('x', (async () =>
            json({
                layout: 'reversible_card',
                name: 'A // B',
                card_faces: [{ oracle_id: 'f1' }],
            })) as unknown as typeof fetch);
        expect(found).toEqual({ oracleId: 'f1', name: 'A // B' });
    });

    it('returns null on a 404', async () => {
        const found = await lookupScryfallCard('nope', (async () =>
            json({ object: 'error' }, 404)) as unknown as typeof fetch);
        expect(found).toBeNull();
    });

    it('returns null when the network fails', async () => {
        const found = await lookupScryfallCard('x', (async () => {
            throw new TypeError('Failed to fetch');
        }) as unknown as typeof fetch);
        expect(found).toBeNull();
    });

    it('returns null for a non-collectible layout', async () => {
        for (const layout of ['token', 'emblem', 'art_series']) {
            const found = await lookupScryfallCard('x', (async () =>
                json({
                    layout,
                    oracle_id: 'o',
                    name: 'Thing',
                })) as unknown as typeof fetch);
            expect(found).toBeNull();
        }
    });

    it('does not call Scryfall for an empty name', async () => {
        const fetchMock = vi.fn();
        expect(
            await lookupScryfallCard(' ', fetchMock as unknown as typeof fetch)
        ).toBeNull();
        expect(fetchMock).not.toHaveBeenCalled();
    });
});
