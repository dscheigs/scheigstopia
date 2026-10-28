import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import AppGrid from '@/components/AppGrid';
import type { HubApp } from '@/data/apps';
import Home from '@/app/page';

const plain: HubApp = {
    name: 'Plain',
    description: 'No icon.',
    href: 'https://plain.test',
};
const withGnome: HubApp = {
    name: 'Book',
    description: 'Has the book gnome.',
    href: 'https://book.test',
    gnome: 'grimoire',
};

const render = (apps: HubApp[]) =>
    renderToStaticMarkup(createElement(AppGrid, { apps }));

describe('AppGrid', () => {
    it('renders a decorative gnome when the app provides one', () => {
        const html = render([withGnome]);
        expect(html).toContain('data-variant="grimoire"');
        expect(html).toContain('aria-hidden="true"');
        expect(html).toContain('Book');
        expect(html).toContain('Has the book gnome.');
    });

    it('renders a text-only card when the app has no gnome', () => {
        const html = render([plain]);
        expect(html).not.toContain('<svg');
        expect(html).toContain('Plain');
        expect(html).not.toContain('flex items-center');
    });

    it('shows the gnome only on the card that has one', () => {
        const html = render([plain, withGnome]);
        expect(html.match(/<svg/g)).toHaveLength(1);
    });
});

describe('Home page', () => {
    it('has one visually hidden h1 and no Welcome block or gnome', () => {
        const html = renderToStaticMarkup(createElement(Home));
        expect(html.match(/<h1/g)).toHaveLength(1);
        expect(html).toContain('<h1 class="sr-only">Scheigstopia</h1>');
        expect(html).not.toContain('Welcome');
        expect(html).not.toContain('<svg');
    });
});
