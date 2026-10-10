import type { Metadata } from 'next';
import { ViewTransition } from 'react';
import { Inter } from 'next/font/google';
import '../styles/globals.css';
import AppHeader from '@/components/AppHeader';
import Providers from '@/components/Providers';

const inter = Inter({
    subsets: ['latin'],
});

export const metadata: Metadata = {
    title: 'Grimoire',
    description: 'Your Magic: The Gathering collection, always with you.',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body
                className={`${inter.className} antialiased min-h-screen flex flex-col`}
            >
                <a
                    href="#main-content"
                    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-foreground text-background px-4 py-2 rounded-md z-50"
                >
                    Skip to main content
                </a>
                <AppHeader />
                <main id="main-content" className="flex-1">
                    <Providers>
                        <ViewTransition default="page-fade">
                            {children}
                        </ViewTransition>
                    </Providers>
                </main>
            </body>
        </html>
    );
}
