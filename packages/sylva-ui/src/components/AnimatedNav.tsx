import type { NavItem } from '../navItems';
import NavAnchor from './NavAnchor';

const linkClasses = 'block px-4 py-4 text-body font-medium transition-colors';

/** One anchor per item for the sliding underline (see styles/nav.css). */
function anchorCss(count: number) {
    return Array.from({ length: count }, (_, i) => i + 1)
        .map(
            (n) => `
                .nav-link:nth-child(${n}) {
                    --anchor: --item-${n};
                }
                .nav-links:has(.nav-link:nth-child(${n}) a:is(:hover, :focus-visible)) {
                    --target: --item-${n};
                }`
        )
        .join('');
}

/** A row of header links with a sliding underline. Wrap it in a <nav>. */
export default function AnimatedNav({ items }: { items: NavItem[] }) {
    return (
        <>
            <style>{anchorCss(items.length)}</style>
            <ul className="nav-links items-baseline">
                {items.map((item) => (
                    <li key={item.name} className="nav-link">
                        <NavAnchor
                            href={item.href}
                            sameApp={item.sameApp}
                            className={linkClasses}
                            aria-current={item.current ? 'page' : undefined}
                        >
                            {item.name}
                        </NavAnchor>
                    </li>
                ))}
            </ul>
        </>
    );
}
