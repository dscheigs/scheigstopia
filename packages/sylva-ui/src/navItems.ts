export type NavItem = {
    name: string;
    href: string;
    /** Marks the item for the page the user is on (`aria-current="page"`). */
    current?: boolean;
    /**
     * The link stays inside the current app, so a client-side <Link> is safe
     * and `href` is relative to the app (Next adds the base path).
     *
     * Leave it off for anything that may leave the app, such as another app
     * mounted under the site (multi-zones). Those render as plain <a> anchors,
     * because a client-side navigation would wait on a page payload from the
     * wrong build and hang. A plain anchor does not get the base path from
     * Next, so `href` must be the real URL.
     */
    sameApp?: boolean;
};

export type LinkKind = 'link' | 'anchor';

/** How a nav item must be rendered. Plain anchors are the safe default. */
export function linkKind(item: Pick<NavItem, 'sameApp'>): LinkKind {
    return item.sameApp ? 'link' : 'anchor';
}

/** The current app's name and home, shown after the gnome as a breadcrumb. */
export type HeaderApp = {
    name: string;
    /** Relative to the app, like a `sameApp` nav item. */
    href: string;
};

/** The constant global layer: always the site root, always a plain anchor. */
export const SITE_HOME_HREF = '/';
