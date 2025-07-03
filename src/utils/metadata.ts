import type { Metadata } from 'next';

interface PageMetadata {
    title: string;
    description: string;
}

export function createPageMetadata({
    title,
    description,
}: PageMetadata): Metadata {
    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images: ['/opengraph-image.png'],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: ['/twitter-image.png'],
        },
    };
}
