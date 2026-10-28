import {
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CollectionView from '@/components/CollectionView';
import type { CardNameFile } from '@/lib/cardSearch';
import type { CollectionItem } from '@/lib/collection';

const item = (
    oracleId: string,
    name: string,
    quantity = 1
): CollectionItem => ({
    oracleId,
    name,
    quantity,
    updatedAt: '2026-01-01T00:00:00.000Z',
});

const cardList: CardNameFile = {
    version: 't',
    count: 4,
    cards: [
        ['o-bolt', 'Lightning Bolt'],
        ['o-chain', 'Chain Lightning'],
        ['o-ring', 'Sol Ring'],
        ['o-island', 'Island'],
    ],
};

let collection: {
    data: CollectionItem[] | undefined;
    isError: boolean;
    error: Error | null;
};
let names: {
    data: CardNameFile | undefined;
    isError: boolean;
    isPending: boolean;
};
const mutate = vi.fn();

vi.mock('@/lib/queries', () => ({
    useCollection: () => collection,
    useCardNames: () => names,
    useSetQuantity: () => ({
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        error: null,
    }),
    useAddCard: () => ({ mutate, isPending: false }),
    useScryfallCard: () => ({ data: null, isFetching: false }),
}));

vi.mock('@/lib/useUrlDialogState', () => ({
    useUrlDialogState: () => ({
        open: false,
        value: null,
        show: vi.fn(),
        close: vi.fn(),
    }),
}));

// jsdom does no layout: give list rows a height and the list a place on the page.
beforeEach(() => {
    collection = {
        data: [item('o-bolt', 'Lightning Bolt', 4), item('o-ring', 'Sol Ring')],
        isError: false,
        error: null,
    };
    names = { data: cardList, isError: false, isPending: false };
    mutate.mockReset();
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(
        function (this: HTMLElement) {
            return this.tagName === 'LI' ? 80 : 0;
        }
    );
});

afterEach(() => {
    vi.restoreAllMocks();
});

const search = () =>
    screen.getByRole('searchbox', {
        name: 'Search your collection and all cards',
    });

describe('CollectionView controls', () => {
    it('keeps the search field and Export in one sticky block under the header', () => {
        render(<CollectionView />);
        const block = search().closest('.sticky');
        expect(block).not.toBeNull();
        expect(block).toHaveClass(
            'top-(--header-height)',
            'z-40',
            'bg-background'
        );
        expect(
            within(block as HTMLElement).getByRole('button', { name: 'Export' })
        ).toBeInTheDocument();
        // The section heading sticks below the block, not inside it.
        expect(
            within(block as HTMLElement).queryByRole('heading', {
                name: 'Your collection',
            })
        ).toBeNull();
        // The list scrolls beneath it, outside the block.
        expect(
            within(block as HTMLElement).queryByRole('button', {
                name: 'Lightning Bolt, 4 owned',
            })
        ).toBeNull();
    });

    it('sticks each section heading below the controls, within its own section', async () => {
        render(<CollectionView />);
        await userEvent.type(search(), 'lightning');
        const collectionHeading = screen
            .getByRole('heading', { name: 'Your collection' })
            .closest('.sticky');
        const catalogHeading = await screen.findByRole('heading', {
            name: 'Not in collection',
        });
        for (const sticky of [collectionHeading, catalogHeading]) {
            expect(sticky).toHaveClass(
                'sticky',
                'top-(--sticky-offset)',
                'z-30',
                'bg-background'
            );
        }
        // Each heading's container ends with its section, so the next heading takes over.
        const list = screen.getByRole('button', {
            name: 'Lightning Bolt, 4 owned',
        });
        expect(collectionHeading?.parentElement?.contains(list)).toBe(true);
        expect(collectionHeading?.parentElement?.contains(catalogHeading)).toBe(
            false
        );
        expect(catalogHeading.closest('section')).not.toBe(
            collectionHeading?.closest('section')
        );
    });

    it('shows the counts in the sticky heading row', () => {
        render(<CollectionView />);
        const row = screen
            .getByRole('heading', { name: 'Your collection' })
            .closest('.sticky') as HTMLElement;
        expect(within(row).getByText('2 unique, 5 total')).toBeInTheDocument();
    });

    it('blurs the search field when a touch scroll starts, but not a tap', async () => {
        render(<CollectionView />);
        search().focus();
        const touch = (type: string, clientY: number) =>
            fireEvent(
                document.body,
                Object.assign(new Event(type, { bubbles: true }), {
                    touches: [{ clientY }],
                })
            );
        touch('touchstart', 300);
        touch('touchmove', 296);
        expect(search()).toHaveFocus();
        touch('touchmove', 200);
        expect(search()).not.toHaveFocus();
    });

    it('shows a clear button with text; it empties the search and refocuses it', async () => {
        render(<CollectionView />);
        expect(
            screen.queryByRole('button', { name: 'Clear search' })
        ).toBeNull();
        await userEvent.type(search(), 'lightning');
        await userEvent.click(
            screen.getByRole('button', { name: 'Clear search' })
        );
        expect(search()).toHaveValue('');
        expect(search()).toHaveFocus();
    });

    it('focuses and selects the search field on Ctrl+K from anywhere', async () => {
        vi.spyOn(navigator, 'platform', 'get').mockReturnValue('Win32');
        render(<CollectionView />);
        await userEvent.type(search(), 'bolt');
        screen.getByRole('button', { name: 'Export' }).focus();
        const event = new KeyboardEvent('keydown', {
            key: 'k',
            ctrlKey: true,
            cancelable: true,
        });
        window.dispatchEvent(event);
        expect(event.defaultPrevented).toBe(true);
        expect(search()).toHaveFocus();
        expect((search() as HTMLInputElement).selectionEnd).toBe('bolt'.length);
    });

    it('publishes the sticky block and heading heights for scroll padding, and removes them on unmount', () => {
        const names = ['--sticky-controls-height', '--sticky-heading-height'];
        const { unmount } = render(<CollectionView />);
        for (const name of names) {
            expect(
                document.documentElement.style.getPropertyValue(name)
            ).not.toBe('');
        }
        unmount();
        for (const name of names) {
            expect(document.documentElement.style.getPropertyValue(name)).toBe(
                ''
            );
        }
    });
});

describe('CollectionView search', () => {
    it('has no Add Cards button, and one labelled search field', () => {
        render(<CollectionView />);
        expect(screen.queryByRole('button', { name: /add cards/i })).toBeNull();
        expect(search()).toHaveAttribute('placeholder', 'Search');
        expect(
            screen.queryByRole('heading', { name: 'Not in collection' })
        ).toBeNull();
    });

    it('puts the search field above the collection heading, the list and the suggestions', async () => {
        render(<CollectionView />);
        await userEvent.type(search(), 'lightning');
        const catalog = await screen.findByRole('heading', {
            name: 'Not in collection',
        });
        const heading = screen.getByRole('heading', {
            name: 'Your collection',
        });
        const list = screen.getByRole('button', {
            name: 'Lightning Bolt, 4 owned',
        });
        const before = (a: Node, b: Node) =>
            Boolean(
                a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING
            );
        expect(before(search(), heading)).toBe(true);
        expect(before(heading, list)).toBe(true);
        expect(before(list, catalog)).toBe(true);
    });

    it('invites a search when nothing is owned', () => {
        collection.data = [];
        render(<CollectionView />);
        expect(
            screen.getByText('Nothing here yet. Search for a card to add it.')
        ).toBeInTheDocument();
    });

    it('filters the owned cards, and suggests unowned ones below, from three characters', async () => {
        render(<CollectionView />);
        await userEvent.type(search(), 'lightning');

        await waitFor(() =>
            expect(
                screen.getByRole('heading', { name: 'Not in collection' })
            ).toBeInTheDocument()
        );
        // Owned: Lightning Bolt stays in the list, Sol Ring is filtered out.
        expect(
            screen.getByRole('button', { name: 'Lightning Bolt, 4 owned' })
        ).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Sol Ring/ })).toBeNull();
        // Not owned: Chain Lightning is offered; the owned bolt is not.
        const suggestions = screen
            .getByRole('heading', { name: 'Not in collection' })
            .closest('section') as HTMLElement;
        expect(
            within(suggestions).getByRole('button', {
                name: 'Add Chain Lightning to your collection',
            })
        ).toBeInTheDocument();
        expect(
            within(suggestions).queryByRole('button', {
                name: 'Add Lightning Bolt to your collection',
            })
        ).toBeNull();
    });

    it('filters at two characters but shows no suggestions yet', async () => {
        render(<CollectionView />);
        await userEvent.type(search(), 'so');
        await waitFor(() =>
            expect(
                screen.queryByRole('button', { name: /Lightning Bolt/ })
            ).toBeNull()
        );
        expect(
            screen.getByRole('button', { name: /Sol Ring/ })
        ).toBeInTheDocument();
        expect(
            screen.queryByRole('heading', { name: 'Not in collection' })
        ).toBeNull();
    });

    it('says when no owned card matches, and still offers the catalog', async () => {
        render(<CollectionView />);
        await userEvent.type(search(), 'island');
        expect(
            await screen.findByText('No cards in your collection match.')
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', {
                name: 'Add Island to your collection',
            })
        ).toBeInTheDocument();
    });

    it('searches the collection while the card list is loading, and says why there are no suggestions', async () => {
        names = { data: undefined, isError: false, isPending: true };
        render(<CollectionView />);
        await userEvent.type(search(), 'sol ring');
        await waitFor(() =>
            expect(
                screen.queryByRole('button', { name: /Lightning Bolt/ })
            ).toBeNull()
        );
        expect(
            screen.getByRole('button', { name: /Sol Ring/ })
        ).toBeInTheDocument();
        expect(screen.getByText('Loading')).toBeInTheDocument();
    });

    it('says the card list is missing, with the owned search still working', async () => {
        names = { data: undefined, isError: true, isPending: false };
        render(<CollectionView />);
        await userEvent.type(search(), 'sol ring');
        expect(
            await screen.findByText(/card list has not been built/i)
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /Sol Ring/ })
        ).toBeInTheDocument();
    });
});
