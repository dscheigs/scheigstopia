'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { SiteHeader } from '@scheigs/sylva-ui';
import { siteOrigin } from '@/lib/siteUrl';
import {
    ADD_PATH,
    ATTENTION_PATH,
    COLLECTION_PATH,
    isAddRoute,
} from '@/lib/addRoutes';
import { LOCATIONS_PATH, isLocationsRoute } from '@/lib/locationsPage';

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
    // Literal property access so Next inlines the value into the client bundle.
    const homeHref = siteOrigin({
        NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    });
    return (
        <SiteHeader
            homeHref={homeHref}
            gnome="grimoire"
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
                          {
                              name: 'Locations',
                              href: LOCATIONS_PATH,
                              current: isLocationsRoute(pathname),
                              sameApp: true,
                          },
                          {
                              name: 'Needs Attention',
                              href: ATTENTION_PATH,
                              current: pathname === ATTENTION_PATH,
                              sameApp: true,
                          },
                      ]
                    : []
            }
            actions={signedIn ? signOut : undefined}
        />
    );
}
