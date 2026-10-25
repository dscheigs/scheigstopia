import type { Meta, StoryObj } from '@storybook/react-vite';
import { Check, X } from '../icons';
import Button from './Button';

const meta = {
    title: 'Components/Button',
    component: Button,
    args: { children: 'Button' },
    argTypes: {
        variant: { control: 'inline-radio', options: ['primary', 'secondary'] },
        disabled: { control: 'boolean' },
    },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The filled button, for the main action. */
export const Primary: Story = { args: { variant: 'primary' } };

/** The outlined button, for everything else. */
export const Secondary: Story = { args: { variant: 'secondary' } };

/** Hover the buttons: enabled ones show a pointer, disabled ones not-allowed. */
export const Disabled: Story = {
    args: { disabled: true },
    render: (args) => (
        <div className="flex gap-3">
            <Button {...args} variant="primary" />
            <Button {...args} variant="secondary" />
        </div>
    ),
};

/** Side by side, enabled and disabled, to check the cursor and states. */
export const AllStates: Story = {
    render: () => (
        <div className="grid max-w-md grid-cols-2 gap-4">
            <Button variant="primary">Primary</Button>
            <Button variant="primary" disabled>
                Primary disabled
            </Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="secondary" disabled>
                Secondary disabled
            </Button>
        </div>
    ),
};

/** Icon-only: a label for screen readers, and `min-w-11 px-0` for the square. */
export const IconOnly: Story = {
    render: () => (
        <div className="flex gap-3">
            <Button
                variant="secondary"
                aria-label="Confirm"
                className="min-w-11 px-0"
            >
                <Check aria-hidden="true" />
            </Button>
            <Button
                variant="secondary"
                aria-label="Remove"
                className="min-w-11 px-0"
            >
                <X aria-hidden="true" />
            </Button>
        </div>
    ),
};

/** The default `type` is `button`; use `type="submit"` inside a form. */
export const Submit: Story = {
    args: { type: 'submit', children: 'Submit' },
    render: (args) => (
        <form
            onSubmit={(event) => {
                event.preventDefault();
            }}
        >
            <Button {...args} />
        </form>
    ),
};
