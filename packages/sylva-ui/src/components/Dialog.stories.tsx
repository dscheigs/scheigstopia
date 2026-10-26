import type { Meta, StoryObj } from '@storybook/react-vite';
import { useDialogState } from '../useDialogState';
import Button from './Button';
import Dialog from './Dialog';

const meta = {
    title: 'Components/Dialog',
    component: Dialog,
    parameters: { layout: 'centered' },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A bottom sheet on a narrow viewport and a centered dialog from `sm` up.
 * Escape, the backdrop and the close button all close it, and focus returns
 * to the button that opened it.
 */
export const Default: Story = {
    args: { open: false, onClose: () => {}, title: 'Island' },
    render: function Render() {
        const dialog = useDialogState();
        return (
            <>
                <Button onClick={() => dialog.show()}>Open dialog</Button>
                <Dialog
                    open={dialog.open}
                    onClose={dialog.close}
                    title="Island"
                >
                    <p className="text-body text-text-minimal">
                        The content has room to grow: it scrolls inside the
                        dialog when it is taller than the screen.
                    </p>
                </Dialog>
            </>
        );
    },
};

/**
 * A confirm with actions. Pass `secondaryAction` (Cancel) and `primaryAction`
 * (Remove); the dialog puts them on the left and right, in that order, whatever
 * order the props are written in.
 */
export const WithActions: Story = {
    args: { open: false, onClose: () => {}, title: 'Island' },
    render: function Render() {
        const dialog = useDialogState();
        return (
            <>
                <Button onClick={() => dialog.show()}>Open dialog</Button>
                <Dialog
                    open={dialog.open}
                    onClose={dialog.close}
                    title="Remove this card?"
                    primaryAction={
                        <Button variant="destructive" onClick={dialog.close}>
                            Remove
                        </Button>
                    }
                    secondaryAction={
                        <Button variant="secondary" onClick={dialog.close}>
                            Cancel
                        </Button>
                    }
                >
                    <p className="text-body text-text-minimal">
                        Island will be removed from your collection.
                    </p>
                </Dialog>
            </>
        );
    },
};

/**
 * Dialogs stack in the browser's top layer, so a confirm can open inside
 * another dialog. Escape closes only the top one.
 */
export const Nested: Story = {
    args: { open: false, onClose: () => {}, title: 'Island' },
    render: function Render() {
        const sheet = useDialogState();
        const confirm = useDialogState();
        return (
            <>
                <Button onClick={() => sheet.show()}>Open sheet</Button>
                <Dialog open={sheet.open} onClose={sheet.close} title="Island">
                    <Button variant="secondary" onClick={() => confirm.show()}>
                        Remove
                    </Button>
                    <Dialog
                        open={confirm.open}
                        onClose={confirm.close}
                        title="Remove this card?"
                        primaryAction={
                            <Button
                                variant="destructive"
                                onClick={confirm.close}
                            >
                                Remove
                            </Button>
                        }
                        secondaryAction={
                            <Button variant="secondary" onClick={confirm.close}>
                                Cancel
                            </Button>
                        }
                    >
                        <p className="text-body text-text-minimal">
                            Cancel sits on the left, the primary action on the
                            right.
                        </p>
                    </Dialog>
                </Dialog>
            </>
        );
    },
};
