import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RecentMoves from '@/components/RecentMoves';
import type { RecentMove } from '@/lib/locations';

const move = (id: number, undoable: boolean): RecentMove => ({
    id,
    oracleId: 'o-bolt',
    name: 'Lightning Bolt',
    fromId: 'u',
    fromLabel: 'Unsorted',
    toId: 'b',
    toLabel: 'Bag',
    quantity: 2,
    note: id === 2 ? 'Tidying' : null,
    createdAt: '2026-10-12T10:00:00.000Z',
    undoable,
});

let recent: { data: RecentMove[] | undefined };
const undo = vi.fn();

vi.mock('@/lib/queries', () => ({
    useRecentMoves: () => recent,
    useUndoMove: () => ({ mutate: undo, isPending: false }),
}));

beforeEach(() => {
    undo.mockReset();
    recent = { data: [move(2, true), move(1, false)] };
});

describe('RecentMoves', () => {
    it('renders nothing until there are moves', () => {
        recent = { data: [] };
        const { container } = render(<RecentMoves />);
        expect(container).toBeEmptyDOMElement();
    });

    it('lists each move with its date and note', () => {
        render(<RecentMoves />);
        expect(
            screen.getAllByText('2 Lightning Bolt from Unsorted to Bag')
        ).toHaveLength(2);
        expect(screen.getByText('12 Oct 2026 · Tidying')).toBeTruthy();
    });

    it('offers Undo only where the cards have not moved on', async () => {
        render(<RecentMoves />);
        const buttons = screen.getAllByRole('button', { name: /^Undo/ });
        expect(buttons).toHaveLength(1);
        await userEvent.click(buttons[0]);
        expect(undo).toHaveBeenCalledWith(expect.objectContaining({ id: 2 }));
    });
});
