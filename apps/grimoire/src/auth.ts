import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import { isAllowedGithubUser } from '@/lib/access';
import { BASE_PATH, withBasePath } from '@/lib/basePath';
import { getSql } from '@/lib/db';
import { upsertUser } from '@/lib/users';

/**
 * Single-user GitHub sign-in.
 *
 * - `signIn` rejects every account except the one in ALLOWED_GITHUB_ID.
 * - `jwt` maps that account to an internal user id once, at sign-in. All data
 *   is keyed to the internal id, so other sign-in methods can be added later.
 *
 * Reads AUTH_SECRET, AUTH_GITHUB_ID and AUTH_GITHUB_SECRET from the environment.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [GitHub],
    // Matches the route at app/api/auth when the app is mounted under a base path.
    basePath: `${BASE_PATH}/api/auth`,
    session: { strategy: 'jwt' },
    pages: {
        signIn: withBasePath('/signin'),
        error: withBasePath('/signin'),
    },
    callbacks: {
        signIn({ account, profile }) {
            return (
                account?.provider === 'github' &&
                isAllowedGithubUser(profile?.id, process.env.ALLOWED_GITHUB_ID)
            );
        },
        async jwt({ token, account, profile }) {
            if (account?.provider === 'github' && profile) {
                token.userId = await upsertUser(
                    getSql(),
                    Number(profile.id),
                    String(profile.login ?? '')
                );
            }
            return token;
        },
        session({ session, token }) {
            if (typeof token.userId === 'string') {
                session.user.id = token.userId;
            }
            return session;
        },
    },
});
