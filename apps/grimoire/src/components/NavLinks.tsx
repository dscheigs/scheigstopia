'use client';

import { usePathname } from 'next/navigation';
import { AnimatedNav } from '@scheigs/sylva-ui';
import { ADD_PATH, COLLECTION_PATH, isAddRoute } from '@/lib/addRoutes';

/** Header navigation between the collection and the scan screen. */
export default function NavLinks() {
    const pathname = usePathname();
    return (
        <nav aria-label="Main">
            <AnimatedNav
                items={[
                    {
                        name: 'Collection',
                        href: COLLECTION_PATH,
                        current: pathname === COLLECTION_PATH,
                    },
                    {
                        name: 'Scan Cards',
                        href: ADD_PATH,
                        current: isAddRoute(pathname),
                    },
                ]}
            />
        </nav>
    );
}
