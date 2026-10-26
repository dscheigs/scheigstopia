import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Spinner from './Spinner';

describe('Spinner', () => {
    it('is a status named Loading by default', () => {
        render(<Spinner />);
        expect(screen.getByRole('status')).toHaveTextContent('Loading');
        expect(screen.getByText('Loading')).toHaveClass('sr-only');
    });

    it('takes a custom label', () => {
        render(<Spinner label="Saving" />);
        expect(screen.getByRole('status')).toHaveTextContent('Saving');
    });

    it('spins only when motion is allowed', () => {
        const { container } = render(<Spinner />);
        const ring = container.querySelector('[aria-hidden]');
        expect(ring).toHaveClass('motion-safe:animate-spin');
        expect(ring).toHaveClass('motion-reduce:animate-pulse');
    });

    it('applies the size and extra classes', () => {
        render(<Spinner size="lg" className="mx-auto" />);
        const status = screen.getByRole('status');
        expect(status).toHaveClass('mx-auto');
        expect(status.firstElementChild).toHaveClass('size-10');
    });
});
