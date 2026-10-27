import { useState } from 'react';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useDialogState } from '@scheigs/sylva-ui';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CardDetailDialog from '@/components/CardDetailDialog';
import type { CollectionItem } from '@/lib/collection';

const imageId = '11bf83bb-c95b-4b4f-9a56-ce7a1816307a';

const initial: CollectionItem[] = [
    { oracleId: 'a', name: 'Island', quantity: 3, updatedAt: '' },
    { oracleId: 'b', name: 'Swamp', quantity: 1, updatedAt: '' },
];

/** Like CollectionView: keeps only the id and looks the card up each render. */
function Harness({
    onRemoveSpy,
    onSave,
}: {
    onRemoveSpy?: (id: string) => void;
    onSave?: (id: string, quantity: number) => Promise<void>;
}) {
    const [items, setItems] = useState(initial);
    const detail = useDialogState<string>();
    const selected = items.find((item) => item.oracleId === detail.value);
    return (
        <>
            <button onClick={() => detail.show('a')}>Open Island</button>
            <CardDetailDialog
                item={selected}
                imageId={imageId}
                onSaveQuantity={async (item, quantity) => {
                    await onSave?.(item.oracleId, quantity);
                    setItems((all) =>
                        all.map((other) =>
                            other.oracleId === item.oracleId
                                ? { ...other, quantity }
                                : other
                        )
                    );
                }}
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

const settle = () => act(() => vi.advanceTimersByTimeAsync(600));

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
        expect(dialog.getByLabelText('3 owned')).toHaveValue('3');
        expect(dialog.getByRole('button', { name: 'Remove' })).toBeTruthy();
    });

    it('aligns Remove with the stepper buttons, not the line under them', async () => {
        render(<Harness />);
        await userEvent.click(
            screen.getByRole('button', { name: 'Open Island' })
        );
        const remove = within(sheet()).getByRole('button', { name: 'Remove' });
        // The stepper reserves a status line below its buttons, so a centered
        // row would drop Remove below them.
        expect(remove.parentElement).toHaveClass('items-start');
        expect(remove.parentElement).not.toHaveClass('items-center');
    });

    it('shows clicks at once and saves the final count once', async () => {
        const saved = vi.fn().mockResolvedValue(undefined);
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        render(<Harness onSave={saved} />);
        await user.click(screen.getByRole('button', { name: 'Open Island' }));

        const add = screen.getByRole('button', { name: 'Add one Island' });
        await user.click(add);
        await user.click(add);
        await user.click(screen.getByRole('button', { name: /^Remove one/ }));
        expect(screen.getByLabelText('4 owned')).toHaveValue('4');
        expect(saved).not.toHaveBeenCalled();
        expect(screen.getByText('Saving…')).toBeTruthy();
        // Neither the buttons nor Remove are locked by the save, except Remove.
        expect(add).toBeEnabled();

        await settle();
        expect(saved).toHaveBeenCalledTimes(1);
        expect(saved).toHaveBeenCalledWith('a', 4);
        expect(screen.queryByText('Saving…')).toBeNull();
        expect(screen.getByLabelText('4 owned')).toHaveValue('4');
    });

    it('rolls the count back and shows the error when the save fails', async () => {
        const saved = vi.fn().mockRejectedValue(new Error('Could not save.'));
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        render(<Harness onSave={saved} />);
        await user.click(screen.getByRole('button', { name: 'Open Island' }));
        await user.click(
            screen.getByRole('button', { name: 'Add one Island' })
        );
        await settle();

        expect(screen.getByLabelText('3 owned')).toHaveValue('3');
        expect(screen.getByRole('alert')).toHaveTextContent('Could not save.');
    });

    it('holds Remove while a save is pending', async () => {
        const user = await openSheet();
        await user.click(
            screen.getByRole('button', { name: 'Add one Island' })
        );
        expect(
            within(sheet()).getByRole('button', { name: 'Remove' })
        ).toBeDisabled();
        await settle();
        expect(
            within(sheet()).getByRole('button', { name: 'Remove' })
        ).toBeEnabled();
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
