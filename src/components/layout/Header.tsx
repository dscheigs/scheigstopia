'use client';

import Link from 'next/link';
import { useState } from 'react';
import GnomeIcon from '@/components/icons/GnomeIcon';

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const navigation = [
        { name: 'About', href: '/about' },
        { name: 'Skills', href: '/skills' },
    ];

    return (
        <header className="relative bg-surface border-b border-border">
            <nav
                className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
                aria-label="Global"
            >
                <div className="flex h-16 items-center justify-between">
                    <div className="flex items-center">
                        <Link
                            href="/"
                            className="flex items-center gap-3 text-section-title text-foreground"
                        >
                            <GnomeIcon size={32} className="flex-shrink-0" />
                            <div>
                                <span className="font-bold">Scheigs</span>
                                <span className="font-extralight">topia</span>
                            </div>
                        </Link>
                    </div>

                    {/* Desktop navigation */}
                    <div className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-4">
                            {navigation.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className="text-body font-medium px-4 py-2 rounded-full hover:bg-surface-hover transition-colors"
                                >
                                    {item.name}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <button
                            type="button"
                            className="inline-flex items-center justify-center rounded-md p-2 text-muted hover:bg-surface-hover hover:text-foreground focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
                            aria-controls="mobile-menu"
                            aria-expanded={isMenuOpen}
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            <span className="sr-only">Open main menu</span>
                            {!isMenuOpen ? (
                                <svg
                                    className="block h-6 w-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth="1.5"
                                    stroke="currentColor"
                                    aria-hidden="true"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                                    />
                                </svg>
                            ) : (
                                <svg
                                    className="block h-6 w-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth="1.5"
                                    stroke="currentColor"
                                    aria-hidden="true"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile menu */}
                <div
                    className={`absolute top-16 left-0 right-0 z-50 bg-surface border-b border-border shadow-lg md:hidden transition-all duration-400 ease-in-out ${
                        isMenuOpen
                            ? 'scale-y-100 opacity-100'
                            : 'scale-y-0 opacity-90'
                    }`}
                    style={{
                        transformOrigin: 'top',
                    }}
                    id="mobile-menu"
                >
                    <div className="space-y-1 px-2 pb-3 pt-2">
                        {navigation.map((item, index) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`hover:text-foreground block px-3 py-2  transition-all duration-500 ${
                                    isMenuOpen
                                        ? 'opacity-100 translate-y-0'
                                        : 'opacity-0 -translate-y-6'
                                }`}
                                style={{
                                    transitionDelay: isMenuOpen
                                        ? `${index * 50}ms`
                                        : `${(navigation.length - 1 - index) * 50}ms`,
                                }}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                {item.name}
                            </Link>
                        ))}
                    </div>
                </div>
            </nav>
        </header>
    );
}
