// Apps mounted under this site with Next.js multi-zones. Each one is also its
// own deployment; the site proxies its path to it. To add an app, add one entry
// here, set the env var named in `urlEnv` on the site's Vercel project, and set
// that app's NEXT_PUBLIC_BASE_PATH to `path`.

export type Zone = {
    /** Where the app is mounted on this site, e.g. `/grimoire`. */
    path: string;
    /** Env var holding the app deployment's origin, e.g. `https://grimoire.example.com`. */
    urlEnv: string;
};

export const ZONES: Zone[] = [{ path: '/grimoire', urlEnv: 'GRIMOIRE_URL' }];

export type Rewrite = { source: string; destination: string };

/**
 * Rewrites for every zone whose URL is set. A zone with no URL (local dev, or
 * a preview that should not proxy) is skipped, so the site never rewrites to
 * `undefined`. The app serves its pages and `/_next` assets under its own base
 * path, so the destination keeps the full path.
 */
export function zoneRewrites(
    env: Record<string, string | undefined>,
    zones: Zone[] = ZONES
): Rewrite[] {
    return zones.flatMap(({ path, urlEnv }) => {
        const origin = env[urlEnv]?.trim().replace(/\/+$/, '');
        if (!origin) return [];
        return [
            { source: path, destination: `${origin}${path}` },
            {
                source: `${path}/:path*`,
                destination: `${origin}${path}/:path*`,
            },
        ];
    });
}
