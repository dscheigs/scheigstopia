'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ADD_PATH, COLLECTION_PATH, isAddRoute } from '@/lib/addRoutes';

const linkClasses =
    'inline-flex min-h-11 items-center rounded-md px-3 text-body font-medium transition-colors hover:bg-surface-hover';

/** Header navigation between the collection and Add Cards. */
export default function NavLinks() {
    const pathname = usePathname();
    return (
        <nav aria-label="Main" className="flex items-center gap-1">
            <Link
                href={COLLECTION_PATH}
                aria-current={pathname === COLLECTION_PATH ? 'page' : undefined}
                className={linkClasses}
            >
                Collection
            </Link>
            <Link
                href={ADD_PATH}
                aria-current={isAddRoute(pathname) ? 'page' : undefined}
                className={linkClasses}
            >
                Add Cards
            </Link>
        </nav>
    );
}
