'use client';

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
                className="min-h-11 rounded-md px-3 text-body font-medium transition-colors hover:bg-surface-hover"
            >
                Sign out
            </button>
        </form>
    );
}
