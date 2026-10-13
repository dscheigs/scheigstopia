// Grimoire runs standalone (its own URL) and mounted under the main site at
// `/grimoire` (Next.js multi-zones). NEXT_PUBLIC_BASE_PATH is empty for the
// first and `/grimoire` for the second, and is read at build time.
//
// Next adds the base path itself to <Link>, router calls and redirect(). It
// does not add it to fetch(), plain <a href>, window.location or Auth.js
// redirect targets; those go through `withBasePath`.

/** Normalised so it is either empty or starts with `/` and has no trailing `/`. */
export function normalizeBasePath(value: string | undefined): string {
    const trimmed = (value ?? '').trim().replace(/^\/+|\/+$/g, '');
    return trimmed ? `/${trimmed}` : '';
}

export const BASE_PATH = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH);

/** `path` (starting with `/`) under `basePath`. Other URLs pass through. */
export function withBasePath(path: string, basePath = BASE_PATH): string {
    if (!basePath || !path.startsWith('/') || path.startsWith('//')) {
        return path;
    }
    return `${basePath}${path}`;
}
