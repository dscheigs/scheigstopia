import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import Search from './Search';
import TextField from './TextField';

describe('TextField', () => {
    it('forwards input props and the ref', async () => {
        const onChange = vi.fn();
        const ref = createRef<HTMLInputElement>();
        render(
            <TextField
                ref={ref}
                aria-label="Name"
                placeholder="Card"
                onChange={onChange}
            />
        );
        const input = screen.getByRole('textbox', { name: 'Name' });
        expect(ref.current).toBe(input);
        await userEvent.type(input, 'ab');
        expect(onChange).toHaveBeenCalledTimes(2);
    });

    it('uses the 16px input type and pads for a leading icon', () => {
        render(
            <TextField aria-label="Name" leading={<svg data-testid="icon" />} />
        );
        const input = screen.getByRole('textbox', { name: 'Name' });
        expect(input.className).toContain('text-input');
        expect(input.className).toContain('pl-11');
        expect(screen.getByTestId('icon').parentElement).toHaveAttribute(
            'aria-hidden',
            'true'
        );
    });

    it('pads for a trailing node and keeps it clickable', async () => {
        const onClick = vi.fn();
        render(
            <TextField
                aria-label="Name"
                trailing={<button onClick={onClick}>go</button>}
            />
        );
        expect(screen.getByRole('textbox').className).toContain('pr-14');
        await userEvent.click(screen.getByRole('button', { name: 'go' }));
        expect(onClick).toHaveBeenCalled();
    });

    it('can be disabled', () => {
        render(<TextField aria-label="Name" disabled />);
        expect(screen.getByRole('textbox')).toBeDisabled();
    });
});

describe('Search', () => {
    it('is a search input with autocomplete off and an icon', () => {
        const { container } = render(<Search aria-label="Find" />);
        const input = screen.getByRole('searchbox', { name: 'Find' });
        expect(input).toHaveAttribute('autocomplete', 'off');
        expect(container.querySelector('svg')).not.toBeNull();
    });
});
