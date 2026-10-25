import type { Meta, StoryObj } from '@storybook/react-vite';
import NavAnchor from './NavAnchor';

const meta = {
    title: 'Components/NavAnchor',
    component: NavAnchor,
    args: { href: '#example', children: 'A link' },
} satisfies Meta<typeof NavAnchor>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Without `sameApp` it is a plain anchor, the safe default. */
export const Anchor: Story = {};

/** With `sameApp` it is a Next `<Link>`; Storybook swaps in a plain anchor for it. */
export const SameApp: Story = { args: { sameApp: true } };
