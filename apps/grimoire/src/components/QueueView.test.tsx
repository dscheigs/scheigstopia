import { useSyncExternalStore } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createStore } from 'zustand/vanilla';
import QueueView from '@/components/QueueView';
import { confirmPatch, renamePatch } from '@/lib/queueReview';
import type { QueueItem } from '@/lib/scanQueueTypes';

// A small in-memory stand-in for the scan queue store. It applies the real
// confirm and rename patches, so the view re-renders as it would in the app.
function createFakeQueue(initial: QueueItem[]) {
    const store = createStore<{
        items: QueueItem[];
        remove: (id: string) => void;
        removeMany: (ids: string[]) => void;
        retry: (id: string) => void;
        confirm: (id: string) => void;
        rename: (id: string, card: { oracleId: string; name: string }) => void;
        clear: () => void;
    }>((set) => {
        const patchItem = (
            id: string,
            patchOf: (item: QueueItem) => Partial<QueueItem> | null
        ) =>
            set((state) => ({
                items: state.items.map((item) => {
                    if (item.id !== id) return item;
                    const patch = patchOf(item);
                    return patch ? { ...item, ...patch } : item;
                }),
            }));
        return {
            items: initial,
            remove: (id) =>
                set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
            removeMany: (ids) =>
                set((s) => ({
                    items: s.items.filter((i) => !ids.includes(i.id)),
                })),
            retry: vi.fn(),
            confirm: (id) => patchItem(id, confirmPatch),
            rename: (id, card) =>
                patchItem(id, (item) => renamePatch(card, item)),
            clear: () => set({ items: [] }),
        };
    });
    return store;
}

let fake = createFakeQueue([]);

vi.mock('@/lib/useScanQueue', () => ({
    useScanQueue: () => ({
        items: useSyncExternalStore(
            fake.subscribe,
            () => fake.getState().items
        ),
        ready: true,
        store: fake,
    }),
}));

const BOLT_IMAGE_ID = 'e3285e6b-3e79-4d7c-bf96-d6920f1c4b5b';

const scryfallCards: Record<string, { oracleId: string; name: string }> = {
    'brand new card': { oracleId: 'o-new', name: 'Brand New Card' },
};

vi.mock('@/lib/queries', () => ({
    useScryfallCard: (name: string, enabled: boolean) => ({
        data: enabled
            ? (scryfallCards[name.trim().toLowerCase()] ?? null)
            : undefined,
        isFetching: false,
    }),
    useCardNames: () => ({
        data: {
            version: 'test',
            count: 2,
            cards: [
                ['o-bolt', 'Lightning Bolt', BOLT_IMAGE_ID],
                ['o-bear', 'Grizzly Bears'],
            ],
        },
    }),
    useCommitQueue: () => ({
        mutate: commitMutate,
        reset: vi.fn(),
        isPending: false,
        error: null,
    }),
    useLocations: () => ({
        data: [
            {
                id: 'bag-1',
                kind: 'bulk',
                label: 'Old bag',
                note: null,
                parentId: null,
                archivedAt: null,
                createdAt: '2026-10-01T00:00:00.000Z',
                cardCount: 4,
            },
        ],
    }),
}));

const commitMutate = vi.hoisted(() => vi.fn());

// The thumbnail reads image blobs from IndexedDB, which jsdom does not have.
vi.mock('@/lib/scanQueueBlobs', () => ({
    getBlobs: () => Promise.resolve(undefined),
    pickReviewBlob: () => undefined,
}));

let nextId = 0;
function makeItem(overrides: Partial<QueueItem>): QueueItem {
    nextId += 1;
    return {
        id: `item-${nextId}`,
        createdAt: nextId,
        status: 'identified',
        readName: null,
        matchedCard: null,
        flagReason: 'none',
        attempts: 0,
        nextAttemptAt: null,
        ...overrides,
    };
}

const bolt = { oracleId: 'o-bolt', name: 'Lightning Bolt' };

function renderQueue(items: QueueItem[]) {
    fake = createFakeQueue(items);
    return render(<QueueView userId="user-1" />);
}

function rowsIn(heading: RegExp) {
    const section = screen
        .getByRole('heading', { name: heading })
        .closest('section') as HTMLElement;
    return within(section).getAllByRole('listitem');
}

describe('QueueView', () => {
    beforeEach(() => {
        nextId = 0;
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('shows the empty state with no items', () => {
        renderQueue([]);
        expect(screen.getByText('The queue is empty.')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /discard/i })).toBeNull();
    });

    it('shows the matched card image in the row, and the photo when there is no image', () => {
        renderQueue([
            makeItem({ matchedCard: bolt }),
            makeItem({
                matchedCard: { oracleId: 'o-bear', name: 'Grizzly Bears' },
            }),
        ]);
        const rows = rowsIn(/ready to add/i);
        const boltThumb = within(rows[0]).getByRole('button', {
            name: 'Compare Lightning Bolt with your photo',
        });
        expect(boltThumb.querySelector('img')).toHaveAttribute(
            'src',
            expect.stringContaining(`/small/front/e/3/${BOLT_IMAGE_ID}.jpg`)
        );
        // No catalog image for this card and no photo in the test: just a frame.
        expect(
            within(rows[1]).queryByRole('button', { name: /compare/i })
        ).toBeNull();
    });

    it('groups items by status and orders each group oldest first', () => {
        renderQueue([
            makeItem({
                id: 'ready-late',
                createdAt: 50,
                matchedCard: { oracleId: 'a', name: 'Ready Late' },
            }),
            makeItem({
                id: 'review-late',
                createdAt: 40,
                status: 'flagged',
                flagReason: 'fuzzy-match',
                matchedCard: { oracleId: 'b', name: 'Review Late' },
            }),
            makeItem({
                id: 'ready-early',
                createdAt: 10,
                matchedCard: { oracleId: 'c', name: 'Ready Early' },
            }),
            makeItem({ id: 'waiting', createdAt: 30, status: 'queued' }),
            makeItem({
                id: 'review-early',
                createdAt: 20,
                status: 'failed',
                flagReason: 'error',
                readName: 'Review Early',
            }),
        ]);

        const headings = screen
            .getAllByRole('heading', { level: 2 })
            .map((h) => h.textContent);
        expect(headings).toEqual([
            'Needs a look (2)',
            'Being read (1)',
            'Ready to add (2)',
        ]);

        const text = (rows: HTMLElement[]) =>
            rows.map((row) => row.querySelector('p')?.textContent);
        expect(text(rowsIn(/needs a look/i))).toEqual([
            'Review Early',
            'Review Late',
        ]);
        expect(text(rowsIn(/being read/i))).toEqual(['Waiting to be read']);
        expect(text(rowsIn(/ready to add/i))).toEqual([
            'Ready Early',
            'Ready Late',
        ]);
    });

    it('explains why an item needs review, and only those items', () => {
        renderQueue([
            makeItem({
                status: 'flagged',
                flagReason: 'ambiguous',
                matchedCard: bolt,
            }),
            makeItem({ matchedCard: { oracleId: 'x', name: 'Fine Card' } }),
        ]);
        expect(
            screen.getByText('Could be more than one card')
        ).toBeInTheDocument();
        expect(screen.getAllByText(/could be|not an exact/i)).toHaveLength(1);
    });

    it('shows the confirm check only on items that need review with a card', () => {
        renderQueue([
            makeItem({
                status: 'flagged',
                flagReason: 'fuzzy-match',
                matchedCard: bolt,
            }),
            makeItem({
                status: 'flagged',
                flagReason: 'no-match',
                readName: 'Blurry Thing',
            }),
            makeItem({
                status: 'failed',
                flagReason: 'error',
                matchedCard: { oracleId: 'f', name: 'Failed Card' },
            }),
            makeItem({ matchedCard: { oracleId: 'r', name: 'Ready Card' } }),
            makeItem({ status: 'queued' }),
        ]);

        expect(
            screen.getByRole('button', { name: 'Confirm Lightning Bolt' })
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Confirm Failed Card' })
        ).toBeInTheDocument();
        // No card to confirm, already identified, or still waiting.
        expect(
            screen.queryByRole('button', { name: 'Confirm Blurry Thing' })
        ).toBeNull();
        expect(
            screen.queryByRole('button', { name: 'Confirm Ready Card' })
        ).toBeNull();
        expect(
            screen.queryByRole('button', { name: /confirm waiting/i })
        ).toBeNull();
        expect(
            screen.getAllByRole('button', { name: /^confirm /i })
        ).toHaveLength(2);
    });

    it('confirming moves the item to Ready to add', async () => {
        const user = userEvent.setup();
        renderQueue([
            makeItem({
                status: 'flagged',
                flagReason: 'fuzzy-match',
                matchedCard: bolt,
            }),
        ]);
        await user.click(
            screen.getByRole('button', { name: 'Confirm Lightning Bolt' })
        );
        expect(
            screen.queryByRole('heading', { name: /needs a look/i })
        ).toBeNull();
        expect(rowsIn(/ready to add/i)).toHaveLength(1);
        expect(
            screen.getByRole('button', { name: 'Commit 1 card' })
        ).toBeEnabled();
    });

    it('asks which bag, defaulting to a new one labelled with today', async () => {
        const user = userEvent.setup();
        commitMutate.mockClear();
        renderQueue([makeItem({ matchedCard: bolt })]);
        await user.click(screen.getByRole('button', { name: 'Commit 1 card' }));
        const dialog = await screen.findByRole('dialog');
        const label = (
            within(dialog).getByLabelText('Bag label') as HTMLInputElement
        ).value;
        expect(label).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        // Nothing is sent until the dialog is confirmed.
        expect(commitMutate).not.toHaveBeenCalled();

        await user.click(
            within(dialog).getByRole('button', { name: 'Commit 1 card' })
        );
        expect(commitMutate).toHaveBeenCalledTimes(1);
        expect(commitMutate.mock.calls[0][0]).toMatchObject({
            items: [{ oracleId: 'o-bolt', name: 'Lightning Bolt', delta: 1 }],
            destination: { newBag: { label } },
        });
    });

    it('commits into an existing bag', async () => {
        const user = userEvent.setup();
        commitMutate.mockClear();
        renderQueue([makeItem({ matchedCard: bolt })]);
        await user.click(screen.getByRole('button', { name: 'Commit 1 card' }));
        const dialog = await screen.findByRole('dialog');
        await user.click(
            within(dialog).getByRole('radio', { name: 'An existing bag' })
        );
        expect(
            (within(dialog).getByLabelText('Existing bag') as HTMLSelectElement)
                .value
        ).toBe('bag-1');
        await user.click(
            within(dialog).getByRole('button', { name: 'Commit 1 card' })
        );
        expect(commitMutate.mock.calls[0][0]).toMatchObject({
            destination: { locationId: 'bag-1' },
        });
    });

    it('does not send an empty bag label', async () => {
        const user = userEvent.setup();
        commitMutate.mockClear();
        renderQueue([makeItem({ matchedCard: bolt })]);
        await user.click(screen.getByRole('button', { name: 'Commit 1 card' }));
        const dialog = await screen.findByRole('dialog');
        await user.clear(within(dialog).getByLabelText('Bag label'));
        await user.click(
            within(dialog).getByRole('button', { name: 'Commit 1 card' })
        );
        expect(await within(dialog).findByRole('alert')).toBeTruthy();
        expect(commitMutate).not.toHaveBeenCalled();
    });

    it('removes a row', async () => {
        const user = userEvent.setup();
        renderQueue([
            makeItem({ matchedCard: bolt }),
            makeItem({
                matchedCard: { oracleId: 'o-bear', name: 'Grizzly Bears' },
            }),
        ]);
        await user.click(
            screen.getByRole('button', { name: 'Remove Lightning Bolt' })
        );
        expect(screen.queryByText('Lightning Bolt')).toBeNull();
        expect(screen.getByText('Grizzly Bears')).toBeInTheDocument();
        expect(
            screen.getByRole('heading', { name: 'Ready to add (1)' })
        ).toBeInTheDocument();
    });

    describe('editing through the dialog', () => {
        it('opens for the row, with its suggestions, and renames on a suggestion', async () => {
            const user = userEvent.setup();
            renderQueue([
                makeItem({
                    status: 'flagged',
                    flagReason: 'ambiguous',
                    readName: 'Lightnin Bolt',
                    matchedCard: { oracleId: 'o-bear', name: 'Grizzly Bears' },
                    candidates: [
                        { oracleId: 'o-bear', name: 'Grizzly Bears' },
                        bolt,
                    ],
                }),
            ]);
            await user.click(
                screen.getByRole('button', { name: 'Edit Grizzly Bears' })
            );

            const dialog = screen.getByRole('dialog', { name: 'Edit card' });
            expect(dialog).toBeVisible();
            expect(
                within(dialog).getByText('Now: Grizzly Bears')
            ).toBeInTheDocument();
            // The current card is not offered back as a suggestion.
            const suggestions = within(dialog)
                .getByRole('heading', { name: 'Or one of these' })
                .closest('section') as HTMLElement;
            expect(within(suggestions).getAllByRole('button')).toHaveLength(1);

            await user.click(
                within(suggestions).getByRole('button', {
                    name: 'Lightning Bolt',
                })
            );

            expect(screen.queryByRole('dialog')).toBeNull();
            // Renaming a flagged item confirms it.
            expect(
                screen.queryByRole('heading', { name: /needs a look/i })
            ).toBeNull();
            expect(rowsIn(/ready to add/i)[0]).toHaveTextContent(
                'Lightning Bolt'
            );
        });

        it('renames from a search of the card list', async () => {
            const user = userEvent.setup();
            renderQueue([
                makeItem({
                    status: 'flagged',
                    flagReason: 'no-match',
                    readName: 'Mystery',
                }),
            ]);
            await user.click(
                screen.getByRole('button', { name: 'Edit Mystery' })
            );
            await user.type(screen.getByLabelText('Card name'), 'grizzly');
            await user.click(
                await screen.findByRole('button', { name: 'Grizzly Bears' })
            );
            expect(screen.queryByRole('dialog')).toBeNull();
            expect(rowsIn(/ready to add/i)[0]).toHaveTextContent(
                'Grizzly Bears'
            );
        });

        it('offers a Scryfall card the list lacks, and renames on tap', async () => {
            const user = userEvent.setup();
            renderQueue([
                makeItem({
                    status: 'flagged',
                    flagReason: 'no-match',
                    readName: 'Mystery',
                }),
            ]);
            await user.click(
                screen.getByRole('button', { name: 'Edit Mystery' })
            );
            await user.type(
                screen.getByLabelText('Card name'),
                'brand new card'
            );
            await user.click(
                await screen.findByRole(
                    'button',
                    { name: /Brand New Card/ },
                    { timeout: 3000 }
                )
            );
            expect(rowsIn(/ready to add/i)[0]).toHaveTextContent(
                'Brand New Card'
            );
        });

        it('shows no match when Scryfall has nothing either', async () => {
            const user = userEvent.setup();
            renderQueue([
                makeItem({
                    status: 'flagged',
                    flagReason: 'no-match',
                    readName: 'Mystery',
                }),
            ]);
            await user.click(
                screen.getByRole('button', { name: 'Edit Mystery' })
            );
            await user.type(screen.getByLabelText('Card name'), 'zzzzqqq');
            expect(
                await screen.findByText(
                    'No matching cards.',
                    {},
                    { timeout: 3000 }
                )
            ).toBeInTheDocument();
        });

        it('closes without changing the item', async () => {
            const user = userEvent.setup();
            renderQueue([
                makeItem({
                    status: 'flagged',
                    flagReason: 'no-match',
                    readName: 'Mystery',
                }),
            ]);
            await user.click(
                screen.getByRole('button', { name: 'Edit Mystery' })
            );
            await user.click(screen.getByRole('button', { name: 'Close' }));
            expect(screen.queryByRole('dialog')).toBeNull();
            expect(rowsIn(/needs a look/i)).toHaveLength(1);
        });
    });

    describe('discarding the queue', () => {
        it('asks with the review count, and clears on OK', async () => {
            const user = userEvent.setup();
            const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
            renderQueue([
                makeItem({ matchedCard: bolt }),
                makeItem({ status: 'flagged', flagReason: 'no-match' }),
                makeItem({ status: 'queued' }),
            ]);
            await user.click(
                screen.getByRole('button', { name: 'Discard all 3 cards' })
            );
            expect(confirm).toHaveBeenCalledWith(
                'Discard all 3 cards in the queue? 2 cards still need review. This cannot be undone.'
            );
            expect(screen.getByText('The queue is empty.')).toBeInTheDocument();
        });

        it('keeps the queue when the user cancels', async () => {
            const user = userEvent.setup();
            const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
            renderQueue([makeItem({ matchedCard: bolt })]);
            await user.click(
                screen.getByRole('button', { name: 'Discard all 1 card' })
            );
            // Nothing needs review, so the text says only what is lost.
            expect(confirm).toHaveBeenCalledWith(
                'Discard all 1 card in the queue? This cannot be undone.'
            );
            expect(screen.getByText('Lightning Bolt')).toBeInTheDocument();
        });
    });
});
