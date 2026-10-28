import type { GnomeVariant } from '@scheigs/sylva-ui';
import { grimoireOrigin } from '@/grimoire';

export interface HubApp {
    name: string;
    description: string;
    href: string;
    /** The app's gnome, shown on its home page card. Omit for a text-only card. */
    gnome?: GnomeVariant;
}

const grimoireUrl = grimoireOrigin(process.env);

// Add an app here and it shows up in the header nav and on the home page.
// Each app is its own deployment on its own origin, so `href` is a full URL.
// Grimoire is left out when GRIMOIRE_URL is not set.
export const apps: HubApp[] = [
    ...(grimoireUrl
        ? [
              {
                  name: 'Grimoire',
                  description: 'A private card collection tracker.',
                  href: grimoireUrl,
                  gnome: 'grimoire' as const,
              },
          ]
        : []),
];
