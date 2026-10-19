'use client';

import { LogOut } from '@scheigs/sylva-ui';
import { clearQueueForUser } from '@/lib/scanQueueStore';

/**
 * The sign-out button. The queue lives in this browser, so it is wiped here
 * first; then the server action ends the session.
 */
export default function SignOutForm({
    userId,
    signOutAction,
}: {
    userId: string;
    signOutAction: () => Promise<void>;
}) {
    return (
        <form
            action={async () => {
                try {
                    await clearQueueForUser(userId);
                } catch {
                    // A queue that will not clear must not block signing out.
                }
                await signOutAction();
            }}
        >
            <button
                type="submit"
                aria-label="Sign out"
                title="Sign out"
                className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-md transition-colors hover:bg-surface-hover"
            >
                <LogOut aria-hidden="true" className="h-5 w-5" />
            </button>
        </form>
    );
}
