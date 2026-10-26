// The main site is another origin from Grimoire, so the header gnome needs its
// absolute address. NEXT_PUBLIC_SITE_URL is the site's origin (e.g.
// `https://scheigs.com`); unset, the gnome keeps linking to `/`.

/** The origin with no trailing slash, or undefined when it is unset or blank. */
export function siteOrigin(
    env: Record<string, string | undefined>
): string | undefined {
    const origin = env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, '');
    return origin || undefined;
}
