// Grimoire is its own deployment on its own subdomain. The site links to it
// and sends the old `/grimoire` path there. Both are driven by GRIMOIRE_URL
// (the deployment's origin, e.g. `https://grimoire.scheigs.com`); unset, as in
// a plain `nx dev scheigstopia`, there is no link and no redirect.

export type Redirect = {
    source: string;
    destination: string;
    permanent: false;
};

/** The origin with no trailing slash, or undefined when it is unset or blank. */
export function grimoireOrigin(
    env: Record<string, string | undefined>
): string | undefined {
    const origin = env.GRIMOIRE_URL?.trim().replace(/\/+$/, '');
    return origin || undefined;
}

/**
 * Sends `/grimoire` and everything under it to the same path on Grimoire's own
 * origin, so old links and an installed app's bookmarks keep working. Temporary
 * (307) so browsers do not cache it if the subdomain ever changes.
 */
export function grimoireRedirects(
    env: Record<string, string | undefined>
): Redirect[] {
    const origin = grimoireOrigin(env);
    if (!origin) return [];
    return [
        {
            source: '/grimoire/:path*',
            destination: `${origin}/:path*`,
            permanent: false,
        },
    ];
}
