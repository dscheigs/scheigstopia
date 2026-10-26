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

export const Grimoire: Story = { args: { variant: 'grimoire' } };
export const GrimoireHeader: Story = {
    args: { variant: 'grimoire', size: 26 },
};

/** Both gnomes at the sizes the apps use: 26px in the header, 48px on the site home. */
export const Compare: Story = {
    render: () => (
        <div className="flex items-end gap-6">
            {([26, 48] as const).map((size) => (
                <div key={size} className="flex items-end gap-3">
                    <GnomeIcon size={size} />
                    <GnomeIcon size={size} variant="grimoire" />
                </div>
            ))}
        </div>
    ),
};
