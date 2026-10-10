import { describe, expect, it } from 'vitest';
import { sessionNotice } from '@/lib/sessionNotice';

describe('sessionNotice', () => {
    it('shows nothing while signed in', () => {
        expect(sessionNotice(false)).toBeNull();
    });

    it('asks to sign in again and links to /signin once expired', () => {
        expect(sessionNotice(true)).toEqual({
            message: 'Your session expired. Sign in again to keep scanning.',
            linkLabel: 'Sign in',
            href: '/signin',
        });
    });
});
