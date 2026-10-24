import type { MetadataRoute } from 'next';
import sylvaPrimitives from '@scheigs/sylva/tokens/primitives';

// The splash and browser chrome use Sylva's canvas color, read from the token
// file so there is no color literal here.
const canvas = sylvaPrimitives.color.base['canvas-light'].$value;

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Grimoire',
        short_name: 'Grimoire',
        description: 'Your Magic: The Gathering collection, always with you.',
        // Mounted under the site the app lives at /grimoire; standalone, at /.
        id: '/',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: canvas,
        theme_color: canvas,
        icons: [
            {
                src: '/icons/icon-192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/icons/icon-512.png',
                sizes: '512x512',
                type: 'image/png',
            },
            {
                src: '/icons/icon-maskable-512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable',
            },
        ],
    };
}
