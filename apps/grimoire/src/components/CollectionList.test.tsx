import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CollectionList from '@/components/CollectionList';
import type { CollectionItem } from '@/lib/collection';

const ROW_HEIGHT = 100;
const COUNT = 3000;

const items: CollectionItem[] = Array.from({ length: COUNT }, (_, i) => ({
    oracleId: `id-${i}`,
    name: `Card ${i}`,
    quantity: (i % 4) + 1,
    updatedAt: '2026-01-01T00:00:00.000Z',
}));

function setScroll(y: number) {
    Object.defineProperty(window, 'scrollY', { value: y, configurable: true });
    act(() => {
        fireEvent.scroll(window);
    });
}

function renderList(onOpen: (item: CollectionItem) => void = () => {}) {
    return render(
        <CollectionList items={items} imageIds={new Map()} onOpen={onOpen} />
    );
}

function renderedRows() {
    return screen.getAllByRole('listitem');
}

// jsdom does no layout, so every element measures 0 tall and every row would
// "fit". Give rows a height (the virtualizer reads offsetHeight) and put the
// list at the top of the page: its top moves up as the page scrolls, as in a
// browser.
beforeEach(() => {
    // The virtualizer nudges the scroll position when rows are measured.
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(
        function (this: HTMLElement) {
            return this.tagName === 'LI' ? ROW_HEIGHT : 0;
        }
    );
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
        function (this: Element) {
            const top = -window.scrollY;
            return {
                x: 0,
                y: top,
                top,
                bottom: top,
                left: 0,
                right: 0,
                width: 0,
                height: 0,
                toJSON: () => ({}),
            } as DOMRect;
        }
    );
});

afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
});

describe('CollectionList', () => {
    it('mounts only a window of a few thousand rows', () => {
        renderList();
        const rows = renderedRows();
        expect(rows.length).toBeGreaterThan(0);
        expect(rows.length).toBeLessThan(60);
        expect(screen.getByText('Card 0')).toBeTruthy();
        expect(screen.queryByText(`Card ${COUNT - 1}`)).toBeNull();
    });

    it('says each row’s place in the whole list for assistive tech', () => {
        renderList();
        const first = renderedRows()[0];
        expect(first.getAttribute('aria-posinset')).toBe('1');
        expect(first.getAttribute('aria-setsize')).toBe(String(COUNT));
    });

    it('renders other rows after scrolling and drops the ones left behind', () => {
        renderList();
        // The very bottom of the page: everything above the last screenful.
        setScroll(ROW_HEIGHT * COUNT - window.innerHeight);

        expect(screen.getByText(`Card ${COUNT - 1}`)).toBeTruthy();
        expect(screen.queryByText('Card 0')).toBeNull();
        expect(renderedRows().length).toBeLessThan(60);
    });

    it('has one button per row and no quantity controls or Remove', () => {
        renderList();
        const rows = renderedRows();
        for (const row of rows) {
            expect(row.querySelectorAll('button')).toHaveLength(1);
        }
        expect(screen.queryByRole('button', { name: /^Add one/ })).toBeNull();
        expect(screen.queryByRole('button', { name: /^Remove/ })).toBeNull();
        expect(screen.queryByRole('textbox')).toBeNull();
    });

    it('shows the quantity as a badge and names it on the row button', () => {
        renderList();
        const row = renderedRows()[0];
        expect(row).toHaveTextContent('Card 0');
        expect(row).toHaveTextContent('×1');
        expect(
            screen.getByRole('button', { name: 'Card 1, 2 owned' })
        ).toBeTruthy();
    });

    it('marks each row as tappable with a chevron and a pressed state', () => {
        renderList();
        const row = screen.getAllByRole('button', { name: /owned$/ })[0];
        expect(row.querySelector('svg.lucide-chevron-right')).toHaveAttribute(
            'aria-hidden',
            'true'
        );
        expect(row.className).toContain('active:bg-surface-minimal-hover');
    });

    it('opens the tapped row, by click or by keyboard', async () => {
        const onOpen = vi.fn();
        renderList(onOpen);
        const user = userEvent.setup();

        await user.click(
            screen.getByRole('button', { name: 'Card 2, 3 owned' })
        );
        expect(onOpen).toHaveBeenLastCalledWith(items[2]);

        // Rows are reachable with Tab and activate with Enter and Space.
        screen.getByRole('button', { name: 'Card 3, 4 owned' }).focus();
        await user.keyboard('{Enter}');
        expect(onOpen).toHaveBeenLastCalledWith(items[3]);
        await user.keyboard(' ');
        expect(onOpen).toHaveBeenCalledTimes(3);
    });
});
