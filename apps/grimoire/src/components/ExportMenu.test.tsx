import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import ExportMenu from '@/components/ExportMenu';

describe('ExportMenu', () => {
    it('shows one Export button and keeps the formats hidden until opened', () => {
        render(<ExportMenu />);
        expect(screen.getByRole('button', { name: 'Export' })).toBeTruthy();
        expect(screen.queryByRole('link')).toBeNull();
    });

    it('offers both formats as downloads', async () => {
        render(<ExportMenu />);
        await userEvent.click(screen.getByRole('button', { name: 'Export' }));
        const txt = screen.getByRole('link', { name: 'Text list (.txt)' });
        const csv = screen.getByRole('link', { name: 'Spreadsheet (.csv)' });
        expect(txt.getAttribute('href')).toBe('/api/export');
        expect(csv.getAttribute('href')).toBe('/api/export?format=csv');
    });

    it('closes on Escape and after choosing a format', async () => {
        render(<ExportMenu />);
        const button = screen.getByRole('button', { name: 'Export' });
        await userEvent.click(button);
        await userEvent.keyboard('{Escape}');
        expect(screen.queryByRole('link')).toBeNull();

        await userEvent.click(button);
        await userEvent.click(
            screen.getByRole('link', { name: 'Spreadsheet (.csv)' })
        );
        expect(screen.queryByRole('link')).toBeNull();
    });
});
