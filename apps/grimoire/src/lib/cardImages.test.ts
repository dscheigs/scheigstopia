import { describe, expect, it } from 'vitest';
import { buildImageIds, cardImageUrl } from '@/lib/cardImages';

const id = '11bf83bb-c95b-4b4f-9a56-ce7a1816307a';

describe('cardImageUrl', () => {
    it('builds the CDN path from the first two characters of the id', () => {
        expect(cardImageUrl(id, 'small')).toBe(
            `https://cards.scryfall.io/small/front/1/1/${id}.jpg`
        );
        expect(cardImageUrl(id, 'normal')).toBe(
            `https://cards.scryfall.io/normal/front/1/1/${id}.jpg`
        );
    });

    it('refuses anything that is not a uuid', () => {
        expect(cardImageUrl('../../x', 'small')).toBeNull();
        expect(cardImageUrl('', 'small')).toBeNull();
    });
});

describe('buildImageIds', () => {
    it('maps oracle ids to image ids, skipping cards without one', () => {
        const map = buildImageIds({
            version: 'v',
            count: 2,
            cards: [
                ['a', 'A', id],
                ['b', 'B'],
            ],
        });
        expect(map.get('a')).toBe(id);
        expect(map.has('b')).toBe(false);
    });
});
