import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ComponentProps } from 'react';
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

function ControlledSearch(
    props: ComponentProps<typeof Search> & { initial: string }
) {
    const { initial, ...rest } = props;
    const [value, setValue] = useState(initial);
    return (
        <Search
            {...rest}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onClear={() => setValue('')}
        />
    );
}

/** Controlled, with a clear button once there is text. Escape clears it too. */
export const WithText: Story = {
    render: (args) => <ControlledSearch {...args} initial="Lightning" />,
};

export const DisabledWithText: Story = {
    args: { value: 'Lightning', disabled: true, onClear: () => {} },
};

/**
 * Empty and unfocused, with a key hint. The label follows the platform you
 * view this on: the Command icon on a Mac, "Ctrl" elsewhere, and nothing on a
 * touch-only device. Focus the field and the hint goes away.
 */
export const WithShortcutHint: Story = {
    render: (args) => (
        <ControlledSearch {...args} initial="" shortcut="mod+k" />
    ),
};
