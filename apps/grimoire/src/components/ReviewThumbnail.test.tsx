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

const IMAGE_ID = 'e3285e6b-3e79-4d7c-bf96-d6920f1c4b5b';

describe('ReviewThumbnail with a matched card image', () => {
    it('shows the catalog card in the row, not the photo', async () => {
        render(
            <ReviewThumbnail id="a" label="Lightning Bolt" imageId={IMAGE_ID} />
        );
        const button = await screen.findByRole('button', {
            name: 'Compare Lightning Bolt with your photo',
        });
        expect(button.querySelector('img')).toHaveAttribute(
            'src',
            expect.stringContaining('/small/front/')
        );
        expect(
            screen.queryByRole('button', {
                name: 'View photo of Lightning Bolt',
            })
        ).toBeNull();
    });

    it('opens the card beside the photo in one tap, and closes again', async () => {
        render(
            <ReviewThumbnail id="a" label="Lightning Bolt" imageId={IMAGE_ID} />
        );
        const user = userEvent.setup();
        await settle();
        await user.click(
            screen.getByRole('button', {
                name: 'Compare Lightning Bolt with your photo',
            })
        );
        await settle();
        expect(
            screen.getByRole('img', { name: 'Lightning Bolt (matched card)' })
        ).toHaveAttribute('src', expect.stringContaining('/normal/front/'));
        expect(
            screen.getByRole('img', { name: 'Photo of Lightning Bolt' })
        ).toBeInTheDocument();
        expect(screen.getByText('Matched card')).toBeInTheDocument();
        expect(screen.getByText('Your photo')).toBeInTheDocument();

        await user.click(
            screen.getByRole('button', { name: 'Close comparison' })
        );
        await settle();
        expect(
            screen.queryByRole('img', { name: 'Lightning Bolt (matched card)' })
        ).toBeNull();
    });

    it('falls back to the photo for an image id that is not a uuid', async () => {
        render(
            <ReviewThumbnail id="a" label="Lightning Bolt" imageId="nope" />
        );
        expect(
            await screen.findByRole('button', {
                name: 'View photo of Lightning Bolt',
            })
        ).toBeInTheDocument();
    });

    it('falls back to the photo when there is no image id', async () => {
        render(<ReviewThumbnail id="a" label="Lightning Bolt" />);
        expect(
            await screen.findByRole('button', {
                name: 'View photo of Lightning Bolt',
            })
        ).toBeInTheDocument();
    });
});
