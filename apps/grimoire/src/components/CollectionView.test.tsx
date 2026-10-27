import { render, screen, waitFor, within } from '@testing-library/react';
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

describe('CollectionView search', () => {
    it('has no Add Cards button, and one labelled search field', () => {
        render(<CollectionView />);
        expect(screen.queryByRole('button', { name: /add cards/i })).toBeNull();
        expect(search()).toHaveAttribute('placeholder', 'Search');
        expect(
            screen.queryByRole('heading', { name: 'Not in collection' })
        ).toBeNull();
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
