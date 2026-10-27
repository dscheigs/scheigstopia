// The toast queue. A module-level store, not React context, so `toast()` works
// from anywhere, including outside React (a TanStack Query `MutationCache`
// callback). `Toaster` reads it through `useSyncExternalStore`.

export type ToastVariant = 'neutral' | 'success' | 'error';

export type ToastAction = {
    label: string;
    onClick: () => void;
};

export type ToastOptions = {
    variant?: ToastVariant;
    /** A button in the toast, such as Retry. A toast with an action stays until dismissed. */
    action?: ToastAction;
    /** Milliseconds before it goes away; `null` keeps it until dismissed. */
    duration?: number | null;
};

export type ToastItem = {
    id: number;
    message: string;
    variant: ToastVariant;
    action?: ToastAction;
    /** Null when it stays until dismissed. */
    duration: number | null;
};

/** How long a neutral or success toast stays. */
export const TOAST_DURATION_MS = 4000;
/** Errors stay longer: they are worth reading twice. */
export const TOAST_ERROR_DURATION_MS = 8000;
/** The most toasts on screen; a newer one pushes the oldest off. */
export const MAX_TOASTS = 3;

const NONE: readonly ToastItem[] = [];

let toasts: readonly ToastItem[] = NONE;
let nextId = 1;
const listeners = new Set<() => void>();

function emit(next: readonly ToastItem[]) {
    toasts = next;
    listeners.forEach((listener) => listener());
}

export function subscribeToasts(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

export function getToasts(): readonly ToastItem[] {
    return toasts;
}

export function getServerToasts(): readonly ToastItem[] {
    return NONE;
}

function defaultDuration(variant: ToastVariant, action?: ToastAction) {
    if (action) return null;
    return variant === 'error' ? TOAST_ERROR_DURATION_MS : TOAST_DURATION_MS;
}

/**
 * Show a toast and return its id. A toast with the same message and variant
 * that is already showing is not added again; its id comes back instead.
 */
export function toast(message: string, options: ToastOptions = {}): number {
    const variant = options.variant ?? 'neutral';
    const existing = toasts.find(
        (item) => item.message === message && item.variant === variant
    );
    if (existing) return existing.id;

    const item: ToastItem = {
        id: nextId++,
        message,
        variant,
        action: options.action,
        duration:
            options.duration !== undefined
                ? options.duration
                : defaultDuration(variant, options.action),
    };
    emit([...toasts, item].slice(-MAX_TOASTS));
    return item.id;
}

toast.error = (message: string, options: Omit<ToastOptions, 'variant'> = {}) =>
    toast(message, { ...options, variant: 'error' });

toast.success = (
    message: string,
    options: Omit<ToastOptions, 'variant'> = {}
) => toast(message, { ...options, variant: 'success' });

/** Remove one toast, or all of them with no id. */
toast.dismiss = (id?: number) => {
    if (id === undefined) emit(NONE);
    else if (toasts.some((item) => item.id === id)) {
        emit(toasts.filter((item) => item.id !== id));
    }
};
