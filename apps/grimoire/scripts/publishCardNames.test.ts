import { describe, expect, it } from 'vitest';
import { isCardList, shouldUploadCardList } from './cardNamesLib.mjs';

const list = (...cards: [string, string][]) => ({
    version: 'v',
    count: cards.length,
    cards,
});

describe('isCardList', () => {
    it('accepts a well-formed list', () => {
        expect(isCardList(list(['a', 'Alpha']))).toBe(true);
    });
    it.each([
        ['null', null],
        ['a string', 'x'],
        ['no cards', list()],
        ['count mismatch', { version: 'v', count: 2, cards: [['a', 'A']] }],
        ['bad pair', { version: 'v', count: 1, cards: [['a']] }],
        ['non-string name', { version: 'v', count: 1, cards: [['a', 1]] }],
        ['no version', { count: 1, cards: [['a', 'A']] }],
    ])('rejects %s', (_label, value) => {
        expect(isCardList(value)).toBe(false);
    });
});

describe('shouldUploadCardList', () => {
    const next = list(['a', 'Alpha'], ['b', 'Beta']);

    it('uploads when nothing valid is published', () => {
        expect(shouldUploadCardList(null, next)).toBe(true);
        expect(shouldUploadCardList({ nope: 1 }, next)).toBe(true);
    });
    it('skips an identical list, even with a different version label', () => {
        const same = { ...list(['a', 'Alpha'], ['b', 'Beta']), version: 'w' };
        expect(shouldUploadCardList(same, next)).toBe(false);
    });
    it('uploads when a card is added', () => {
        expect(shouldUploadCardList(list(['a', 'Alpha']), next)).toBe(true);
    });
    it('uploads when a card is renamed', () => {
        const renamed = list(['a', 'Alpha'], ['b', 'Bravo']);
        expect(shouldUploadCardList(renamed, next)).toBe(true);
    });
});
