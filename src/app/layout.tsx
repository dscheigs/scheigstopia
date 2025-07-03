import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import '../styles/globals.css';
import Header from '@/components/layout/Header';

const inter = Inter({
    variable: '--font-inter',
    subsets: ['latin'],
});

const jetbrainsMono = JetBrains_Mono({
    variable: '--font-jetbrains-mono',
    subsets: ['latin'],
});

export const metadata: Metadata = {
    title: 'Daniel Scheigert',
    description:
        'A place to share my projects, thoughts, and experiences as a software engineer.',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body
                className={`${inter.variable} ${jetbrainsMono.variable} antialiased min-h-screen flex flex-col`}
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
