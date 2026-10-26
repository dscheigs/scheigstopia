'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/** How long the user must stop clicking before the count is saved. */
export const QUANTITY_SETTLE_MS = 500;

type Options = {
    /** The last count the server confirmed (from the collection query). */
    saved: number;
    /** Saves a count; rejects when the save fails. */
    save: (quantity: number) => Promise<unknown>;
    settleMs?: number;
};

/**
 * Drives a quantity counter over a slow network. The count shown changes at
 * once on every click, and one save with the final count goes out after the
 * user has stopped for `settleMs`. A change made while a save is in flight is
 * saved after it settles, so the last write wins and the display never snaps
 * back to an older server value mid-edit. A failed save rolls the display back
 * to the last saved count and reports the message.
 *
 * A pending count is saved when the page is hidden or closed and when the
 * component unmounts, so a click is not lost; `cancel()` drops it (before
 * Remove, so a stale save cannot bring the card back).
 */
export function useDebouncedQuantity({
    saved,
    save,
    settleMs = QUANTITY_SETTLE_MS,
}: Options) {
    // The count the user asked for and the server has not confirmed; null when
    // there is none, in which case `saved` is shown.
    const [draft, setDraft] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Refs, not state: the timer and the save loop read the newest values.
    const wanted = useRef<number | null>(null);
    const confirmed = useRef(saved);
    const sending = useRef(false);
    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const saveRef = useRef(save);
    // flush() calls itself when a newer count arrived during a save.
    const flushRef = useRef<() => Promise<void>>(async () => {});

    useEffect(() => {
        saveRef.current = save;
        confirmed.current = saved;
    });

    const flush = useCallback(async () => {
        clearTimeout(timer.current);
        timer.current = undefined;
        // The save in flight picks the newer count up when it finishes.
        if (sending.current) return;
        const value = wanted.current;
        if (value === null) return;
        if (value === confirmed.current) {
            wanted.current = null;
            setDraft(null);
            return;
        }
        sending.current = true;
        try {
            await saveRef.current(value);
            confirmed.current = value;
        } catch (caught) {
            sending.current = false;
            wanted.current = null;
            setDraft(null);
            setError(
                caught instanceof Error ? caught.message : 'Could not save.'
            );
            return;
        }
        sending.current = false;
        if (wanted.current === value) {
            wanted.current = null;
            setDraft(null);
        } else if (timer.current === undefined) {
            // Changed during the save and its timer already fired and waited.
            void flushRef.current();
        }
    }, []);

    useEffect(() => {
        flushRef.current = flush;
    }, [flush]);

    const setQuantity = useCallback(
        (next: number) => {
            wanted.current = next;
            setDraft(next);
            setError(null);
            clearTimeout(timer.current);
            timer.current = setTimeout(() => void flush(), settleMs);
        },
        [flush, settleMs]
    );

    const cancel = useCallback(() => {
        clearTimeout(timer.current);
        timer.current = undefined;
        wanted.current = null;
        setDraft(null);
    }, []);

    // Save what is pending when the page goes away or this unmounts.
    useEffect(() => {
        const onPageHide = () => void flush();
        const onHide = () => {
            if (document.visibilityState === 'hidden') void flush();
        };
        window.addEventListener('pagehide', onPageHide);
        document.addEventListener('visibilitychange', onHide);
        return () => {
            window.removeEventListener('pagehide', onPageHide);
            document.removeEventListener('visibilitychange', onHide);
            void flush();
        };
    }, [flush]);

    return {
        /** The count to show: the newest one asked for, else the saved one. */
        quantity: draft ?? saved,
        setQuantity,
        /** True from the first click until the server has the final count. */
        pending: draft !== null,
        error,
        cancel,
    };
}
