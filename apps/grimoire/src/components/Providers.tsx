'use client';

import {
    MutationCache,
    QueryCache,
    QueryClient,
    QueryClientProvider,
} from '@tanstack/react-query';
import { Toaster, toast } from '@scheigs/sylva-ui';
import { useState } from 'react';
import { ApiError, isUnauthorized } from '@/lib/apiClient';
import { SIGN_IN_PATH } from '@/lib/sessionNotice';

/** A lapsed session on any request sends you back to sign in. */
function redirectIfSignedOut(error: unknown) {
    if (!isUnauthorized(error)) return;
    // A hard navigation on purpose: it drops the query cache, and this runs in
    // the QueryClient, outside React, where useRouter is not available.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = SIGN_IN_PATH;
}

/**
 * Every failed mutation is reported once, here, so no component has to wire
 * it up. A 401 is not: it already redirects. A mutation that shows its error
 * in place opts out with `meta: { toast: false }`.
 */
function reportMutationError(
    error: unknown,
    _variables: unknown,
    _result: unknown,
    mutation: { meta?: Record<string, unknown> }
) {
    redirectIfSignedOut(error);
    if (isUnauthorized(error) || mutation.meta?.toast === false) return;
    toast.error(
        error instanceof Error && error.message
            ? error.message
            : 'Something went wrong.'
    );
}

function makeQueryClient() {
    return new QueryClient({
        queryCache: new QueryCache({ onError: redirectIfSignedOut }),
        mutationCache: new MutationCache({ onError: reportMutationError }),
        defaultOptions: {
            queries: {
                // One retry for flaky networks and 5xx; a 4xx will not change.
                retry: (failures, error) =>
                    failures < 1 &&
                    !(error instanceof ApiError && error.status < 500),
            },
        },
    });
}

export default function Providers({ children }: { children: React.ReactNode }) {
    // useState, not a module constant, so the cache is never shared between
    // requests on the server.
    const [queryClient] = useState(makeQueryClient);
    return (
        <QueryClientProvider client={queryClient}>
            {children}
            <Toaster />
        </QueryClientProvider>
    );
}
