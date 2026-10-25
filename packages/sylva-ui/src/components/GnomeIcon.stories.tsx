import type { Meta, StoryObj } from '@storybook/react-vite';
import GnomeIcon from './GnomeIcon';

const meta = {
    title: 'Components/GnomeIcon',
    component: GnomeIcon,
    args: { size: 48 },
    argTypes: { size: { control: { type: 'range', min: 16, max: 128 } } },
} satisfies Meta<typeof GnomeIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Header: Story = { args: { size: 26 } };
