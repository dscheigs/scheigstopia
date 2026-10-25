import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
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
});
