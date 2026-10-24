import type { ReactNode } from 'react';
import type { NavItem } from '../navItems';
import { navLinkClasses } from '../primitives';
import NavAnchor from './NavAnchor';

/** One anchor per item for the sliding underline (see styles/nav.css). */
function anchorCss(count: number) {
    return Array.from({ length: count }, (_, i) => i + 1)
        .map(
            (n) => `
                .nav-link:nth-child(${n}) {
                    --anchor: --item-${n};
                }
                .nav-links:has(.nav-link:nth-child(${n}) :is(a, button):is(:hover, :focus-visible)) {
                    --target: --item-${n};
                }`
        )
        .join('');
}

/**
 * A row of header links with a sliding underline. Wrap it in a <nav>. `trailing`
 * is one more entry after the links, such as a sign-out button styled with
 * `navActionClasses`; it gets the underline too.
 */
export default function AnimatedNav({
    items,
    trailing,
}: {
    items: NavItem[];
    trailing?: ReactNode;
}) {
    return (
        <>
            <style>{anchorCss(items.length + (trailing ? 1 : 0))}</style>
            <ul className="nav-links items-baseline">
                {items.map((item) => (
                    <li key={item.name} className="nav-link">
                        <NavAnchor
                            href={item.href}
                            sameApp={item.sameApp}
                            className={navLinkClasses}
                            aria-current={item.current ? 'page' : undefined}
                        >
                            {item.name}
                        </NavAnchor>
                    </li>
                ))}
                {trailing ? <li className="nav-link">{trailing}</li> : null}
            </ul>
        </>
    );
}
