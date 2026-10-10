import { StrictMode } from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ReviewThumbnail from '@/components/ReviewThumbnail';

vi.mock('@/lib/scanQueueBlobs', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/lib/scanQueueBlobs')>()),
    getBlobs: vi.fn(async () => ({
        review: new Blob(['x'], { type: 'image/jpeg' }),
    })),
}));

// A browser fires a dialog's close event as a queued task after close(). The
// shared test shim fires it inline, which hides the dev-server bug this guards.
const original = {
    showModal: HTMLDialogElement.prototype.showModal,
    close: HTMLDialogElement.prototype.close,
    createObjectURL: URL.createObjectURL,
    revokeObjectURL: URL.revokeObjectURL,
};
beforeEach(() => {
    HTMLDialogElement.prototype.showModal = function showModal() {
        this.setAttribute('open', '');
    };
    HTMLDialogElement.prototype.close = function close() {
        if (!this.hasAttribute('open')) return;
        this.removeAttribute('open');
        setTimeout(() => this.dispatchEvent(new Event('close')), 0);
    };
    URL.createObjectURL = vi.fn(() => 'blob:review');
    URL.revokeObjectURL = vi.fn();
});
afterEach(() => {
    HTMLDialogElement.prototype.showModal = original.showModal;
    HTMLDialogElement.prototype.close = original.close;
    URL.createObjectURL = original.createObjectURL;
    URL.revokeObjectURL = original.revokeObjectURL;
});

const settle = () =>
    act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 20));
    });

describe.each([
    ['plain', false],
    ['StrictMode (the dev server)', true],
])('ReviewThumbnail in %s', (_name, strict) => {
    it('opens the photo when tapped and closes it from the button', async () => {
        const ui = <ReviewThumbnail id="a" label="Lightning Bolt" />;
        render(strict ? <StrictMode>{ui}</StrictMode> : ui);
        const user = userEvent.setup();

        await user.click(
            await screen.findByRole('button', {
                name: 'View photo of Lightning Bolt',
            })
        );
        await settle();
        expect(
            screen.getByRole('img', { name: 'Photo of Lightning Bolt' })
        ).toBeInTheDocument();
        expect(document.querySelector('dialog')).toHaveAttribute('open');

        await user.click(screen.getByRole('button', { name: 'Close photo' }));
        await settle();
        expect(
            screen.queryByRole('img', { name: 'Photo of Lightning Bolt' })
        ).toBeNull();
    });
});
