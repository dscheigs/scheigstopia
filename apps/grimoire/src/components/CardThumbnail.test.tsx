import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CardThumbnail from '@/components/CardThumbnail';

const id = '11bf83bb-c95b-4b4f-9a56-ce7a1816307a';

describe('CardThumbnail', () => {
    it('shows a lazy small image with fixed dimensions', () => {
        const { container } = render(
            <CardThumbnail imageId={id} name="Delver of Secrets" />
        );
        const img = container.querySelector('img')!;
        expect(img.getAttribute('src')).toContain(`/small/front/1/1/${id}`);
        expect(img).toHaveAttribute('loading', 'lazy');
        expect(img).toHaveAttribute('width');
        expect(img).toHaveAttribute('height');
    });

    it('opens the larger image on tap and closes it again', async () => {
        const user = userEvent.setup();
        render(<CardThumbnail imageId={id} name="Delver of Secrets" />);

        await user.click(screen.getByRole('button', { name: /show delver/i }));
        const preview = document.querySelector('dialog img');
        expect(preview?.getAttribute('src')).toContain(`/normal/front/1/1/`);

        await user.click(
            screen.getByRole('button', { name: /close preview/i })
        );
        expect(document.querySelector('dialog img')).toBeNull();
    });

    it('keeps the row footprint with no button when there is no image', () => {
        render(<CardThumbnail imageId={undefined} name="Mystery" />);
        expect(screen.queryByRole('button')).toBeNull();
    });

    describe('hover preview', () => {
        const preview = () =>
            document.querySelector<HTMLElement>('[data-card-preview]');

        // jsdom does no layout: the thumbnail and the preview get fixed boxes.
        function stubBoxes(thumb: Partial<DOMRect>) {
            vi.spyOn(
                HTMLElement.prototype,
                'getBoundingClientRect'
            ).mockImplementation(function (this: HTMLElement) {
                if (this.hasAttribute('data-card-preview')) {
                    return new DOMRect(0, 0, 300, 400);
                }
                return new DOMRect(thumb.left ?? 0, thumb.top ?? 0, 40, 56);
            });
        }

        afterEach(() => {
            vi.restoreAllMocks();
        });

        it('shows in a portal on the body on mouse hover only, and hides again', () => {
            stubBoxes({ left: 100, top: 100 });
            const { container } = render(
                <CardThumbnail imageId={id} name="Delver of Secrets" />
            );
            expect(preview()).toBeNull();

            const thumb = container.querySelector('button')!;
            fireEvent.pointerEnter(thumb, { pointerType: 'touch' });
            expect(preview()).toBeNull();

            fireEvent.pointerEnter(thumb, { pointerType: 'mouse' });
            expect(preview()).not.toBeNull();
            expect(container.contains(preview())).toBe(false);
            expect(preview()!.parentElement).toBe(document.body);
            expect(preview()).toHaveAttribute('aria-hidden', 'true');
            expect(preview()).toHaveClass('pointer-events-none');

            fireEvent.pointerLeave(thumb, { pointerType: 'mouse' });
            expect(preview()).toBeNull();
        });

        it('sits to the right of the thumbnail when there is room', () => {
            stubBoxes({ left: 100, top: 100 });
            const { container } = render(
                <CardThumbnail imageId={id} name="Delver of Secrets" />
            );
            fireEvent.pointerEnter(container.querySelector('button')!, {
                pointerType: 'mouse',
            });
            expect(preview()!.style.left).toBe('140px');
            expect(preview()!.style.top).toBe('100px');
        });

        it('flips left and stays inside the viewport near the edges', () => {
            window.innerWidth = 1000;
            window.innerHeight = 600;
            stubBoxes({ left: 900, top: 550 });
            const { container } = render(
                <CardThumbnail imageId={id} name="Delver of Secrets" />
            );
            fireEvent.pointerEnter(container.querySelector('button')!, {
                pointerType: 'mouse',
            });
            // Flipped: ends where the thumbnail starts. Clamped: 600 - 400.
            expect(preview()!.style.left).toBe('600px');
            expect(preview()!.style.top).toBe('200px');
        });
    });
});
