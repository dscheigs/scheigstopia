import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import QuantityStepper from './QuantityStepper';
import type { QuantityStepperProps } from './QuantityStepper';

function setup(props: Partial<QuantityStepperProps> = {}) {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
        <QuantityStepper
            value={3}
            onChange={onChange}
            min={1}
            decrementLabel="Remove one"
            incrementLabel="Add one"
            valueLabel="3 owned"
            {...props}
        />
    );
    return { onChange, user };
}

describe('QuantityStepper', () => {
    it('steps down and up', async () => {
        const { onChange, user } = setup();
        await user.click(screen.getByRole('button', { name: 'Remove one' }));
        expect(onChange).toHaveBeenLastCalledWith(2);
        await user.click(screen.getByRole('button', { name: 'Add one' }));
        expect(onChange).toHaveBeenLastCalledWith(4);
    });

    it('shows plain text by default', () => {
        setup();
        expect(screen.queryByRole('textbox')).toBeNull();
        expect(screen.getByLabelText('3 owned')).toHaveTextContent('3');
    });

    it('disables "−" at the minimum', () => {
        setup({ value: 1 });
        expect(
            screen.getByRole('button', { name: 'Remove one' })
        ).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Add one' })).toBeEnabled();
    });

    it('disables "+" at the maximum', () => {
        setup({ value: 5, max: 5 });
        expect(screen.getByRole('button', { name: 'Add one' })).toBeDisabled();
    });

    it('disables everything when disabled', () => {
        setup({ disabled: true, editable: true });
        expect(
            screen.getByRole('button', { name: 'Remove one' })
        ).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Add one' })).toBeDisabled();
        expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('commits a typed value on Enter', async () => {
        const { onChange, user } = setup({ editable: true });
        const field = screen.getByRole('textbox', { name: '3 owned' });
        await user.clear(field);
        await user.type(field, '7{Enter}');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(7);
    });

    it('commits a typed value on blur', async () => {
        const { onChange, user } = setup({ editable: true });
        const field = screen.getByRole('textbox');
        await user.clear(field);
        await user.type(field, '9');
        await user.tab();
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(9);
    });

    it('clamps a typed value to min and max', async () => {
        const { onChange, user } = setup({ editable: true, max: 10 });
        const field = screen.getByRole('textbox');
        await user.clear(field);
        await user.type(field, '0{Enter}');
        expect(onChange).toHaveBeenLastCalledWith(1);
        await user.clear(field);
        await user.type(field, '99{Enter}');
        expect(onChange).toHaveBeenLastCalledWith(10);
    });

    it('reverts an empty or non-numeric entry', async () => {
        const { onChange, user } = setup({ editable: true });
        const field = screen.getByRole('textbox');
        await user.clear(field);
        await user.tab();
        expect(field).toHaveValue('3');
        await user.clear(field);
        await user.type(field, 'abc{Enter}');
        expect(field).toHaveValue('3');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('does not report an unchanged value', async () => {
        const { onChange, user } = setup({ editable: true });
        await user.click(screen.getByRole('textbox'));
        await user.tab();
        expect(onChange).not.toHaveBeenCalled();
    });

    it('keeps the editable field at 16px so iOS Safari does not zoom on focus', () => {
        setup({ editable: true });
        // text-input is fixed at 1rem; text-body follows the smaller body size.
        const field = screen.getByRole('textbox');
        expect(field).toHaveClass('text-input');
        expect(field).not.toHaveClass('text-body');
    });

    it('shows a pending line without disabling anything', async () => {
        const { onChange, user } = setup({ pending: true, editable: true });
        expect(screen.getByRole('status')).toHaveTextContent('Saving…');
        const plus = screen.getByRole('button', { name: 'Add one' });
        expect(plus).toBeEnabled();
        await user.click(plus);
        expect(onChange).toHaveBeenCalledWith(4);
    });

    it('announces an error as an alert and keeps the controls enabled', () => {
        setup({ error: 'Could not save.' });
        expect(screen.getByRole('alert')).toHaveTextContent('Could not save.');
        expect(screen.getByRole('button', { name: 'Add one' })).toBeEnabled();
    });

    it('reserves the status line when idle so nothing jumps', () => {
        setup();
        expect(screen.getByRole('status')).toBeEmptyDOMElement();
    });
});
