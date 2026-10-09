export interface HubApp {
    name: string;
    description: string;
    href: string;
}

// Add an app here and it shows up in the header nav and on the home page.
// Grimoire points at its standalone deployment until it is mounted at
// /grimoire (see #33).
export const apps: HubApp[] = [
    {
        name: 'Grimoire',
        description: 'A private Magic: The Gathering collection tracker.',
        href: process.env.NEXT_PUBLIC_GRIMOIRE_URL ?? '/grimoire',
    },
];
