import type { Meta, StoryObj } from '@storybook/react-vite';
import Search from './Search';

const meta = {
    title: 'Components/Search',
    component: Search,
    args: {
        placeholder: 'Filter your collection',
        'aria-label': 'Filter your collection',
    },
    argTypes: { disabled: { control: 'boolean' } },
} satisfies Meta<typeof Search>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A text field with a magnifying glass, for filtering a list. */
export const Default: Story = {};

export const Disabled: Story = { args: { disabled: true } };
