import type { Meta, StoryObj } from '@storybook/react-vite';
import AnimatedNav from './AnimatedNav';

const meta = {
    title: 'Components/AnimatedNav',
    component: AnimatedNav,
    decorators: [
        (Story) => (
            <nav aria-label="Example">
                <Story />
            </nav>
        ),
    ],
} satisfies Meta<typeof AnimatedNav>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Hover or tab through the links: the underline slides between them. */
export const Default: Story = {
    args: {
        items: [
            { name: 'One', href: '#one', current: true },
            { name: 'Two', href: '#two' },
            { name: 'Three', href: '#three' },
        ],
    },
};
