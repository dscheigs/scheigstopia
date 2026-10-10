import { useEffect, type RefObject } from 'react';

/**
 * Opens the native <dialog> in `ref` as a modal when it mounts and closes it
 * when it unmounts (so the browser restores focus). Returns the handler for the
 * dialog's `onClose` event.
 *
 * The handler only reports a real close. React StrictMode (the dev server) runs
 * the effect cleanup and then the effect again, and the cleanup's `close()`
 * queues a `close` event that arrives after the dialog has been reopened;
 * reporting that one would unmount the dialog the moment it appeared.
 */
export function useModalDialog(
    ref: RefObject<HTMLDialogElement | null>,
    onClose: () => void
): () => void {
    useEffect(() => {
        const dialog = ref.current;
        if (dialog && !dialog.open) dialog.showModal();
        return () => dialog?.close();
    }, [ref]);

    return () => {
        if (!ref.current?.open) onClose();
    };
}
