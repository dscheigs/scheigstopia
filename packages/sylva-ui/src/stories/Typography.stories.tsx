import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
    title: 'Foundations/Typography',
    parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// Written out in full so Tailwind sees each class.
const scale = [
    { name: 'text-hero', className: 'text-hero' },
    { name: 'text-page-title', className: 'text-page-title' },
    { name: 'text-section-title', className: 'text-section-title' },
    { name: 'text-heading', className: 'text-heading' },
    { name: 'text-subheading', className: 'text-subheading' },
    { name: 'text-lead', className: 'text-lead' },
    { name: 'text-body', className: 'text-body' },
    { name: 'text-input', className: 'text-input' },
    { name: 'text-caption', className: 'text-caption' },
];

/** The type scale. Use these classes instead of Tailwind's text sizes. */
export const Scale: Story = {
    render: () => (
        <div>
            {scale.map(({ name, className }) => (
                <div key={name} className="border-b border-border-minimal py-4">
                    <code className="text-caption text-text-minimal">
                        {name}
                    </code>
                    <p className={className}>
                        The quick brown gnome jumps over the lazy dog
                    </p>
                </div>
            ))}
        </div>
    ),
};
