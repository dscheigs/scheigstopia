import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    MAX_TOASTS,
    TOAST_DURATION_MS,
    TOAST_ERROR_DURATION_MS,
    toast,
} from '../toastStore';
import Toaster from './Toaster';

beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
    act(() => toast.dismiss());
    vi.useRealTimers();
});

const advance = (ms: number) =>
    act(() => {
        vi.advanceTimersByTime(ms);
    });

describe('Toaster', () => {
    it('renders nothing until a toast is shown', () => {
        const { container } = render(<Toaster />);
        expect(container).toBeEmptyDOMElement();
    });

    it('shows a toast called outside React, as a status', () => {
        render(<Toaster />);
        act(() => {
            toast('Saved to the list');
        });
        expect(screen.getByRole('status')).toHaveTextContent(
            'Saved to the list'
        );
    });

    it('announces an error as an alert, and success as a status', () => {
        render(<Toaster />);
        act(() => {
            toast.error('That did not save');
            toast.success('Done');
        });
        expect(screen.getByRole('alert')).toHaveTextContent(
            'That did not save'
        );
        expect(screen.getByRole('status')).toHaveTextContent('Done');
    });

    it('dismisses itself after the delay, errors later than the rest', () => {
        render(<Toaster />);
        act(() => {
            toast('Neutral');
            toast.error('Broken');
        });
        advance(TOAST_DURATION_MS);
        expect(screen.queryByText('Neutral')).toBeNull();
        expect(screen.getByText('Broken')).toBeInTheDocument();
        advance(TOAST_ERROR_DURATION_MS - TOAST_DURATION_MS);
        expect(screen.queryByText('Broken')).toBeNull();
    });

    it('stays while hovered and resumes with the time that was left', async () => {
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        render(<Toaster />);
        act(() => {
            toast('Hold on');
        });
        advance(TOAST_DURATION_MS - 1000);
        await user.hover(screen.getByRole('status'));
        advance(TOAST_DURATION_MS * 3);
        expect(screen.getByText('Hold on')).toBeInTheDocument();

        await user.unhover(screen.getByRole('status'));
        advance(500);
        expect(screen.getByText('Hold on')).toBeInTheDocument();
        advance(500);
        expect(screen.queryByText('Hold on')).toBeNull();
    });

    it('stays while focus is inside it', async () => {
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        render(<Toaster />);
        act(() => {
            toast('Focus me');
        });
        await user.tab();
        expect(screen.getByRole('button', { name: 'Dismiss' })).toHaveFocus();
        advance(TOAST_DURATION_MS * 3);
        expect(screen.getByText('Focus me')).toBeInTheDocument();
    });

    it('does not show an identical message twice', () => {
        render(<Toaster />);
        act(() => {
            const first = toast.error('Same');
            expect(toast.error('Same')).toBe(first);
        });
        expect(screen.getAllByText('Same')).toHaveLength(1);
        // A different variant is a different toast.
        act(() => {
            toast.success('Same');
        });
        expect(screen.getAllByText('Same')).toHaveLength(2);
    });

    it('keeps only the newest few', () => {
        render(<Toaster />);
        act(() => {
            for (let i = 1; i <= MAX_TOASTS + 2; i++) toast(`Toast ${i}`);
        });
        expect(screen.queryByText('Toast 1')).toBeNull();
        expect(screen.queryByText('Toast 2')).toBeNull();
        expect(screen.getByText(`Toast ${MAX_TOASTS + 2}`)).toBeInTheDocument();
        expect(screen.getAllByRole('status')).toHaveLength(MAX_TOASTS);
    });

    it('dismisses from the close button', async () => {
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        render(<Toaster />);
        act(() => {
            toast('Go away');
        });
        await user.click(screen.getByRole('button', { name: 'Dismiss' }));
        expect(screen.queryByText('Go away')).toBeNull();
    });

    it('runs the action, then closes, and never times out before', async () => {
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        const retry = vi.fn();
        render(<Toaster />);
        act(() => {
            toast.error('Failed', {
                action: { label: 'Retry', onClick: retry },
            });
        });
        advance(TOAST_ERROR_DURATION_MS * 3);
        expect(screen.getByText('Failed')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Retry' }));
        expect(retry).toHaveBeenCalledOnce();
        expect(screen.queryByText('Failed')).toBeNull();
    });

    it('lets a caller choose the duration, or none', () => {
        render(<Toaster />);
        act(() => {
            toast('Quick', { duration: 100 });
            toast('Sticky', { duration: null });
        });
        advance(TOAST_ERROR_DURATION_MS * 3);
        expect(screen.queryByText('Quick')).toBeNull();
        expect(screen.getByText('Sticky')).toBeInTheDocument();
    });
});
