import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../styles/globals.css';
import Header from '@/components/layout/Header';
import { createPageMetadata } from '@/utils/metadata';

const inter = Inter({
    subsets: ['latin'],
});

export const metadata: Metadata = createPageMetadata({
    title: 'Daniel Scheigert',
    description:
        'A place to share my projects, thoughts, and experiences as a software engineer.',
});

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
                <Header />
                <main id="main-content" className="flex-1">
                    {children}
                </main>
            </body>
        </html>
    );
}
