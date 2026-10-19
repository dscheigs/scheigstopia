'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { SiteHeader } from '@scheigs/sylva-ui';
import { ADD_PATH, COLLECTION_PATH, isAddRoute } from '@/lib/addRoutes';

/**
 * The shared header with Grimoire's navigation. It is a client component only
 * to read the pathname for the active link; the session and sign-out come in
 * from AppHeader. Hrefs are relative to the app: Next adds the base path.
 */
export default function GrimoireHeader({
    signedIn,
    signOut,
}: {
    signedIn: boolean;
    signOut: ReactNode;
}) {
    const pathname = usePathname();
    return (
        <SiteHeader
            app={{ name: 'Grimoire', href: COLLECTION_PATH }}
            nav={
                signedIn
                    ? [
                          {
                              name: 'Collection',
                              href: COLLECTION_PATH,
                              current: pathname === COLLECTION_PATH,
                              sameApp: true,
                          },
                          {
                              name: 'Scan Cards',
                              href: ADD_PATH,
                              current: isAddRoute(pathname),
                              sameApp: true,
                          },
                      ]
                    : []
            }
            actions={signedIn ? signOut : undefined}
        />
    );
}
