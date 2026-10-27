import { useMutation } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { toast } from '@scheigs/sylva-ui';
import Providers from '@/components/Providers';
import { ApiError } from '@/lib/apiClient';

function FailingButton({
    error,
    meta,
}: {
    error: Error;
    meta?: Record<string, unknown>;
}) {
    const mutation = useMutation({
        mutationFn: () => Promise.reject(error),
        meta,
    });
    return <button onClick={() => mutation.mutate()}>Go</button>;
}

afterEach(() => {
    act(() => toast.dismiss());
    vi.restoreAllMocks();
});

describe('Providers error toasts', () => {
    it('reports a failed mutation once, with the error message', async () => {
        render(
            <Providers>
                <FailingButton error={new ApiError('Server is down.', 500)} />
            </Providers>
        );
        await userEvent.click(screen.getByRole('button', { name: 'Go' }));
        expect(await screen.findByRole('alert')).toHaveTextContent(
            'Server is down.'
        );
        await userEvent.click(screen.getByRole('button', { name: 'Go' }));
        await waitFor(() =>
            expect(screen.getAllByRole('alert')).toHaveLength(1)
        );
    });

    it('stays quiet for a mutation that reports in place', async () => {
        render(
            <Providers>
                <FailingButton
                    error={new ApiError('Server is down.', 500)}
                    meta={{ toast: false }}
                />
            </Providers>
        );
        await userEvent.click(screen.getByRole('button', { name: 'Go' }));
        await new Promise((resolve) => setTimeout(resolve, 20));
        expect(screen.queryByRole('alert')).toBeNull();
    });

    it('does not toast a 401, which redirects to sign-in instead', async () => {
        // jsdom cannot navigate and says so on the console.
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
        render(
            <Providers>
                <FailingButton error={new ApiError('Signed out.', 401)} />
            </Providers>
        );
        await userEvent.click(screen.getByRole('button', { name: 'Go' }));
        await new Promise((resolve) => setTimeout(resolve, 20));
        expect(screen.queryByRole('alert')).toBeNull();
    });
});
