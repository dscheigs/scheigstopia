import type { Meta, StoryObj } from '@storybook/react-vite';
import Button from '../components/Button';
import { inputClasses } from '../primitives';

const meta = {
    title: 'Foundations/Radius',
    parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// Written out in full so Tailwind sees each class.
const scale = [
    {
        name: 'rounded-button',
        className: 'rounded-button',
        use: 'Every button, icon-only ones included: a pill, and a circle when square.',
    },
    {
        name: 'rounded-control',
        className: 'rounded-control',
        use: 'Inputs: things you type into.',
    },
    {
        name: 'rounded-surface',
        className: 'rounded-surface',
        use: 'Cards, dialogs, panels, lists and images: things that hold content.',
    },
    {
        name: 'rounded-thumb',
        className: 'rounded-thumb',
        use: 'Small thumbnails, where a bigger radius would swallow the image.',
    },
    {
        name: 'rounded-full',
        className: 'rounded-full',
        use: 'Circles and pills only.',
    },
];

/**
 * The radius scale. The values live in `styles/radius.css`; change them there
 * and every control, card and thumbnail follows.
 */
export const Scale: Story = {
    render: () => (
        <div className="grid gap-4 sm:grid-cols-2">
            {scale.map(({ name, className, use }) => (
                <div
                    key={name}
                    className="flex items-center gap-4 border-b border-border-minimal py-4"
                >
                    <div
                        className={`${className} size-20 shrink-0 border border-border-minimal bg-surface-minimal-hover`}
                    />
                    <div>
                        <code className="text-caption text-text-minimal">
                            {name}
                        </code>
                        <p className="text-body">{use}</p>
                    </div>
                </div>
            ))}
        </div>
    ),
};

/** A control inside a surface, to judge how the two radii sit together. */
export const Together: Story = {
    render: () => (
        <div className="max-w-md space-y-4 rounded-surface border border-border-minimal bg-surface-minimal p-4">
            <input className={inputClasses} placeholder="Card name" />
            <div className="flex gap-3">
                <Button variant="brand">Add</Button>
                <Button variant="primary">Save</Button>
                <Button variant="secondary">Cancel</Button>
            </div>
        </div>
    ),
};
