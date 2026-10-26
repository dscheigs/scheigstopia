import type { Meta, StoryObj } from '@storybook/react-vite';
import Button from './Button';
import Spinner from './Spinner';

const meta = {
    title: 'Components/Spinner',
    component: Spinner,
    argTypes: {
        size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    },
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The default ring. Use the toolbar toggle to see it in light and dark. */
export const Default: Story = {};

/** The three sizes. */
export const Sizes: Story = {
    render: () => (
        <div className="flex items-center gap-6">
            <Spinner size="sm" />
            <Spinner size="md" />
            <Spinner size="lg" />
        </div>
    ),
};

/** The ring follows the text color, so it works on any surface. */
export const LightAndDark: Story = {
    render: () => (
        <div className="flex gap-6">
            <div className="flex items-center gap-3 rounded-surface bg-neutral-800 p-4 text-white">
                <Spinner />
                <span className="text-body">On a dark surface</span>
            </div>
            <div className="flex items-center gap-3 rounded-surface border border-border-minimal p-4">
                <Spinner />
                <span className="text-body">On the page</span>
            </div>
        </div>
    ),
};

/** Inside a button it takes the button's text color. */
export const InsideButton: Story = {
    render: () => (
        <div className="flex gap-3">
            <Button variant="primary" disabled>
                <Spinner size="sm" label="Saving" /> Saving
            </Button>
            <Button variant="secondary" disabled>
                <Spinner size="sm" label="Saving" /> Saving
            </Button>
            <Button variant="brand" disabled>
                <Spinner size="sm" label="Saving" /> Saving
            </Button>
        </div>
    ),
};

/** Centered, as in an empty list that is still loading. */
export const Centered: Story = {
    render: () => (
        <div className="py-8 text-text-minimal">
            <Spinner className="mx-auto block w-fit" />
        </div>
    ),
};
