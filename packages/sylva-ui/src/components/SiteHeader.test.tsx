import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import SiteHeader from './SiteHeader';

// Link renders an <a> in jsdom too, so tell the two apart by a marker.
vi.mock('next/link', () => ({
    default: ({ href, ...rest }: { href: string }) => (
        <a href={href} data-client-link="" {...rest} />
    ),
}));

const nav = [
    { name: 'Grimoire', href: '/grimoire' },
    { name: 'About Me', href: '/about', sameApp: true, current: true },
];

describe('SiteHeader', () => {
    it('always links the gnome to the site root with a plain anchor', () => {
        render(<SiteHeader nav={nav} app={{ name: 'Grimoire', href: '/' }} />);
        const home = screen.getByRole('link', { name: 'Scheigstopia - Home' });
        expect(home).toHaveAttribute('href', '/');
        expect(home).not.toHaveAttribute('data-client-link');
    });

    it('shows the app name after the gnome only inside an app', () => {
        const { rerender } = render(<SiteHeader nav={nav} />);
        expect(
            screen
                .queryAllByRole('link', { name: 'Grimoire' })
                .filter((link) => link.classList.contains('text-subheading'))
        ).toHaveLength(0);

        rerender(
            <SiteHeader nav={nav} app={{ name: 'Grimoire', href: '/' }} />
        );
        const label = screen.getAllByRole('link', { name: 'Grimoire' })[0];
        expect(label).toHaveAttribute('href', '/');
        expect(label).toHaveAttribute('data-client-link');
    });

    it('renders cross-zone links as plain anchors and same-app links as <Link>', () => {
        render(<SiteHeader nav={nav} />);
        const main = screen.getByRole('navigation', { name: 'Main' });
        const app = within(main).getByRole('link', { name: 'Grimoire' });
        const about = within(main).getByRole('link', { name: 'About Me' });
        expect(app).not.toHaveAttribute('data-client-link');
        expect(about).toHaveAttribute('data-client-link');
    });

    it('marks the current page', () => {
        render(<SiteHeader nav={nav} />);
        const main = screen.getByRole('navigation', { name: 'Main' });
        expect(
            within(main).getByRole('link', { name: 'About Me' })
        ).toHaveAttribute('aria-current', 'page');
        expect(
            within(main).getByRole('link', { name: 'Grimoire' })
        ).not.toHaveAttribute('aria-current');
    });

    it('shows the actions in the desktop nav and the mobile menu', () => {
        render(<SiteHeader nav={nav} actions={<button>Sign out</button>} />);
        expect(
            screen.getAllByRole('button', { name: 'Sign out' })
        ).toHaveLength(2);
    });

    it('opens and closes the mobile menu', async () => {
        const user = userEvent.setup();
        render(<SiteHeader nav={nav} />);
        const toggle = screen.getByRole('button', { name: 'Open main menu' });
        const menu = document.getElementById('mobile-menu');

        expect(toggle).toHaveAttribute('aria-expanded', 'false');
        expect(menu).toHaveAttribute('inert');

        await user.click(toggle);
        expect(toggle).toHaveAttribute('aria-expanded', 'true');
        expect(menu).not.toHaveAttribute('inert');

        await user.click(
            within(menu as HTMLElement).getByRole('link', { name: 'About Me' })
        );
        expect(toggle).toHaveAttribute('aria-expanded', 'false');
    });

    it('has no menu button when there is nothing to show', () => {
        render(<SiteHeader nav={[]} app={{ name: 'Grimoire', href: '/' }} />);
        expect(
            screen.queryByRole('button', { name: 'Open main menu' })
        ).not.toBeInTheDocument();
    });
});
