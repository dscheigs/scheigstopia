import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import QuantityStepper from './QuantityStepper';
import type { QuantityStepperProps } from './QuantityStepper';

const meta = {
    title: 'Components/QuantityStepper',
    component: QuantityStepper,
    args: {
        value: 3,
        onChange: () => {},
        min: 1,
        decrementLabel: 'Remove one Island',
        incrementLabel: 'Add one Island',
        valueLabel: '3 owned',
    },
    argTypes: {
        editable: { control: 'boolean' },
        disabled: { control: 'boolean' },
    },
} satisfies Meta<typeof QuantityStepper>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Holds the value, as the app that uses it would. */
function Live(args: QuantityStepperProps) {
    const [value, setValue] = useState(args.value);
    return (
        <QuantityStepper
            {...args}
            value={value}
            valueLabel={`${value} owned`}
            onChange={setValue}
        />
    );
}

/** The number is plain text; only the buttons change it. */
export const PlainText: Story = { render: (args) => <Live {...args} /> };

/** The number is a field: type a count and press Enter or leave the field. */
export const TextField: Story = {
    args: { editable: true },
    render: (args) => <Live {...args} />,
};

/** At `min` the "−" button is disabled. */
export const AtMinimum: Story = {
    args: { value: 1, editable: true },
    render: (args) => <Live {...args} />,
};

/** At `max` the "+" button is disabled, and typed values are capped. */
export const AtMaximum: Story = {
    args: { value: 5, max: 5, editable: true },
    render: (args) => <Live {...args} />,
};

export const Disabled: Story = {
    args: { disabled: true, editable: true },
    render: (args) => <Live {...args} />,
};
