import type { Metadata } from 'next';
import { preconnect } from 'react-dom';
import { Inter } from 'next/font/google';
import '../styles/globals.css';
import AppHeader from '@/components/AppHeader';
import Providers from '@/components/Providers';
import PwaSetup from '@/components/PwaSetup';
import { SCRYFALL_IMAGE_ORIGIN } from '@/lib/cardImages';

const inter = Inter({
    subsets: ['latin'],
});

export const metadata: Metadata = {
    title: 'Grimoire',
    description: 'Your Magic: The Gathering collection, always with you.',
    // Private app: keep it out of search results, standalone or mounted.
    robots: { index: false, follow: false },
    // iPhone home screen: Safari ignores the manifest icons, so name them here.
    icons: { apple: '/icons/apple-touch-icon.png' },
    appleWebApp: { capable: true, title: 'Grimoire' },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    // Card images load from Scryfall's CDN; open the connection early.
    preconnect(SCRYFALL_IMAGE_ORIGIN);
    return (
        <html lang="en">
            <body
                className={`${inter.className} antialiased min-h-screen flex flex-col`}
            >
                <a
                    href="#main-content"
                    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-foreground text-background px-4 py-2 rounded-control z-50"
                >
                    Skip to main content
                </a>
                <AppHeader />
                <main id="main-content" className="flex-1">
                    <Providers>
                        <PwaSetup />
                        {children}
                    </Providers>
                </main>
            </body>
        </html>
    );
}
