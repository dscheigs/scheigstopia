// The rules of the move form: how many copies, and where to and from. Pure, so
// they are tested without a DOM. The server checks the same things again.

export type MoveCheck =
    | { ok: true; quantity: number }
    | { ok: false; error: string };

/**
 * Check a move before it is sent. `max` is how many copies the source holds.
 * `quantityText` is what was typed, so a blank or fractional entry is caught.
 */
export function checkMove(input: {
    from: string;
    to: string;
    quantityText: string;
    max: number;
}): MoveCheck {
    if (!input.from) return { ok: false, error: 'Choose where to move from.' };
    if (!input.to) return { ok: false, error: 'Choose where to move to.' };
    if (input.from === input.to) {
        return { ok: false, error: 'Choose a different place to move to.' };
    }
    const text = input.quantityText.trim();
    if (!/^\d+$/.test(text)) {
        return { ok: false, error: 'Enter a whole number of copies.' };
    }
    const quantity = Number(text);
    if (quantity < 1) {
        return { ok: false, error: 'Move at least one copy.' };
    }
    if (quantity > input.max) {
        return {
            ok: false,
            error:
                input.max === 1
                    ? 'Only 1 copy is there.'
                    : `Only ${input.max} copies are there.`,
        };
    }
    return { ok: true, quantity };
}

/** "2 Lightning Bolt from Unsorted to Bag"; used in the recent-moves list. */
export function recentMoveText(move: {
    quantity: number;
    name: string;
    fromLabel: string;
    toLabel: string;
}): string {
    return `${move.quantity} ${move.name} from ${move.fromLabel} to ${move.toLabel}`;
}
