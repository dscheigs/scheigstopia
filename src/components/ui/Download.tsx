'use client';

import Button from './Button';

interface DownloadProps {
    title?: string;
    content: string;
    filename: string;
    mimeType?: string;
    className?: string;
}

export default function Download({
    title,
    content,
    filename,
    mimeType = 'text/plain',
    className = '',
}: DownloadProps) {
    const handleDownload = async () => {
        let downloadUrl: string;
        let shouldRevoke = false;

        // Check if content is a URL (starts with http/https or is a path)
        if (content.startsWith('http') || content.startsWith('/')) {
            // It's a URL, use it directly
            downloadUrl = content;
        } else {
            // It's content data, create a blob
            const blob = new Blob([content], { type: mimeType });
            downloadUrl = URL.createObjectURL(blob);
            shouldRevoke = true;
        }

        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Only revoke if we created the URL
        if (shouldRevoke) {
            URL.revokeObjectURL(downloadUrl);
        }
    };

    return (
        <Button
            onClick={handleDownload}
            variant="accent"
            className={`inline-flex items-center ${title ? 'gap-2' : ''} ${className}`}
        >
            {title && <span>{title}</span>}
            <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
            </svg>
        </Button>
    );
}
