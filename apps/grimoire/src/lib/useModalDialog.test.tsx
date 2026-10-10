import { StrictMode, useRef, useState } from 'react';
import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useModalDialog } from '@/lib/useModalDialog';

// A real browser fires a dialog's close event as a queued task after close(),
// not inline. The shared test shim fires it inline, which hides the problem
// these tests are about, so install the browser's timing here.
const original = {
    showModal: HTMLDialogElement.prototype.showModal,
    close: HTMLDialogElement.prototype.close,
};
beforeEach(() => {
    HTMLDialogElement.prototype.showModal = function showModal() {
        this.setAttribute('open', '');
    };
    HTMLDialogElement.prototype.close = function close() {
        if (!this.hasAttribute('open')) return;
        this.removeAttribute('open');
        setTimeout(() => this.dispatchEvent(new Event('close')), 0);
    };
});
afterEach(() => {
    HTMLDialogElement.prototype.showModal = original.showModal;
    HTMLDialogElement.prototype.close = original.close;
});

function Modal({ onClose }: { onClose: () => void }) {
    const [open, setOpen] = useState(true);
    const ref = useRef<HTMLDialogElement>(null);
    const handleClose = useModalDialog(ref, () => {
        onClose();
        setOpen(false);
    });
    return open ? (
        <dialog ref={ref} onClose={handleClose}>
            <p>Hello</p>
        </dialog>
    ) : null;
}

const settle = () =>
    act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 20));
    });

describe.each([
    ['plain', false],
    ['StrictMode (the dev server)', true],
])('useModalDialog in %s', (_name, strict) => {
    it('stays open after mounting', async () => {
        const onClose = vi.fn();
        const ui = <Modal onClose={onClose} />;
        render(strict ? <StrictMode>{ui}</StrictMode> : ui);
        await settle();
        expect(screen.getByText('Hello')).toBeInTheDocument();
        expect(document.querySelector('dialog')).toHaveAttribute('open');
        expect(onClose).not.toHaveBeenCalled();
    });

    it('reports a real close once and unmounts', async () => {
        const onClose = vi.fn();
        const ui = <Modal onClose={onClose} />;
        render(strict ? <StrictMode>{ui}</StrictMode> : ui);
        await settle();
        act(() => document.querySelector('dialog')?.close());
        await settle();
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(screen.queryByText('Hello')).toBeNull();
    });
});
