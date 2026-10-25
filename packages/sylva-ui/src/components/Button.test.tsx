import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { buttonClasses, secondaryButtonClasses } from '../primitives';
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

    it('gives both variants the same cursor behavior', () => {
        const { rerender } = render(<Button variant="primary">Go</Button>);
        for (const variant of ['primary', 'secondary'] as const) {
            rerender(<Button variant={variant}>Go</Button>);
            const classes = screen.getByRole('button').className.split(' ');
            expect(classes).toContain('cursor-pointer');
            expect(classes).toContain('disabled:cursor-not-allowed');
        }
    });

    it('keeps the cursor in the class strings used on links', () => {
        for (const classes of [buttonClasses, secondaryButtonClasses]) {
            expect(classes.split(' ')).toContain('cursor-pointer');
            expect(classes.split(' ')).toContain('disabled:cursor-not-allowed');
        }
    });

    it('adds className after the variant classes', () => {
        render(<Button className="min-w-11 px-0">Go</Button>);
        const button = screen.getByRole('button');
        expect(button.className.startsWith(buttonClasses)).toBe(true);
        expect(button.className.endsWith('min-w-11 px-0')).toBe(true);
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
