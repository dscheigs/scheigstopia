import { fireEvent, render, screen } from '@testing-library/react';
import { useRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { useBlurOnTouchScroll } from '@/lib/useBlurOnTouchScroll';

function Field() {
    const ref = useRef<HTMLInputElement>(null);
    useBlurOnTouchScroll(ref);
    return (
        <div>
            <input ref={ref} aria-label="Field" />
            <button type="button">Elsewhere</button>
        </div>
    );
}

const touch = (target: Element, type: string, clientY: number) =>
    fireEvent(
        target,
        Object.assign(new Event(type, { bubbles: true }), {
            touches: [{ clientY }],
        })
    );

describe('useBlurOnTouchScroll', () => {
    it('blurs the focused field once a touch moves far enough', () => {
        render(<Field />);
        const field = screen.getByLabelText('Field');
        field.focus();
        touch(document.body, 'touchstart', 400);
        touch(document.body, 'touchmove', 405);
        expect(field).toHaveFocus();
        touch(document.body, 'touchmove', 300);
        expect(field).not.toHaveFocus();
    });

    it('leaves a drag that starts in the field alone', () => {
        render(<Field />);
        const field = screen.getByLabelText('Field');
        field.focus();
        touch(field, 'touchstart', 400);
        touch(document.body, 'touchmove', 200);
        expect(field).toHaveFocus();
    });

    it('does nothing when the field is not focused, or after the touch ends', () => {
        render(<Field />);
        const field = screen.getByLabelText('Field');
        const other = screen.getByRole('button', { name: 'Elsewhere' });
        other.focus();
        touch(document.body, 'touchstart', 400);
        touch(document.body, 'touchmove', 200);
        expect(other).toHaveFocus();

        field.focus();
        touch(document.body, 'touchstart', 400);
        touch(document.body, 'touchend', 400);
        touch(document.body, 'touchmove', 100);
        expect(field).toHaveFocus();
    });

    it('ignores the mouse wheel', () => {
        render(<Field />);
        const field = screen.getByLabelText('Field');
        field.focus();
        fireEvent.wheel(document.body, { deltaY: 500 });
        expect(field).toHaveFocus();
    });

    it('stops listening on unmount', () => {
        const remove = vi.spyOn(window, 'removeEventListener');
        const { unmount } = render(<Field />);
        unmount();
        const removed = remove.mock.calls.map(([type]) => type);
        expect(removed).toEqual(
            expect.arrayContaining([
                'touchstart',
                'touchmove',
                'touchend',
                'touchcancel',
            ])
        );
        remove.mockRestore();
    });
});
