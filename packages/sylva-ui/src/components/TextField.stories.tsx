import type { Meta, StoryObj } from '@storybook/react-vite';
import { SearchIcon } from '../icons';
import TextField from './TextField';

const meta = {
    title: 'Components/TextField',
    component: TextField,
    args: { placeholder: 'Card name', 'aria-label': 'Card name' },
    argTypes: { disabled: { control: 'boolean' } },
} satisfies Meta<typeof TextField>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The plain text input. */
export const Plain: Story = {};

/** `leading` puts a decorative icon inside the field, on the left. */
export const WithLeadingIcon: Story = {
    args: { leading: <SearchIcon size={18} /> },
};

export const Disabled: Story = { args: { disabled: true } };
