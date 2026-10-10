import { describe, expect, it } from 'vitest';
import { discardCopy } from '@/lib/discardMessage';

describe('discardCopy', () => {
    it('names the total, the review count and that it is permanent', () => {
        expect(discardCopy(5, 2)).toEqual({
            message:
                'Discard all 5 cards in the queue? 2 cards still need review. This cannot be undone.',
            label: 'Discard all 5 cards',
        });
    });

    it('uses singular forms', () => {
        const { message, label } = discardCopy(1, 1);
        expect(message).toBe(
            'Discard all 1 card in the queue? 1 card still needs review. This cannot be undone.'
        );
        expect(label).toBe('Discard all 1 card');
    });

    it('omits the review sentence when nothing needs review', () => {
        expect(discardCopy(3, 0).message).toBe(
            'Discard all 3 cards in the queue? This cannot be undone.'
        );
    });
});
