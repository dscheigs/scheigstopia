import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
    brandButtonClasses,
    buttonClasses,
    secondaryButtonClasses,
} from '../primitives';
import Button from './Button';

describe('Button', () => {
    it('is a primary button of type button by default', () => {
        render(<Button>Go</Button>);
        const button = screen.getByRole('button', { name: 'Go' });
        expect(button).toHaveAttribute('type', 'button');
        expect(button.className).toContain('bg-neutral-800');
    });

    it('renders the secondary variant', () => {
        render(<Button variant="secondary">Go</Button>);
        const button = screen.getByRole('button', { name: 'Go' });
        expect(button.className).toContain('border-border-minimal');
        expect(button.className).not.toContain('bg-neutral-800');
    });

    it('renders the brand variant in green', () => {
        render(<Button variant="brand">Go</Button>);
        const button = screen.getByRole('button', { name: 'Go' });
        expect(button.className).toContain('bg-accent-muted');
        expect(button.className).not.toContain('bg-neutral-800');
    });

    it('gives every variant the same cursor behavior', () => {
        const { rerender } = render(<Button variant="primary">Go</Button>);
        for (const variant of ['primary', 'secondary', 'brand'] as const) {
            rerender(<Button variant={variant}>Go</Button>);
            const classes = screen.getByRole('button').className.split(' ');
            expect(classes).toContain('enabled:cursor-pointer');
            expect(classes.join(' ')).not.toContain('disabled:cursor');
        }
    });

    it('keeps the cursor in the class strings used on links', () => {
        for (const classes of [
            buttonClasses,
            secondaryButtonClasses,
            brandButtonClasses,
        ]) {
            expect(classes.split(' ')).toContain('enabled:cursor-pointer');
            expect(classes).not.toContain('disabled:cursor');
        }
    });

    it('adds className after the variant classes', () => {
        render(<Button className="absolute top-2">Go</Button>);
        const button = screen.getByRole('button');
        expect(button.className.startsWith(buttonClasses)).toBe(true);
        expect(button.className.endsWith('absolute top-2')).toBe(true);
    });

    it('makes a square, unpadded button for size icon', () => {
        render(
            <Button size="icon" aria-label="Close">
                x
            </Button>
        );
        const classes = screen.getByRole('button').className.split(' ');
        expect(classes).toContain('size-11');
        expect(classes).toContain('p-0');
        expect(classes).not.toContain('px-3');
        expect(classes).toContain('rounded-button');
    });

    it('gives every variant the button radius', () => {
        for (const variant of ['primary', 'secondary', 'brand'] as const) {
            const { unmount } = render(<Button variant={variant}>Go</Button>);
            expect(screen.getByRole('button').className).toContain(
                'rounded-button'
            );
            unmount();
        }
    });

    it('lets a button opt in to submitting a form', async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn((event) => event.preventDefault());
        render(
            <form onSubmit={onSubmit}>
                <Button>Plain</Button>
                <Button type="submit">Send</Button>
            </form>
        );
        await user.click(screen.getByRole('button', { name: 'Plain' }));
        expect(onSubmit).not.toHaveBeenCalled();
        await user.click(screen.getByRole('button', { name: 'Send' }));
        expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it('passes handlers and disabled through', async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();
        const { rerender } = render(<Button onClick={onClick}>Go</Button>);
        await user.click(screen.getByRole('button'));
        expect(onClick).toHaveBeenCalledTimes(1);

        rerender(
            <Button onClick={onClick} disabled>
                Go
            </Button>
        );
        expect(screen.getByRole('button')).toBeDisabled();
        await user.click(screen.getByRole('button'));
        expect(onClick).toHaveBeenCalledTimes(1);
    });
});
