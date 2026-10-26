import { StrictMode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { useDialogState } from '../useDialogState';
import Dialog from './Dialog';

function Harness() {
    const dialog = useDialogState();
    return (
        <>
            <button onClick={() => dialog.show()}>Open</button>
            <Dialog open={dialog.open} onClose={dialog.close} title="Island">
                <p>Body</p>
            </Dialog>
        </>
    );
}

const dialogEl = () => document.querySelector('dialog') as HTMLDialogElement;

describe.each([
    ['plain', false],
    ['StrictMode', true],
])('Dialog in %s', (_name, strict) => {
    const ui = strict ? (
        <StrictMode>
            <Harness />
        </StrictMode>
    ) : (
        <Harness />
    );

    it('is closed and empty until opened, then named by its title', async () => {
        render(ui);
        expect(dialogEl()).not.toHaveAttribute('open');
        expect(screen.queryByText('Body')).toBeNull();

        await userEvent.click(screen.getByRole('button', { name: 'Open' }));
        expect(dialogEl()).toHaveAttribute('open');
        expect(screen.getByText('Body')).toBeInTheDocument();
        expect(dialogEl()).toHaveAttribute(
            'aria-labelledby',
            screen.getByRole('heading', { name: 'Island' }).id
        );
    });

    it('closes with the close button', async () => {
        render(ui);
        await userEvent.click(screen.getByRole('button', { name: 'Open' }));
        await userEvent.click(screen.getByRole('button', { name: 'Close' }));
        expect(dialogEl()).not.toHaveAttribute('open');
        expect(screen.queryByText('Body')).toBeNull();
    });

    it('closes on the backdrop but not on a click inside', async () => {
        render(ui);
        await userEvent.click(screen.getByRole('button', { name: 'Open' }));
        await userEvent.click(screen.getByText('Body'));
        expect(dialogEl()).toHaveAttribute('open');

        // The backdrop is the dialog element itself.
        await userEvent.click(dialogEl());
        expect(dialogEl()).not.toHaveAttribute('open');
    });

    it('closes when the browser closes it, as Escape does', async () => {
        render(ui);
        await userEvent.click(screen.getByRole('button', { name: 'Open' }));
        act(() => dialogEl().close());
        expect(screen.queryByText('Body')).toBeNull();
        // Reopens afterwards: the close was reported, not swallowed.
        await userEvent.click(screen.getByRole('button', { name: 'Open' }));
        expect(dialogEl()).toHaveAttribute('open');
    });
});

describe('nested Dialog', () => {
    it('closes only the dialog that was dismissed', async () => {
        function Nested() {
            const outer = useDialogState();
            const inner = useDialogState();
            return (
                <>
                    <button onClick={() => outer.show()}>Open outer</button>
                    <Dialog
                        open={outer.open}
                        onClose={outer.close}
                        title="Outer"
                    >
                        <button onClick={() => inner.show()}>Open inner</button>
                        <Dialog
                            open={inner.open}
                            onClose={inner.close}
                            title="Inner"
                        >
                            <p>Inner body</p>
                        </Dialog>
                    </Dialog>
                </>
            );
        }
        render(<Nested />);
        await userEvent.click(screen.getByText('Open outer'));
        await userEvent.click(screen.getByText('Open inner'));
        expect(screen.getByText('Inner body')).toBeInTheDocument();

        const [outer, inner] = Array.from(document.querySelectorAll('dialog'));
        fireEvent.click(inner);
        expect(screen.queryByText('Inner body')).toBeNull();
        expect(outer).toHaveAttribute('open');
        expect(screen.getByText('Open inner')).toBeInTheDocument();
    });
});

describe('Dialog actions', () => {
    it('puts the secondary action first and the primary one last, whatever the prop order', () => {
        render(
            <Dialog
                open
                onClose={() => {}}
                title="Remove this card?"
                primaryAction={<button>Remove</button>}
                secondaryAction={<button>Cancel</button>}
            >
                <p>Body</p>
            </Dialog>
        );
        const footer = document.querySelector('[data-dialog-actions]');
        expect(footer).not.toBeNull();
        const labels = Array.from(footer!.querySelectorAll('button')).map(
            (button) => button.textContent
        );
        expect(labels).toEqual(['Cancel', 'Remove']);
        expect(footer!.className).toContain('justify-between');
    });

    it('keeps a lone primary action on the right and renders no footer without actions', () => {
        const { rerender } = render(
            <Dialog
                open
                onClose={() => {}}
                title="Island"
                primaryAction={<button>Save</button>}
            />
        );
        const footer = document.querySelector('[data-dialog-actions]')!;
        expect(footer.lastElementChild).toContainElement(
            screen.getByRole('button', { name: 'Save' })
        );
        expect(footer.firstElementChild).toBeEmptyDOMElement();

        rerender(<Dialog open onClose={() => {}} title="Island" />);
        expect(document.querySelector('[data-dialog-actions]')).toBeNull();
    });
});
