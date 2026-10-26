import { act, fireEvent, render, screen } from '@testing-library/react';
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

function renderList() {
    return render(
        <CollectionList
            items={items}
            imageIds={new Map()}
            busyId={null}
            onSetQuantity={() => {}}
            onRemove={() => {}}
        />
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

    it('reports changes for the row it was used on', () => {
        const onSetQuantity = vi.fn();
        const onRemove = vi.fn();
        render(
            <CollectionList
                items={items}
                imageIds={new Map()}
                busyId={null}
                onSetQuantity={onSetQuantity}
                onRemove={onRemove}
            />
        );
        fireEvent.click(screen.getByRole('button', { name: 'Add one Card 0' }));
        expect(onSetQuantity).toHaveBeenCalledWith(items[0], 2);

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Remove Card 0 from collection',
            })
        );
        expect(onRemove).toHaveBeenCalledWith(items[0]);
    });
});
