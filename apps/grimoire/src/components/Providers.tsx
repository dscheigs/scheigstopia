'use client';

import {
    MutationCache,
    QueryCache,
    QueryClient,
    QueryClientProvider,
} from '@tanstack/react-query';
import { useState } from 'react';
import { ApiError, isUnauthorized } from '@/lib/api-client';

/** A lapsed session on any request sends you back to sign in. */
function redirectIfSignedOut(error: unknown) {
    if (isUnauthorized(error)) window.location.href = '/signin';
}

function makeQueryClient() {
    return new QueryClient({
        queryCache: new QueryCache({ onError: redirectIfSignedOut }),
        mutationCache: new MutationCache({ onError: redirectIfSignedOut }),
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
        </QueryClientProvider>
    );
}
