// Background worker for the scan queue: takes `queued` items, sends each photo
// to /api/identify, matches the read name to the card list and records the
// outcome. Network failures and 429s never become a no-match; the item stays
// queued and is retried with backoff. All I/O is injected so it tests with fake
// timers and a fake fetch.

import { matchReadName, normalize, type CardIndex } from '@/lib/cardSearch';
import type { IdentifyResult } from '@/lib/identify';
import type { ScanQueueStore } from '@/lib/scanQueueStore';
import type {
    FlagReason,
    QueueItem,
    QueueItemStatus,
} from '@/lib/scanQueueTypes';

export type QueueCounts = Record<QueueItemStatus, number>;

export function countQueue(items: QueueItem[]): QueueCounts {
    const counts: QueueCounts = {
        queued: 0,
        sending: 0,
        identified: 0,
        flagged: 0,
        failed: 0,
    };
    for (const item of items) counts[item.status] += 1;
    return counts;
}

/** What went wrong in one identify call, as far as retry policy cares. */
export type IdentifyFailure =
    | { kind: 'network' }
    | { kind: 'rate-limit'; retryAfterMs?: number }
    | { kind: 'error' };

export class IdentifyCallError extends Error {
    constructor(readonly failure: IdentifyFailure) {
        super(`identify failed: ${failure.kind}`);
        this.name = 'IdentifyCallError';
    }
}

export interface WorkerDeps {
    store: ScanQueueStore;
    /** Send one photo. Throws `IdentifyCallError` on failure. */
    identify: (photo: Blob) => Promise<IdentifyResult>;
    /** The full photo for an item, if it is still stored. */
    getImage: (id: string) => Promise<Blob | undefined>;
    /** The card index, or null while the card list is still loading. */
    getIndex: () => CardIndex | null;
    /** Whether the browser thinks it is online. */
    isOnline?: () => boolean;
    now?: () => number;
    setTimer?: (fn: () => void, ms: number) => unknown;
    clearTimer?: (handle: unknown) => void;
    concurrency?: number;
    /** Failed attempts (other errors) before an item is marked failed. */
    maxAttempts?: number;
    baseBackoffMs?: number;
    maxBackoffMs?: number;
}

export interface ScanQueueWorker {
    /** Begin draining, resuming anything queued or interrupted mid-send. */
    start: () => void;
    stop: () => void;
    /** Re-check the queue now (new index, back online). */
    poke: () => void;
}

export const DEFAULT_CONCURRENCY = 2;
export const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_BASE_BACKOFF_MS = 2_000;
const DEFAULT_MAX_BACKOFF_MS = 60_000;
// setTimeout overflows past 2^31 - 1 ms; longer waits just re-check on wake.
const MAX_TIMER_MS = 2_147_483_647;

type Outcome = {
    status: QueueItemStatus;
    flagReason: FlagReason;
    readName: string | null;
    matchedCard: QueueItem['matchedCard'];
    modelConfidence: IdentifyResult['confidence'];
};

/**
 * Turn an identify result into a queue outcome. Card-list match problems take
 * priority as the flag reason; a clean exact match is still flagged
 * `low-confidence` when the model said it was not sure.
 */
export function classifyRead(
    index: CardIndex,
    result: IdentifyResult
): Outcome {
    const outcome = classifyName(index, result.name);
    const modelConfidence = result.confidence;
    if (outcome.status === 'identified' && modelConfidence === 'low') {
        return {
            ...outcome,
            status: 'flagged',
            flagReason: 'low-confidence',
            modelConfidence,
        };
    }
    return { ...outcome, modelConfidence };
}

function classifyName(
    index: CardIndex,
    readName: string | null
): Omit<Outcome, 'modelConfidence'> {
    const name = readName?.trim() ?? '';
    if (!name) {
        return {
            status: 'flagged',
            flagReason: 'unreadable',
            readName: null,
            matchedCard: null,
        };
    }
    const matches = matchReadName(index, name);
    const wanted = normalize(name);
    const exact = matches.filter(
        (card) =>
            normalize(card.name) === wanted || normalize(card.front) === wanted
    );
    if (exact.length === 1) {
        return {
            status: 'identified',
            flagReason: 'none',
            readName: name,
            matchedCard: { oracleId: exact[0].oracleId, name: exact[0].name },
        };
    }
    return {
        status: 'flagged',
        flagReason:
            matches.length === 0
                ? 'no-match'
                : matches.length === 1
                  ? 'fuzzy-match'
                  : 'ambiguous',
        readName: name,
        matchedCard:
            matches.length === 1
                ? { oracleId: matches[0].oracleId, name: matches[0].name }
                : null,
    };
}

export function createScanQueueWorker(deps: WorkerDeps): ScanQueueWorker {
    const { store, identify, getImage, getIndex } = deps;
    const isOnline = deps.isOnline ?? (() => true);
    const now = deps.now ?? Date.now;
    const setTimer =
        deps.setTimer ?? ((fn, ms) => setTimeout(fn, ms) as unknown);
    const clearTimer =
        deps.clearTimer ??
        ((handle) => clearTimeout(handle as ReturnType<typeof setTimeout>));
    const concurrency = deps.concurrency ?? DEFAULT_CONCURRENCY;
    const maxAttempts = deps.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
    const base = deps.baseBackoffMs ?? DEFAULT_BASE_BACKOFF_MS;
    const maxBackoff = deps.maxBackoffMs ?? DEFAULT_MAX_BACKOFF_MS;

    const inFlight = new Set<string>();
    // Network/429 retries per item. In memory only: a reload restarts backoff.
    const softRetries = new Map<string, number>();
    let running = false;
    let unsubscribe: (() => void) | null = null;
    let timer: unknown = null;
    // A 429 holds back the whole queue, not just the item that hit it.
    let pausedUntil = 0;

    const backoff = (retries: number) =>
        Math.min(maxBackoff, base * 2 ** Math.max(0, retries - 1));

    function schedule(at: number) {
        if (timer !== null) clearTimer(timer);
        timer = setTimer(
            () => {
                timer = null;
                pump();
            },
            Math.min(MAX_TIMER_MS, Math.max(0, at - now()))
        );
    }

    function pump() {
        if (!running || !isOnline() || !getIndex()) return;
        const t = now();
        if (t < pausedUntil) {
            schedule(pausedUntil);
            return;
        }
        let nextWake: number | null = null;
        for (const item of store.getState().items) {
            if (item.status !== 'queued' || inFlight.has(item.id)) continue;
            if (item.nextAttemptAt !== null && item.nextAttemptAt > t) {
                nextWake = Math.min(nextWake ?? Infinity, item.nextAttemptAt);
                continue;
            }
            if (inFlight.size >= concurrency) return; // a finish re-pumps
            void send(item.id);
        }
        if (nextWake !== null) schedule(nextWake);
    }

    function requeue(id: string, delayMs: number) {
        store.getState().update(id, {
            status: 'queued',
            nextAttemptAt: now() + delayMs,
        });
    }

    async function send(id: string) {
        inFlight.add(id);
        store.getState().update(id, { status: 'sending', nextAttemptAt: null });
        try {
            const image = await getImage(id);
            if (!image) {
                // Nothing left to send; retrying cannot help.
                store.getState().update(id, {
                    status: 'failed',
                    flagReason: 'error',
                });
                return;
            }
            const result = await identify(image);
            const index = getIndex();
            if (!index) {
                requeue(id, 0);
                return;
            }
            store.getState().update(id, classifyRead(index, result));
            softRetries.delete(id);
        } catch (error) {
            handleFailure(id, error);
        } finally {
            inFlight.delete(id);
            pump();
        }
    }

    function handleFailure(id: string, error: unknown) {
        const failure: IdentifyFailure =
            error instanceof IdentifyCallError
                ? error.failure
                : { kind: 'error' };
        if (failure.kind === 'network' || failure.kind === 'rate-limit') {
            const retries = (softRetries.get(id) ?? 0) + 1;
            softRetries.set(id, retries);
            const delay =
                failure.kind === 'rate-limit' && failure.retryAfterMs
                    ? failure.retryAfterMs
                    : backoff(retries);
            if (failure.kind === 'rate-limit') {
                pausedUntil = Math.max(pausedUntil, now() + delay);
            }
            requeue(id, delay);
            return;
        }
        const item = store.getState().items.find((i) => i.id === id);
        if (!item) return;
        const attempts = item.attempts + 1;
        if (attempts >= maxAttempts) {
            store.getState().update(id, {
                status: 'failed',
                flagReason: 'error',
                attempts,
            });
            return;
        }
        store.getState().update(id, {
            status: 'queued',
            attempts,
            nextAttemptAt: now() + backoff(attempts),
        });
    }

    return {
        start() {
            if (running) return;
            running = true;
            // Anything stuck mid-send from a previous run goes back in line.
            for (const item of store.getState().items) {
                if (item.status === 'sending' && !inFlight.has(item.id)) {
                    store.getState().update(item.id, { status: 'queued' });
                }
            }
            unsubscribe = store.subscribe(() => pump());
            pump();
        },
        stop() {
            running = false;
            unsubscribe?.();
            unsubscribe = null;
            if (timer !== null) clearTimer(timer);
            timer = null;
        },
        poke: pump,
    };
}
