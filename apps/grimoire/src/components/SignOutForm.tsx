'use client';

import { navActionClasses } from '@scheigs/sylva-ui';
import { clearQueueForUser } from '@/lib/scanQueueStore';

/**
 * The sign-out button, styled like the header links: a menu entry on mobile,
 * a link in the header from md up. The queue lives in this browser, so it is
 * wiped here first; then the server action ends the session.
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
            <button type="submit" className={navActionClasses}>
                Sign out
            </button>
        </form>
    );
}
