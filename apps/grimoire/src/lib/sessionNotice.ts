export type SessionNotice = {
    message: string;
    linkLabel: string;
    href: string;
};

export const SIGN_IN_PATH = '/signin';

/**
 * The notice shown on the Add Cards screens while the worker is paused on a
 * 401, or null when the session is fine. Queued scans are kept either way.
 */
export function sessionNotice(expired: boolean): SessionNotice | null {
    if (!expired) return null;
    return {
        message: 'Your session expired. Sign in again to keep scanning.',
        linkLabel: 'Sign in',
        href: SIGN_IN_PATH,
    };
}
