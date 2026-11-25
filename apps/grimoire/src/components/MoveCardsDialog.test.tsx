import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MoveCardsDialog from '@/components/MoveCardsDialog';
import type { LocationItem } from '@/lib/locations';

const location = (
    id: string,
    label: string,
    archivedAt: string | null = null
): LocationItem => ({
    id,
    kind: id === 'u' ? 'unsorted' : 'bulk',
    label,
    note: null,
    parentId: null,
    archivedAt,
    createdAt: '2026-10-01T00:00:00.000Z',
    cardCount: 0,
});

const mutate = vi.fn();
let moveState: { isPending: boolean; isError: boolean; error: Error | null };

vi.mock('@/lib/queries', () => ({
    useLocations: () => ({
        data: [
            location('u', 'Unsorted'),
            location('b', 'Bag'),
            location('x', 'Old box', '2026-09-01T00:00:00.000Z'),
        ],
    }),
    useMoveCards: () => ({ mutate, ...moveState }),
}));

const sources = [
    {
        locationId: 'u',
        kind: 'unsorted' as const,
        label: 'Unsorted',
        quantity: 3,
    },
];

function open(onClose = vi.fn()) {
    render(
        <MoveCardsDialog
            oracleId="o-bolt"
            name="Lightning Bolt"
            sources={sources}
            onClose={onClose}
        />
    );
    return onClose;
}

beforeEach(() => {
    mutate.mockReset();
    moveState = { isPending: false, isError: false, error: null };
});

describe('MoveCardsDialog', () => {
    it('offers open locations other than the source as destinations', () => {
        open();
        const options = Array.from(
            (screen.getByLabelText('To') as HTMLSelectElement).options
        ).map((option) => option.textContent);
        expect(options).toEqual(['Choose a place', 'Bag']);
    });

    it('sends the move with the note', async () => {
        const user = userEvent.setup();
        open();
        await user.selectOptions(screen.getByLabelText('To'), 'b');
        await user.clear(screen.getByLabelText('Copies'));
        await user.type(screen.getByLabelText('Copies'), '2');
        await user.type(screen.getByLabelText('Note (optional)'), 'Tidying');
        await user.click(screen.getByRole('button', { name: 'Move' }));
        expect(mutate).toHaveBeenCalledWith(
            {
                moves: [
                    { oracleId: 'o-bolt', from: 'u', to: 'b', quantity: 2 },
                ],
                note: 'Tidying',
            },
            expect.any(Object)
        );
    });

    it('refuses to move more copies than are there, without calling the server', async () => {
        const user = userEvent.setup();
        open();
        await user.selectOptions(screen.getByLabelText('To'), 'b');
        await user.clear(screen.getByLabelText('Copies'));
        await user.type(screen.getByLabelText('Copies'), '4');
        await user.click(screen.getByRole('button', { name: 'Move' }));
        expect(screen.getByRole('alert')).toHaveTextContent(
            'Only 3 copies are there.'
        );
        expect(mutate).not.toHaveBeenCalled();
    });

    it('asks for a destination first', async () => {
        const user = userEvent.setup();
        open();
        await user.click(screen.getByRole('button', { name: 'Move' }));
        expect(screen.getByRole('alert')).toHaveTextContent(
            'Choose where to move to.'
        );
    });

    it('shows the server refusal in the dialog', () => {
        moveState = {
            isPending: false,
            isError: true,
            error: new Error(
                'A source location does not hold that many copies.'
            ),
        };
        open();
        expect(screen.getByRole('alert')).toHaveTextContent(
            'does not hold that many copies'
        );
    });
});
