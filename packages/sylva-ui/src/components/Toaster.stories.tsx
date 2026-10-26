import type { Meta, StoryObj } from '@storybook/react-vite';
import Button from './Button';
import Toaster from './Toaster';
import { toast } from '../toastStore';

const meta = {
    title: 'Components/Toaster',
    component: Toaster,
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Each button calls `toast()`, as app code would. Use the toolbar toggle for light and dark. */
export const Variants: Story = {
    render: () => (
        <div className="flex flex-wrap gap-2">
            <Toaster />
            <Button variant="secondary" onClick={() => toast('Link copied')}>
                Neutral
            </Button>
            <Button
                variant="secondary"
                onClick={() => toast.success('Card added')}
            >
                Success
            </Button>
            <Button
                variant="secondary"
                onClick={() => toast.error('That did not save.')}
            >
                Error
            </Button>
        </div>
    ),
};

/** An action keeps the toast until it is used or dismissed. */
export const WithAction: Story = {
    render: () => (
        <>
            <Toaster />
            <Button
                variant="secondary"
                onClick={() =>
                    toast.error('Could not save the quantity.', {
                        action: {
                            label: 'Retry',
                            onClick: () => toast.success('Saved'),
                        },
                    })
                }
            >
                Show an error with Retry
            </Button>
        </>
    ),
};

/** The newest three stay; an identical message is not shown twice. */
export const Stack: Story = {
    render: () => (
        <>
            <Toaster />
            <Button
                variant="secondary"
                onClick={() => {
                    toast('First');
                    toast.success('Second');
                    toast.error('Third');
                    toast('Fourth pushes the first off');
                }}
            >
                Show several
            </Button>
        </>
    ),
};
