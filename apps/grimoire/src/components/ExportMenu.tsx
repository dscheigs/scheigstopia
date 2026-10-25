'use client';

import { useEffect, useRef, useState } from 'react';
import ExportLink from '@/components/ExportLink';
import { buttonClasses } from '@scheigs/sylva-ui';

const FORMATS = [
    {
        label: 'Text list (.txt)',
        href: '/api/export',
        filename: 'grimoire-collection.txt',
        type: 'text/plain',
    },
    {
        label: 'Spreadsheet (.csv)',
        href: '/api/export?format=csv',
        filename: 'grimoire-collection.csv',
        type: 'text/csv',
    },
];

/** One Export button that offers each format in a small menu. */
export default function ExportMenu() {
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const onPointerDown = (event: PointerEvent) => {
            if (!rootRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOpen(false);
        };
        document.addEventListener('pointerdown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('pointerdown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open]);

    return (
        <div ref={rootRef} className="relative">
            <button
                type="button"
                aria-expanded={open}
                aria-controls="export-menu"
                onClick={() => setOpen((value) => !value)}
                className={buttonClasses}
            >
                Export
            </button>
            {open && (
                <div
                    id="export-menu"
                    className="absolute right-0 z-10 mt-2 w-56 overflow-hidden rounded-lg border border-border-minimal bg-surface-minimal"
                >
                    <ul className="divide-y divide-border-minimal">
                        {FORMATS.map((format) => (
                            <li key={format.href}>
                                <ExportLink
                                    {...format}
                                    className="flex min-h-11 items-center px-4 py-2 text-body transition-colors hover:bg-surface-minimal-hover"
                                    onClick={() => setOpen(false)}
                                >
                                    {format.label}
                                </ExportLink>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
