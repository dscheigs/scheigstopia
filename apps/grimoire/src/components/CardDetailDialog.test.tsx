import { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useDialogState } from '@scheigs/sylva-ui';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CardDetailDialog from '@/components/CardDetailDialog';

// The real dialog fetches locations; here only its props matter.
vi.mock('@/components/MoveCardsDialog', () => ({
    default: ({
        name,
        sources,
        onClose,
    }: {
        name: string;
        sources: { label: string }[];
        onClose: () => void;
    }) => (
        <div role="group" aria-label={`Move ${name}`}>
            {sources.map((source) => source.label).join(',')}
            <button onClick={onClose}>Close move</button>
        </div>
    ),
}));
import type { CollectionItem } from '@/lib/collection';

const imageId = '11bf83bb-c95b-4b4f-9a56-ce7a1816307a';

const initial: CollectionItem[] = [
    { oracleId: 'a', name: 'Island', quantity: 3, updatedAt: '' },
    { oracleId: 'b', name: 'Swamp', quantity: 1, updatedAt: '' },
];

/** Like CollectionView: keeps only the id and looks the card up each render. */
function Harness({ onRemoveSpy }: { onRemoveSpy?: (id: string) => void }) {
    const [items, setItems] = useState(initial);
    const detail = useDialogState<string>();
    const selected = items.find((item) => item.oracleId === detail.value);
    return (
        <>
            <button onClick={() => detail.show('a')}>Open Island</button>
            <CardDetailDialog
                item={selected}
                imageId={imageId}
                onRemove={(item) => {
                    onRemoveSpy?.(item.oracleId);
                    setItems((all) =>
                        all.filter((other) => other.oracleId !== item.oracleId)
                    );
                }}
                onClose={detail.close}
            />
        </>
    );
}

const sheet = () => document.querySelector('dialog') as HTMLDialogElement;

beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
afterEach(() => vi.useRealTimers());

async function openSheet() {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Open Island' }));
    return user;
}

describe('CardDetailDialog', () => {
    it('is closed until opened, then shows the image, name and controls', async () => {
        render(<Harness />);
        expect(sheet()).not.toHaveAttribute('open');

        await userEvent.click(
            screen.getByRole('button', { name: 'Open Island' })
        );
        const dialog = within(sheet());
        expect(sheet()).toHaveAttribute('open');
        expect(dialog.getByRole('heading', { name: 'Island' })).toBeTruthy();
        expect(dialog.getByRole('img', { name: 'Island' })).toHaveAttribute(
            'src',
            expect.stringContaining('/normal/front/')
        );
        expect(dialog.getByText('3 owned')).toBeTruthy();
        // The count is not editable here: copies change place by moving.
        expect(dialog.queryByRole('button', { name: /^Add one/ })).toBeNull();
        expect(
            dialog.queryByRole('button', { name: /^Remove one/ })
        ).toBeNull();
        expect(dialog.getByRole('button', { name: 'Remove' })).toBeTruthy();
    });

    it('closes from the close button, the backdrop and the browser (Escape)', async () => {
        const user = await openSheet();
        await user.click(screen.getByRole('button', { name: 'Close' }));
        expect(sheet()).not.toHaveAttribute('open');

        await user.click(screen.getByRole('button', { name: 'Open Island' }));
        await user.click(sheet());
        expect(sheet()).not.toHaveAttribute('open');

        await user.click(screen.getByRole('button', { name: 'Open Island' }));
        sheet().close();
        expect(screen.queryByRole('heading', { name: 'Island' })).toBeNull();
    });

    it('asks before removing, and removing closes the sheet', async () => {
        const removed = vi.fn();
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        render(<Harness onRemoveSpy={removed} />);
        await user.click(screen.getByRole('button', { name: 'Open Island' }));

        await user.click(
            within(sheet()).getByRole('button', { name: 'Remove' })
        );
        const [, confirm] = Array.from(document.querySelectorAll('dialog'));
        expect(confirm).toHaveAttribute('open');
        expect(removed).not.toHaveBeenCalled();

        // Cancel on the left, the red Remove on the right.
        const actions = Array.from(
            confirm.querySelectorAll('[data-dialog-actions] button')
        );
        expect(actions.map((button) => button.textContent)).toEqual([
            'Cancel',
            'Remove card',
        ]);
        expect(actions[1].className).toContain('bg-destructive');

        // Cancel keeps the card and the sheet.
        await user.click(
            within(confirm).getByRole('button', { name: 'Cancel' })
        );
        expect(removed).not.toHaveBeenCalled();
        expect(sheet()).toHaveAttribute('open');

        await user.click(
            within(sheet()).getByRole('button', { name: 'Remove' })
        );
        await user.click(
            within(
                Array.from(document.querySelectorAll('dialog'))[1]
            ).getByRole('button', { name: 'Remove card' })
        );
        expect(removed).toHaveBeenCalledWith('a');
        expect(sheet()).not.toHaveAttribute('open');
    });
});

describe('CardDetailDialog moving', () => {
    const placements = [
        { locationId: 'l1', kind: 'bulk' as const, label: 'Bag', quantity: 2 },
        {
            locationId: 'l2',
            kind: 'unsorted' as const,
            label: 'Unsorted',
            quantity: 1,
        },
    ];

    it('keeps Move off until the placements have loaded', () => {
        render(
            <CardDetailDialog
                item={initial[0]}
                imageId={imageId}
                onRemove={() => {}}
                onClose={() => {}}
            />
        );
        expect(
            within(sheet()).getByRole('button', { name: 'Move' })
        ).toBeDisabled();
    });

    it('opens the move dialog with where the copies are, and closes it again', async () => {
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        render(
            <CardDetailDialog
                item={initial[0]}
                imageId={imageId}
                placements={placements}
                onRemove={() => {}}
                onClose={() => {}}
            />
        );
        await user.click(within(sheet()).getByRole('button', { name: 'Move' }));
        const move = screen.getByRole('group', { name: 'Move Island' });
        expect(move).toHaveTextContent('Bag,Unsorted');
        await user.click(
            within(move).getByRole('button', { name: 'Close move' })
        );
        expect(screen.queryByRole('group', { name: 'Move Island' })).toBeNull();
    });
});

describe('CardDetailDialog placements and history', () => {
    it('shows where the copies are and the moves in the order given', () => {
        render(
            <CardDetailDialog
                item={initial[0]}
                imageId={imageId}
                placements={[
                    {
                        locationId: 'l1',
                        kind: 'bulk',
                        label: 'Bag',
                        quantity: 2,
                    },
                    {
                        locationId: 'l2',
                        kind: 'keepers',
                        label: 'Binder A',
                        quantity: 1,
                    },
                ]}
                history={[
                    {
                        id: 3,
                        fromId: 'l1',
                        fromLabel: 'Bag',
                        toId: 'l2',
                        toLabel: 'Binder A',
                        quantity: 1,
                        note: 'Pulled the rare',
                        createdAt: '2026-10-12T10:00:00.000Z',
                    },
                    {
                        id: 2,
                        fromId: 'u',
                        fromLabel: 'Unsorted',
                        toId: 'l1',
                        toLabel: 'Bag',
                        quantity: 3,
                        note: null,
                        createdAt: '2026-10-09T10:00:00.000Z',
                    },
                ]}
                onRemove={() => {}}
                onClose={() => {}}
            />
        );
        const dialog = within(sheet());
        expect(dialog.getByText('2 in Bag, 1 in Binder A')).toBeTruthy();
        const lines = dialog
            .getAllByRole('listitem')
            .map((li) => li.textContent);
        expect(lines).toEqual([
            '1 from Bag to Binder A · Pulled the rare12 Oct 2026',
            '3 from Unsorted to Bag9 Oct 2026',
        ]);
    });
});
