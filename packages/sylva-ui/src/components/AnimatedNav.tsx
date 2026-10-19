import Link from 'next/link';

export type AnimatedNavItem = {
    name: string;
    href: string;
    /** Marks the item for the page the user is on (`aria-current="page"`). */
    current?: boolean;
    /**
     * Render a plain <a> instead of <Link>. Needed for links into another app
     * mounted under the site (multi-zones): a client-side navigation would wait
     * on a page payload from the wrong build and hang.
     */
    plain?: boolean;
};

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
export default function AnimatedNav({ items }: { items: AnimatedNavItem[] }) {
    return (
        <>
            <style>{anchorCss(items.length)}</style>
            <ul className="nav-links items-baseline">
                {items.map((item) => {
                    const props = {
                        href: item.href,
                        className: linkClasses,
                        'aria-current': item.current
                            ? ('page' as const)
                            : undefined,
                    };
                    return (
                        <li key={item.name} className="nav-link">
                            {item.plain ? (
                                <a {...props}>{item.name}</a>
                            ) : (
                                <Link {...props}>{item.name}</Link>
                            )}
                        </li>
                    );
                })}
            </ul>
        </>
    );
}
