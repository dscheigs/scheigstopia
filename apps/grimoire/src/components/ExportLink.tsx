'use client';

import type { ReactNode } from 'react';
import {
    canShareFile,
    isStandaloneApp,
    shareExportFile,
} from '@/lib/shareExport';

/**
 * A download link for an export. In a browser it is a plain download. In the
 * installed app it opens the share sheet instead, because on iPhone a download
 * there leaves a file preview with no way to close it.
 */
export default function ExportLink({
    href,
    filename,
    type,
    className,
    onClick,
    children,
}: {
    href: string;
    filename: string;
    type: string;
    className: string;
    onClick?: () => void;
    children: ReactNode;
}) {
    return (
        <a
            href={href}
            download={filename}
            className={className}
            onClick={(event) => {
                onClick?.();
                if (
                    !isStandaloneApp(
                        window.matchMedia?.bind(window),
                        navigator
                    ) ||
                    !canShareFile(navigator, type)
                ) {
                    return;
                }
                event.preventDefault();
                void shareExportFile({
                    url: href,
                    filename,
                    type,
                    nav: navigator,
                }).then((result) => {
                    // Nothing was shared: do what the link would have done.
                    if (result === 'failed') window.location.assign(href);
                });
            }}
        >
            {children}
        </a>
    );
}
