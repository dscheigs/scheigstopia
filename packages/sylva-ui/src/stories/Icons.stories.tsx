import type { Meta, StoryObj } from '@storybook/react-vite';
import {
    Check,
    ChevronRight,
    LogOut,
    Pencil,
    Volume2,
    VolumeOff,
    X,
} from '../icons';

const meta = {
    title: 'Foundations/Icons',
    parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const icons = { Check, ChevronRight, LogOut, Pencil, Volume2, VolumeOff, X };

/** Apps import these from the package, never from lucide-react directly. */
export const All: Story = {
    render: () => (
        <ul className="flex flex-wrap gap-6">
            {Object.entries(icons).map(([name, Icon]) => (
                <li
                    key={name}
                    className="flex w-28 flex-col items-center gap-2 rounded-surface border border-border-minimal bg-surface-minimal p-4"
                >
                    <Icon aria-hidden="true" />
                    <code className="text-caption text-text-minimal">
                        {name}
                    </code>
                </li>
            ))}
        </ul>
    ),
};
