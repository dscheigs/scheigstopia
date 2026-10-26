'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from '../icons';
import Button from './Button';

export type DialogProps = {
    open: boolean;
    /** Called when the user dismisses it (Escape, the backdrop or the close button). */
    onClose: () => void;
    /** The heading, also the dialog's accessible name. */
    title: ReactNode;
    children?: ReactNode;
    /**
     * The main action, such as a submit or confirm button. The footer always
     * puts it on the right, so callers cannot get the order wrong.
     */
    primaryAction?: ReactNode;
    /** The other action, usually Cancel. Always on the left, opposite the primary one. */
    secondaryAction?: ReactNode;
    /** Extra classes for the content area under the heading. */
    className?: string;
};

/**
 * A modal on the native `<dialog>` element: Escape, the focus trap and focus
 * restore come from the browser. A bottom sheet on small screens, a centered
 * dialog from `sm` up. Controlled: it owns no state, so pair it with
 * `useDialogState`. Its children mount only while open.
 *
 * Actions go in `primaryAction` and `secondaryAction`, not in the children:
 * the footer lays them out with the secondary one (Cancel) on the left and the
 * primary one (Remove, Save) on the right, the same in every dialog. Use
 * `variant="destructive"` on the primary button for a destructive confirm.
 *
 * Dialogs stack in the browser's top layer, so one can open inside another
 * and Escape closes only the top one.
 */
export default function Dialog({
    open,
    onClose,
    title,
    children,
    primaryAction,
    secondaryAction,
    className = '',
}: DialogProps) {
    const ref = useRef<HTMLDialogElement>(null);
    const titleId = useId();

    useEffect(() => {
        const dialog = ref.current;
        if (!dialog) return;
        if (open && !dialog.open) dialog.showModal();
        else if (!open && dialog.open) dialog.close();
    }, [open]);

    // Closing on unmount lets the browser restore focus. In StrictMode (the
    // dev server) this runs once early, and the effect above reopens it.
    useEffect(() => () => ref.current?.close(), []);

    return (
        <dialog
            ref={ref}
            aria-labelledby={titleId}
            onClose={() => {
                // A close we caused ourselves (open turned false) is not a
                // dismissal, and a stale event from before a reopen arrives
                // while the dialog is open again.
                if (open && !ref.current?.open) onClose();
            }}
            onClick={(event) => {
                // A click on the backdrop lands on the dialog itself.
                if (event.target === event.currentTarget) onClose();
            }}
            className="m-0 mt-auto max-h-dvh w-full max-w-none overflow-y-auto rounded-b-none rounded-t-surface border border-border-minimal bg-surface-minimal p-0 text-foreground backdrop:bg-neutral-950/60 sm:m-auto sm:max-w-md sm:rounded-b-surface"
        >
            {open && (
                <div className="space-y-4 p-4">
                    <div className="flex items-start justify-between gap-3">
                        <h2 id={titleId} className="min-w-0 text-subheading">
                            {title}
                        </h2>
                        <Button
                            onClick={onClose}
                            aria-label="Close"
                            variant="secondary"
                            size="icon"
                        >
                            <X aria-hidden="true" />
                        </Button>
                    </div>
                    <div className={className}>{children}</div>
                    {(primaryAction || secondaryAction) && (
                        <div
                            data-dialog-actions
                            className="flex items-center justify-between gap-2"
                        >
                            <div>{secondaryAction}</div>
                            <div>{primaryAction}</div>
                        </div>
                    )}
                </div>
            )}
        </dialog>
    );
}
