import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CatalogResults from '@/components/CatalogResults';
import { buildIndex, type CardNameFile } from '@/lib/cardSearch';

const mutate = vi.fn();
let addState: { isPending: boolean; variables?: { oracleId: string } } = {
    isPending: false,
};
let scryfall: { data: { oracleId: string; name: string } | null } = {
    data: null,
};

vi.mock('@/lib/queries', () => ({
    useAddCard: () => ({ mutate, ...addState }),
    useScryfallCard: () => ({ ...scryfall, isFetching: false }),
}));

const file: CardNameFile = {
    version: 't',
    count: 4,
    cards: [
        ['o-bolt', 'Lightning Bolt'],
        ['o-chain', 'Chain Lightning'],
        ['o-ring', 'Sol Ring'],
        ['o-star', 'Lightning Star'],
    ],
};
const index = buildIndex(file);

function renderResults(props: Partial<Parameters<typeof CatalogResults>[0]>) {
    return render(
        <CatalogResults
            query="lightning"
            index={index}
            cardListState="ready"
            ownedIds={new Set()}
            imageIds={new Map()}
            {...props}
        />
    );
}

beforeEach(() => {
    mutate.mockReset();
    addState = { isPending: false };
    scryfall = { data: null };
});

describe('CatalogResults', () => {
    it('renders nothing under three characters', () => {
        const { container } = renderResults({ query: 'li' });
        expect(container).toBeEmptyDOMElement();
        expect(
            renderResults({ query: '  l ' }).container.querySelector('section')
        ).toBeNull();
    });

    it('lists matching cards under "Not in collection" from three characters', () => {
        renderResults({ query: 'lig' });
        expect(
            screen.getByRole('heading', { name: 'Not in collection' })
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', {
                name: 'Add Lightning Bolt to your collection',
            })
        ).toBeInTheDocument();
    });

    it('leaves out cards the user already owns', () => {
        renderResults({ ownedIds: new Set(['o-bolt']) });
        expect(screen.queryByText('Lightning Bolt')).toBeNull();
        expect(screen.getByText('Chain Lightning')).toBeInTheDocument();
    });

    it('caps the rows, and owned cards do not use up the cap', () => {
        const many: CardNameFile = {
            version: 't',
            count: 40,
            cards: Array.from({ length: 40 }, (_, i) => [
                `o-${i}`,
                `Lightning Card ${String(i).padStart(2, '0')}`,
            ]),
        };
        const owned = new Set(many.cards.slice(0, 10).map(([id]) => id));
        renderResults({ index: buildIndex(many), ownedIds: owned });
        const rows = screen.getAllByRole('listitem');
        expect(rows).toHaveLength(20);
        for (const [, name] of many.cards.slice(0, 10)) {
            expect(screen.queryByText(name)).toBeNull();
        }
        expect(screen.getByText('Lightning Card 10')).toBeInTheDocument();
        expect(screen.getByText('Lightning Card 29')).toBeInTheDocument();
        expect(screen.queryByText('Lightning Card 30')).toBeNull();
    });

    it('opens the full-screen card from the thumbnail without adding it', async () => {
        renderResults({
            ownedIds: new Set(['o-chain']),
            imageIds: new Map([
                ['o-bolt', '11bf83bb-c95b-4b4f-9a56-ce7a1816307a'],
            ]),
        });
        await userEvent.click(
            screen.getByRole('button', { name: 'Show Lightning Bolt' })
        );
        expect(document.querySelector('dialog img')).not.toBeNull();
        expect(mutate).not.toHaveBeenCalled();
    });

    it('adds the card whose + was pressed', async () => {
        renderResults({});
        await userEvent.click(
            screen.getByRole('button', {
                name: 'Add Chain Lightning to your collection',
            })
        );
        expect(mutate).toHaveBeenCalledWith(
            expect.objectContaining({
                oracleId: 'o-chain',
                name: 'Chain Lightning',
            }),
            expect.any(Object)
        );
    });

    it('announces an add, and tells the page so it can refocus the search', async () => {
        const onAdded = vi.fn();
        mutate.mockImplementation((_card, options) => options.onSuccess());
        renderResults({ onAdded });
        await userEvent.click(
            screen.getByRole('button', {
                name: 'Add Chain Lightning to your collection',
            })
        );
        expect(onAdded).toHaveBeenCalledOnce();
        expect(screen.getByRole('status')).toHaveTextContent(
            'Added Chain Lightning.'
        );
    });

    it('disables the row that is saving, and no other', () => {
        addState = { isPending: true, variables: { oracleId: 'o-chain' } };
        renderResults({});
        expect(
            screen.getByRole('button', {
                name: 'Add Chain Lightning to your collection',
            })
        ).toBeDisabled();
        expect(
            screen.getByRole('button', {
                name: 'Add Lightning Bolt to your collection',
            })
        ).toBeEnabled();
    });

    it('shows a spinner while the card list loads, with no rows', () => {
        renderResults({ index: null, cardListState: 'loading' });
        expect(screen.getByText('Loading')).toBeInTheDocument();
        expect(screen.queryByRole('list')).toBeNull();
    });

    it('says the list is missing, without blocking anything', () => {
        renderResults({ index: null, cardListState: 'missing' });
        expect(
            screen.getByText(/card list has not been built/i)
        ).toBeInTheDocument();
    });

    it('offers a Scryfall card when the list matches nothing', async () => {
        scryfall = { data: { oracleId: 'o-new', name: 'Brand New Card' } };
        renderResults({ query: 'brand new card' });
        await userEvent.click(
            await screen.findByRole('button', { name: /Brand New Card/ })
        );
        expect(mutate).toHaveBeenCalledWith(
            expect.objectContaining({ oracleId: 'o-new' }),
            expect.any(Object)
        );
    });

    it('does not ask Scryfall when the only matches are cards already owned', () => {
        scryfall = { data: { oracleId: 'o-bolt', name: 'Lightning Bolt' } };
        renderResults({
            query: 'sol ring',
            ownedIds: new Set(['o-ring']),
        });
        expect(screen.queryByText(/Not in the card list yet/)).toBeNull();
    });
});
