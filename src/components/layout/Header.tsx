'use client';

import Link from 'next/link';
import { useState } from 'react';
import HomeLink from '@/components/ui/HomeLink';

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const navigation = [
        { name: 'About', href: '/about' },
        { name: 'Projects', href: '/projects' },
    ];

    return (
        <>
            {/* Fun little bit of css I stole from 
        https://developer.chrome.com/blog/new-in-web-ui-io-2024#anchor_positioning
        */}
            <style>{`
                .nav-links::before {
                    content: '';
                    position: absolute;
                    left:   anchor(var(--target) left);
                    right:  anchor(var(--target) right);
                    bottom: anchor(var(--target) bottom);
                    transition: all 0.3s;
                    border-bottom: 0.2rem solid var(--foreground);
                    pointer-events: none;
                }

                .nav-links:not(:has(a:hover, a:focus-visible))::before {
                    visibility: hidden;
                    opacity: 0;
                    transition: all 0.3s;
                }
                .nav-link a {
                    anchor-name: var(--anchor);
                    font-size: 1rem;
                    font-weight: 500;
                    padding: 1rem;
                    text-decoration: none;
                }
                .nav-link:nth-child(1) { 
                    --anchor: --item-1; 
                }
                .nav-links:has(.nav-link:nth-child(1) a:is(:hover, :focus-visible)) {
                    --target: --item-1;
                }
                .nav-link:nth-child(2) { 
                    --anchor: --item-2; 
                }
                .nav-links:has(.nav-link:nth-child(2) a:is(:hover, :focus-visible)) {
                    --target: --item-2; 
                }
                .nav-link a:focus-visible {
                    outline: none;
                }
                .nav-links {
                    display: flex;
                    justify-content: end;
                    position: relative;
                }
                    
            `}</style>
            <header className="sticky top-0 z-50 bg-surface">
                <nav
                    className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
                    aria-label="Global"
                >
                    <div className="flex h-16 items-center justify-between">
                        <div className="flex items-center">
                            <HomeLink />
                        </div>

                        {/* Desktop navigation */}
                        <div className="hidden md:block">
                            <ul className="nav-links flex items-baseline">
                                {navigation.map((item) => (
                                    <li key={item.name} className="nav-link">
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            className="text-body font-medium transition-colors"
                                        >
                                            {item.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
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
                        className={`absolute top-16 left-0 right-0 z-50 bg-surface shadow-lg md:hidden transition-all duration-400 ease-in-out ${
                            isMenuOpen
                                ? 'scale-y-100 opacity-100'
                                : 'scale-y-0 opacity-90'
                        }`}
                        style={{
                            transformOrigin: 'top',
                        }}
                        id="mobile-menu"
                    >
                        <ul className="space-y-1 px-2 pb-3 pt-2">
                            {navigation.map((item, index) => (
                                <li key={item.name}>
                                    <Link
                                        href={item.href}
                                        className={`hover:text-foreground block px-3 py-2 transition-all duration-500 ${
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
                                </li>
                            ))}
                        </ul>
                    </div>
                </nav>
            </header>
        </>
    );
}
