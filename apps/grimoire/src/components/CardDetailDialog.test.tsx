import { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useDialogState } from '@scheigs/sylva-ui';
import { describe, expect, it, vi } from 'vitest';
import CardDetailDialog from '@/components/CardDetailDialog';
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
                busy={false}
                onSetQuantity={(item, quantity) =>
                    setItems((all) =>
                        all.map((other) =>
                            other === item ? { ...item, quantity } : other
                        )
                    )
                }
                onRemove={(item) => {
                    onRemoveSpy?.(item.oracleId);
                    setItems((all) => all.filter((other) => other !== item));
                }}
                onClose={detail.close}
            />
        </>
    );
}

const sheet = () => document.querySelector('dialog') as HTMLDialogElement;

async function openSheet() {
    const user = userEvent.setup();
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

    it('updates the open sheet when the quantity changes', async () => {
        const user = await openSheet();
        await user.click(
            screen.getByRole('button', { name: 'Add one Island' })
        );
        expect(screen.getByLabelText('4 owned')).toHaveValue('4');
        await user.click(
            screen.getByRole('button', { name: 'Remove one Island' })
        );
        expect(screen.getByLabelText('3 owned')).toHaveValue('3');
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
        const user = userEvent.setup();
        render(<Harness onRemoveSpy={removed} />);
        await user.click(screen.getByRole('button', { name: 'Open Island' }));

        await user.click(
            within(sheet()).getByRole('button', { name: 'Remove' })
        );
        const [, confirm] = Array.from(document.querySelectorAll('dialog'));
        expect(confirm).toHaveAttribute('open');
        expect(removed).not.toHaveBeenCalled();

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
