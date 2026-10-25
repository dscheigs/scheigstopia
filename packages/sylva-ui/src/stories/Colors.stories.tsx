import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
    title: 'Foundations/Colors',
    parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

type Swatch = { name: string; className: string };

// Written out in full so Tailwind sees each class. Swatches use the mapped
// classes, so they follow Sylva and the theme toggle.
const groups: { title: string; swatches: Swatch[] }[] = [
    {
        title: 'Brand',
        swatches: [
            { name: 'background', className: 'bg-background' },
            { name: 'foreground', className: 'bg-foreground' },
            { name: 'primary', className: 'bg-primary' },
            { name: 'primary-hover', className: 'bg-primary-hover' },
            { name: 'primary-dark', className: 'bg-primary-dark' },
            { name: 'accent', className: 'bg-accent' },
            { name: 'accent-muted', className: 'bg-accent-muted' },
            { name: 'accent-muted-hover', className: 'bg-accent-muted-hover' },
        ],
    },
    {
        title: 'Surfaces and borders',
        swatches: [
            { name: 'surface', className: 'bg-surface' },
            { name: 'surface-hover', className: 'bg-surface-hover' },
            { name: 'border', className: 'bg-border' },
            { name: 'muted', className: 'bg-muted' },
            { name: 'surface-minimal', className: 'bg-surface-minimal' },
            {
                name: 'surface-minimal-hover',
                className: 'bg-surface-minimal-hover',
            },
            { name: 'border-minimal', className: 'bg-border-minimal' },
            { name: 'text-minimal', className: 'bg-text-minimal' },
        ],
    },
    {
        title: 'Neutral scale',
        swatches: [
            { name: 'neutral-50', className: 'bg-neutral-50' },
            { name: 'neutral-100', className: 'bg-neutral-100' },
            { name: 'neutral-200', className: 'bg-neutral-200' },
            { name: 'neutral-300', className: 'bg-neutral-300' },
            { name: 'neutral-400', className: 'bg-neutral-400' },
            { name: 'neutral-500', className: 'bg-neutral-500' },
            { name: 'neutral-600', className: 'bg-neutral-600' },
            { name: 'neutral-700', className: 'bg-neutral-700' },
            { name: 'neutral-800', className: 'bg-neutral-800' },
            { name: 'neutral-900', className: 'bg-neutral-900' },
            { name: 'neutral-950', className: 'bg-neutral-950' },
        ],
    },
    {
        title: 'Semantic',
        swatches: [
            { name: 'success', className: 'bg-success' },
            { name: 'warning', className: 'bg-warning' },
            { name: 'error', className: 'bg-error' },
        ],
    },
];

/** Every Sylva-mapped color class. Flip the theme in the toolbar to compare. */
export const Palette: Story = {
    render: () => (
        <div className="space-y-8">
            {groups.map((group) => (
                <section key={group.title}>
                    <h2 className="mb-3 text-subheading">{group.title}</h2>
                    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        {group.swatches.map(({ name, className }) => (
                            <li key={name}>
                                <div
                                    className={`${className} h-16 rounded-lg border border-border-minimal`}
                                />
                                <code className="text-caption text-text-minimal">
                                    {name}
                                </code>
                            </li>
                        ))}
                    </ul>
                </section>
            ))}
        </div>
    ),
};
