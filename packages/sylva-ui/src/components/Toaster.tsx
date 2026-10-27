'use client';

import {
    useEffect,
    useRef,
    useState,
    useSyncExternalStore,
    type FocusEvent,
} from 'react';
import { X } from '../icons';
import {
    getServerToasts,
    getToasts,
    subscribeToasts,
    toast,
    type ToastItem,
} from '../toastStore';
import Button from './Button';

const variantClasses = {
    neutral: 'border-border-minimal',
    success: 'border-success',
    error: 'border-error',
} as const;

function ToastCard({ item }: { item: ToastItem }) {
    const [hovered, setHovered] = useState(false);
    const [focused, setFocused] = useState(false);
    const paused = hovered || focused;
    // Time left on the auto-dismiss timer; it survives pauses.
    const remaining = useRef(item.duration);

    useEffect(() => {
        if (item.duration === null || paused) return;
        const startedAt = Date.now();
        const timer = setTimeout(
            () => toast.dismiss(item.id),
            remaining.current ?? 0
        );
        return () => {
            clearTimeout(timer);
            remaining.current = Math.max(
                0,
                (remaining.current ?? 0) - (Date.now() - startedAt)
            );
        };
    }, [paused, item.id, item.duration]);

    const { action } = item;
    return (
        <div
            // Errors interrupt a screen reader; the rest wait their turn.
            role={item.variant === 'error' ? 'alert' : 'status'}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onFocus={() => setFocused(true)}
            onBlur={(event: FocusEvent<HTMLDivElement>) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                    setFocused(false);
                }
            }}
            className={`pointer-events-auto flex items-center gap-2 rounded-surface border bg-surface-minimal p-2 pl-4 text-body text-foreground shadow-lg transition-[opacity,translate] starting:translate-y-2 starting:opacity-0 motion-reduce:transition-none ${variantClasses[item.variant]}`}
        >
            <p className="min-w-0 flex-1 wrap-break-word">{item.message}</p>
            {action && (
                <Button
                    variant="secondary"
                    onClick={() => {
                        action.onClick();
                        toast.dismiss(item.id);
                    }}
                >
                    {action.label}
                </Button>
            )}
            <Button
                variant="secondary"
                size="icon"
                aria-label="Dismiss"
                onClick={() => toast.dismiss(item.id)}
            >
                <X aria-hidden="true" />
            </Button>
        </div>
    );
}

/**
 * The toast stack. Mount it once near the root of an app, then call `toast()`
 * from anywhere. At the bottom of the screen on phones, in the bottom right
 * from `sm`. It lives in the browser's top layer (a manual popover), so it
 * shows above an open dialog or sheet; while a modal is open the page behind
 * it is inert, so a toast's buttons wait until the modal closes.
 */
export default function Toaster() {
    const items = useSyncExternalStore(
        subscribeToasts,
        getToasts,
        getServerToasts
    );
    const ref = useRef<HTMLDivElement>(null);
    const newestId = items.at(-1)?.id;

    // Show (or re-show, to move it above a dialog opened since) the popover
    // when a toast arrives. Browsers without popovers just show it in place.
    useEffect(() => {
        const element = ref.current;
        if (!element || newestId === undefined) return;
        if (typeof element.showPopover !== 'function') return;
        try {
            // Set here, not in the markup: an element with `popover` is
            // hidden until shown, which a browser without support never does.
            element.popover = 'manual';
            if (element.matches(':popover-open')) element.hidePopover();
            element.showPopover();
        } catch {
            // Already in the right state.
        }
    }, [newestId]);

    if (items.length === 0) return null;
    return (
        <div
            ref={ref}
            aria-label="Notifications"
            className="pointer-events-none fixed inset-x-0 top-auto bottom-0 m-0 flex w-full max-w-none flex-col gap-2 overflow-visible border-0 bg-transparent p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:inset-x-auto sm:right-0 sm:w-96"
        >
            {items.map((item) => (
                <ToastCard key={item.id} item={item} />
            ))}
        </div>
    );
}
