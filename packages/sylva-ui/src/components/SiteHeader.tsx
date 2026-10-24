'use client';

import { useState, type ReactNode } from 'react';
import { SITE_HOME_HREF, type HeaderApp, type NavItem } from '../navItems';
import AnimatedNav from './AnimatedNav';
import GnomeIcon from './GnomeIcon';
import NavAnchor from './NavAnchor';

export type SiteHeaderProps = {
    /** The app the user is in. Leave it off on the site itself. */
    app?: HeaderApp;
    /** The app's own navigation. The header does not infer it from the URL. */
    nav: NavItem[];
    /** Extra controls after the links, such as sign-out. Shown in the mobile menu too. */
    actions?: ReactNode;
};

/**
 * The header both apps share. Left, the constant global layer: the gnome, which
 * always goes to the site root, then the current app's name. Right, the
 * contextual layer: the current app's navigation.
 */
export default function SiteHeader({ app, nav, actions }: SiteHeaderProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const hasMenu = nav.length > 0 || Boolean(actions);

    return (
        <header className="sticky top-0 z-50 bg-surface">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    <div className="flex items-center gap-3">
                        {/* Always a plain anchor: the site root is another origin from inside an app. */}
                        <a
                            title="(It's pronounced Shy-gert)"
                            aria-label="Scheigstopia - Home"
                            href={SITE_HOME_HREF}
                            className="flex items-center"
                        >
                            <GnomeIcon size={26} className="flex-shrink-0" />
                        </a>
                        {app ? (
                            <NavAnchor
                                sameApp
                                href={app.href}
                                className="text-subheading"
                            >
                                {app.name}
                            </NavAnchor>
                        ) : null}
                    </div>

                    {/* Desktop navigation */}
                    <nav
                        aria-label="Main"
                        className="hidden items-center gap-1 md:flex"
                    >
                        <AnimatedNav items={nav} />
                        {actions}
                    </nav>

                    {/* Mobile menu button */}
                    {hasMenu ? (
                        <div className="md:hidden">
                            <button
                                type="button"
                                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md p-2 text-muted hover:bg-surface-hover hover:text-foreground focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
                                aria-controls="mobile-menu"
                                aria-expanded={isMenuOpen}
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                            >
                                <span className="sr-only">Open main menu</span>
                                <svg
                                    className="block h-6 w-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth="1.5"
                                    stroke="currentColor"
                                    aria-hidden="true"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d={
                                            isMenuOpen
                                                ? 'M6 18L18 6M6 6l12 12'
                                                : 'M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5'
                                        }
                                    />
                                </svg>
                            </button>
                        </div>
                    ) : null}
                </div>

                {/* Mobile menu. `inert` while closed keeps its links out of the tab order. */}
                {hasMenu ? (
                    <nav
                        aria-label="Mobile"
                        id="mobile-menu"
                        inert={!isMenuOpen}
                        className={`absolute left-0 right-0 top-16 z-50 bg-surface shadow-lg transition-all duration-400 ease-in-out md:hidden ${
                            isMenuOpen
                                ? 'scale-y-100 opacity-100'
                                : 'scale-y-0 opacity-90'
                        }`}
                        style={{ transformOrigin: 'top' }}
                    >
                        <ul className="space-y-1 px-2 pb-3 pt-2">
                            {nav.map((item, index) => (
                                <li key={item.name}>
                                    <NavAnchor
                                        href={item.href}
                                        sameApp={item.sameApp}
                                        aria-current={
                                            item.current ? 'page' : undefined
                                        }
                                        className={`hover:text-foreground block px-3 py-2 transition-all duration-500 ${
                                            isMenuOpen
                                                ? 'translate-y-0 opacity-100'
                                                : '-translate-y-6 opacity-0'
                                        }`}
                                        style={{
                                            transitionDelay: isMenuOpen
                                                ? `${index * 50}ms`
                                                : `${(nav.length - 1 - index) * 50}ms`,
                                        }}
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        {item.name}
                                    </NavAnchor>
                                </li>
                            ))}
                            {actions ? (
                                <li className="px-3">{actions}</li>
                            ) : null}
                        </ul>
                    </nav>
                ) : null}
            </div>
        </header>
    );
}
