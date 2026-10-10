import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildIndex } from '@/lib/cardSearch';
import type { IdentifyResult } from '@/lib/identify';
import { createScanQueueStore } from '@/lib/scanQueueStore';
import {
    countQueue,
    createScanQueueWorker,
    IdentifyCallError,
    type WorkerDeps,
} from '@/lib/scanQueueWorker';

const index = buildIndex({
    version: 't',
    count: 4,
    cards: [
        ['bolt', 'Lightning Bolt'],
        ['bolt-art', 'Lightning Bolt Art Card'],
        ['fire', 'Fire // Ice'],
        ['delver', 'Delver of Secrets // Insectile Aberration'],
    ],
});

const photo = new Blob(['x']);
let seq = 0;
const uniqueUser = () => `worker-${seq++}`;

beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
});
afterEach(() => {
    vi.useRealTimers();
});

function setup(
    identify: WorkerDeps['identify'],
    extra: Partial<WorkerDeps> = {}
) {
    const store = createScanQueueStore(uniqueUser());
    const worker = createScanQueueWorker({
        store,
        identify,
        getImage: async () => photo,
        getIndex: () => index,
        ...extra,
    });
    return { store, worker };
}

const settle = () => vi.advanceTimersByTimeAsync(0);
const only = (store: ReturnType<typeof createScanQueueStore>) =>
    store.getState().items[0];

describe('status transitions', () => {
    it('identifies an exact, unique match', async () => {
        const { store, worker } = setup(async () => ({
            name: 'Lightning Bolt',
            confidence: 'high' as const,
        }));
        store.getState().add();
        worker.start();
        await settle();
        expect(only(store)).toMatchObject({
            status: 'identified',
            flagReason: 'none',
            readName: 'Lightning Bolt',
            matchedCard: { oracleId: 'bolt', name: 'Lightning Bolt' },
        });
        worker.stop();
    });

    it('stores the top candidates for the edit modal', async () => {
        const { store, worker } = setup(async () => ({
            name: 'Lightning Bolt',
            confidence: 'high' as const,
        }));
        store.getState().add();
        worker.start();
        await settle();
        expect(only(store).candidates).toEqual([
            { oracleId: 'bolt', name: 'Lightning Bolt' },
            { oracleId: 'bolt-art', name: 'Lightning Bolt Art Card' },
        ]);
        worker.stop();
    });

    it('stores candidates on a flagged read, none when unreadable', async () => {
        const reads = [
            { name: 'Lightning Bol', confidence: 'high' as const },
            { name: null, confidence: 'low' as const },
        ];
        const { store, worker } = setup(async () => reads.shift()!, {
            concurrency: 1,
        });
        store.getState().add();
        store.getState().add();
        worker.start();
        await settle();
        const [first, second] = store.getState().items;
        expect(first.status).toBe('flagged');
        expect(first.candidates?.length).toBeGreaterThan(0);
        expect(first.candidates?.length).toBeLessThanOrEqual(5);
        expect(second.candidates).toEqual([]);
        worker.stop();
    });

    it('matches a front face exactly', async () => {
        const { store, worker } = setup(async () => ({
            name: 'delver of secrets',
            confidence: 'high' as const,
        }));
        store.getState().add();
        worker.start();
        await settle();
        expect(only(store).status).toBe('identified');
        worker.stop();
    });

    it('flags a fuzzy match', async () => {
        const { store, worker } = setup(async () => ({
            name: 'Lightnin Bolt',
            confidence: 'high' as const,
        }));
        store.getState().add();
        worker.start();
        await settle();
        expect(only(store).status).toBe('flagged');
        expect(only(store).flagReason).not.toBe('none');
        expect(['fuzzy-match', 'ambiguous']).toContain(only(store).flagReason);
        worker.stop();
    });

    it('flags no match', async () => {
        const { store, worker } = setup(async () => ({
            name: 'Zzzzqqqq Xyzzy',
            confidence: 'high' as const,
        }));
        store.getState().add();
        worker.start();
        await settle();
        expect(only(store)).toMatchObject({
            status: 'flagged',
            flagReason: 'no-match',
        });
        worker.stop();
    });

    it('flags an exact match the model was not sure about', async () => {
        const { store, worker } = setup(async () => ({
            name: 'Lightning Bolt',
            confidence: 'low' as const,
        }));
        store.getState().add();
        worker.start();
        await settle();
        expect(only(store)).toMatchObject({
            status: 'flagged',
            flagReason: 'low-confidence',
            modelConfidence: 'low',
            matchedCard: { oracleId: 'bolt', name: 'Lightning Bolt' },
        });
        worker.stop();
    });

    it('keeps the card-list flag when the model was also unsure', async () => {
        const { store, worker } = setup(async () => ({
            name: 'Zzzzqqqq Xyzzy',
            confidence: 'low' as const,
        }));
        store.getState().add();
        worker.start();
        await settle();
        expect(only(store)).toMatchObject({
            flagReason: 'no-match',
            modelConfidence: 'low',
        });
        worker.stop();
    });

    it('records high model confidence on a clean match', async () => {
        const { store, worker } = setup(async () => ({
            name: 'Lightning Bolt',
            confidence: 'high' as const,
        }));
        store.getState().add();
        worker.start();
        await settle();
        expect(only(store)).toMatchObject({
            status: 'identified',
            modelConfidence: 'high',
        });
        worker.stop();
    });

    it('flags unreadable photos', async () => {
        const { store, worker } = setup(async () => ({
            name: null,
            confidence: 'low' as const,
        }));
        store.getState().add();
        worker.start();
        await settle();
        expect(only(store)).toMatchObject({
            status: 'flagged',
            flagReason: 'unreadable',
        });
        worker.stop();
    });

    it('marks the item sending while the call is in flight', async () => {
        let release: (v: IdentifyResult) => void = () => {};
        const { store, worker } = setup(
            () => new Promise((resolve) => (release = resolve))
        );
        store.getState().add();
        worker.start();
        await settle();
        expect(only(store).status).toBe('sending');
        release({ name: 'Lightning Bolt', confidence: 'high' as const });
        await settle();
        expect(only(store).status).toBe('identified');
        worker.stop();
    });

    it('respects the concurrency limit', async () => {
        const resolvers: (() => void)[] = [];
        const identify = vi.fn(
            () =>
                new Promise<IdentifyResult>((resolve) =>
                    resolvers.push(() =>
                        resolve({
                            name: 'Lightning Bolt',
                            confidence: 'high' as const,
                        })
                    )
                )
        );
        const { store, worker } = setup(identify, { concurrency: 2 });
        for (let i = 0; i < 4; i++) store.getState().add();
        worker.start();
        await settle();
        expect(identify).toHaveBeenCalledTimes(2);
        expect(countQueue(store.getState().items)).toMatchObject({
            sending: 2,
            queued: 2,
        });
        resolvers.shift()!();
        await settle();
        expect(identify).toHaveBeenCalledTimes(3);
        worker.stop();
    });
});

describe('failures and backoff', () => {
    it('keeps the item queued on network failure and backs off exponentially', async () => {
        const identify = vi
            .fn<WorkerDeps['identify']>()
            .mockRejectedValue(new IdentifyCallError({ kind: 'network' }));
        const { store, worker } = setup(identify, { baseBackoffMs: 1000 });
        store.getState().add();
        worker.start();
        await settle();
        const t0 = Date.now();
        expect(only(store)).toMatchObject({
            status: 'queued',
            flagReason: 'none',
            nextAttemptAt: t0 + 1000,
        });

        await vi.advanceTimersByTimeAsync(999);
        expect(identify).toHaveBeenCalledTimes(1);
        await vi.advanceTimersByTimeAsync(1);
        expect(identify).toHaveBeenCalledTimes(2);
        expect(only(store).nextAttemptAt).toBe(Date.now() + 2000);

        await vi.advanceTimersByTimeAsync(2000);
        expect(identify).toHaveBeenCalledTimes(3);
        expect(only(store).nextAttemptAt).toBe(Date.now() + 4000);
        // Network trouble never exhausts the item.
        expect(only(store).attempts).toBe(0);
        worker.stop();
    });

    it('caps the backoff', async () => {
        const identify = vi
            .fn<WorkerDeps['identify']>()
            .mockRejectedValue(new IdentifyCallError({ kind: 'network' }));
        const { store, worker } = setup(identify, {
            baseBackoffMs: 1000,
            maxBackoffMs: 3000,
        });
        store.getState().add();
        worker.start();
        await settle();
        await vi.advanceTimersByTimeAsync(1000);
        await vi.advanceTimersByTimeAsync(2000);
        expect(only(store).nextAttemptAt).toBe(Date.now() + 3000);
        worker.stop();
    });

    it('a 429 stays queued, never a no-match, and honors Retry-After', async () => {
        const identify = vi
            .fn<WorkerDeps['identify']>()
            .mockRejectedValueOnce(
                new IdentifyCallError({
                    kind: 'rate-limit',
                    retryAfterMs: 30_000,
                })
            )
            .mockResolvedValue({
                name: 'Lightning Bolt',
                confidence: 'high' as const,
            });
        const { store, worker } = setup(identify, { baseBackoffMs: 1000 });
        store.getState().add();
        worker.start();
        await settle();
        const t0 = Date.now();
        expect(only(store)).toMatchObject({
            status: 'queued',
            flagReason: 'none',
            nextAttemptAt: t0 + 30_000,
        });
        await vi.advanceTimersByTimeAsync(29_999);
        expect(identify).toHaveBeenCalledTimes(1);
        await vi.advanceTimersByTimeAsync(1);
        expect(identify).toHaveBeenCalledTimes(2);
        expect(only(store).status).toBe('identified');
        worker.stop();
    });

    it('a 429 pauses other items too', async () => {
        const identify = vi
            .fn<WorkerDeps['identify']>()
            .mockRejectedValueOnce(
                new IdentifyCallError({
                    kind: 'rate-limit',
                    retryAfterMs: 10_000,
                })
            )
            .mockResolvedValue({
                name: 'Lightning Bolt',
                confidence: 'high' as const,
            });
        const { store, worker } = setup(identify, { concurrency: 1 });
        store.getState().add();
        store.getState().add();
        worker.start();
        await settle();
        expect(identify).toHaveBeenCalledTimes(1);
        await vi.advanceTimersByTimeAsync(9_999);
        expect(identify).toHaveBeenCalledTimes(1);
        await vi.advanceTimersByTimeAsync(1);
        await settle();
        expect(identify).toHaveBeenCalledTimes(3);
        worker.stop();
    });

    it('fails with reason error after the capped attempts on other errors', async () => {
        const identify = vi
            .fn<WorkerDeps['identify']>()
            .mockRejectedValue(new IdentifyCallError({ kind: 'error' }));
        const { store, worker } = setup(identify, {
            maxAttempts: 3,
            baseBackoffMs: 1000,
        });
        store.getState().add();
        worker.start();
        await settle();
        expect(only(store)).toMatchObject({ status: 'queued', attempts: 1 });
        await vi.advanceTimersByTimeAsync(1000);
        expect(only(store)).toMatchObject({ status: 'queued', attempts: 2 });
        await vi.advanceTimersByTimeAsync(2000);
        expect(only(store)).toMatchObject({
            status: 'failed',
            flagReason: 'error',
            attempts: 3,
        });
        await vi.advanceTimersByTimeAsync(60_000);
        expect(identify).toHaveBeenCalledTimes(3);
        worker.stop();
    });

    it('fails an item whose image is gone', async () => {
        const identify = vi.fn<WorkerDeps['identify']>();
        const { store, worker } = setup(identify, {
            getImage: async () => undefined,
        });
        store.getState().add();
        worker.start();
        await settle();
        expect(only(store)).toMatchObject({
            status: 'failed',
            flagReason: 'error',
        });
        expect(identify).not.toHaveBeenCalled();
        worker.stop();
    });
});

describe('signed out (401)', () => {
    const unauthorized = () => new IdentifyCallError({ kind: 'unauthorized' });
    const bolt = { name: 'Lightning Bolt', confidence: 'high' as const };

    it('pauses with every item queued and counts no attempt', async () => {
        const identify = vi
            .fn<WorkerDeps['identify']>()
            .mockRejectedValue(unauthorized());
        const onAuthChange = vi.fn();
        const { store, worker } = setup(identify, { onAuthChange });
        store.getState().add();
        store.getState().add();
        store.getState().add();
        worker.start();
        await settle();
        expect(onAuthChange).toHaveBeenCalledExactlyOnceWith(true);
        for (const item of store.getState().items) {
            expect(item).toMatchObject({ status: 'queued', attempts: 0 });
        }
        // Held back far past the normal backoff and retry budget.
        const calls = identify.mock.calls.length;
        await vi.advanceTimersByTimeAsync(30_000);
        expect(identify).toHaveBeenCalledTimes(calls);
        worker.poke();
        await settle();
        expect(identify).toHaveBeenCalledTimes(calls);
        worker.stop();
    });

    it('never fails an item however many 401s it gets', async () => {
        const identify = vi
            .fn<WorkerDeps['identify']>()
            .mockRejectedValue(unauthorized());
        const { store, worker } = setup(identify, {
            maxAttempts: 2,
            authProbeMs: 1000,
        });
        store.getState().add();
        worker.start();
        await vi.advanceTimersByTimeAsync(10_000);
        expect(identify.mock.calls.length).toBeGreaterThan(3);
        expect(only(store)).toMatchObject({ status: 'queued', attempts: 0 });
        worker.stop();
    });

    it('resumes by itself when a probe send succeeds', async () => {
        const identify = vi
            .fn<WorkerDeps['identify']>()
            .mockRejectedValueOnce(unauthorized())
            .mockRejectedValueOnce(unauthorized())
            .mockResolvedValue(bolt);
        const onAuthChange = vi.fn();
        const { store, worker } = setup(identify, {
            onAuthChange,
            authProbeMs: 5000,
        });
        store.getState().add();
        store.getState().add();
        worker.start();
        await settle();
        expect(identify).toHaveBeenCalledTimes(2); // both hit the 401
        expect(onAuthChange).toHaveBeenLastCalledWith(true);
        await vi.advanceTimersByTimeAsync(4999);
        expect(identify).toHaveBeenCalledTimes(2);
        await vi.advanceTimersByTimeAsync(1);
        expect(onAuthChange).toHaveBeenLastCalledWith(false);
        expect(
            store.getState().items.every((i) => i.status === 'identified')
        ).toBe(true);
        worker.stop();
    });

    it('resumes at once when the worker is restarted after signing in', async () => {
        let signedIn = false;
        const identify = vi.fn<WorkerDeps['identify']>(async () => {
            if (!signedIn) throw unauthorized();
            return bolt;
        });
        const onAuthChange = vi.fn();
        const { store, worker } = setup(identify, { onAuthChange });
        store.getState().add();
        worker.start();
        await settle();
        expect(only(store).status).toBe('queued');
        worker.stop();
        signedIn = true;
        worker.start();
        await settle();
        expect(only(store).status).toBe('identified');
        expect(onAuthChange).toHaveBeenLastCalledWith(false);
        worker.stop();
    });
});

describe('offline and resume', () => {
    it('sends nothing while offline and drains when poked back online', async () => {
        let online = false;
        const identify = vi.fn<WorkerDeps['identify']>().mockResolvedValue({
            name: 'Lightning Bolt',
            confidence: 'high' as const,
        });
        const { store, worker } = setup(identify, { isOnline: () => online });
        store.getState().add();
        store.getState().add();
        worker.start();
        await settle();
        expect(identify).not.toHaveBeenCalled();
        online = true;
        worker.poke();
        await settle();
        expect(countQueue(store.getState().items).identified).toBe(2);
        worker.stop();
    });

    it('waits for the card index', async () => {
        let ready = false;
        const identify = vi.fn<WorkerDeps['identify']>().mockResolvedValue({
            name: 'Lightning Bolt',
            confidence: 'high' as const,
        });
        const { store, worker } = setup(identify, {
            getIndex: () => (ready ? index : null),
        });
        store.getState().add();
        worker.start();
        await settle();
        expect(identify).not.toHaveBeenCalled();
        ready = true;
        worker.poke();
        await settle();
        expect(only(store).status).toBe('identified');
        worker.stop();
    });
});

describe('resume after reload', () => {
    it('picks up queued and interrupted items from the persisted queue', async () => {
        vi.useRealTimers();
        const userId = uniqueUser();
        const first = createScanQueueStore(userId);
        await first.persist.rehydrate();
        const queued = first.getState().add({ status: 'queued' });
        const sending = first.getState().add({ status: 'sending' });
        const done = first.getState().add({ status: 'identified' });
        // The persist write is async; give it a moment to land.
        await new Promise((resolve) => setTimeout(resolve, 50));

        const reloaded = createScanQueueStore(userId);
        await reloaded.persist.rehydrate();
        const identify = vi.fn<WorkerDeps['identify']>().mockResolvedValue({
            name: 'Lightning Bolt',
            confidence: 'high' as const,
        });
        const worker = createScanQueueWorker({
            store: reloaded,
            identify,
            getImage: async () => photo,
            getIndex: () => index,
        });
        worker.start();
        await vi.waitFor(() =>
            expect(countQueue(reloaded.getState().items).identified).toBe(3)
        );
        expect(identify).toHaveBeenCalledTimes(2);
        const byId = new Map(reloaded.getState().items.map((i) => [i.id, i]));
        expect(byId.get(queued.id)?.status).toBe('identified');
        expect(byId.get(sending.id)?.status).toBe('identified');
        expect(byId.get(done.id)?.status).toBe('identified');
        worker.stop();
    });

    it('requeues an item left sending when started on a live store', async () => {
        const identify = vi.fn<WorkerDeps['identify']>().mockResolvedValue({
            name: 'Lightning Bolt',
            confidence: 'high' as const,
        });
        const { store, worker } = setup(identify);
        store.getState().add({ status: 'sending' });
        worker.start();
        await settle();
        expect(only(store).status).toBe('identified');
        worker.stop();
    });
});
