const cards = (n: number) => `${n} ${n === 1 ? 'card' : 'cards'}`;

export type DiscardCopy = {
    /** Text for the confirmation dialog. */
    message: string;
    /** Text for the button that opens it. */
    label: string;
};

/**
 * Wording for discarding the whole queue. `total` is every queued card
 * (discarding removes all of them), `needReview` the subset not yet
 * confirmed.
 */
export function discardCopy(total: number, needReview: number): DiscardCopy {
    const lines = [`Discard all ${cards(total)} in the queue?`];
    if (needReview > 0) {
        lines.push(
            `${cards(needReview)} still ${needReview === 1 ? 'needs' : 'need'} review.`
        );
    }
    lines.push('This cannot be undone.');
    return {
        message: lines.join(' '),
        label: `Discard all ${cards(total)}`,
    };
}
