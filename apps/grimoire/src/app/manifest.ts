import type { MetadataRoute } from 'next';
import sylvaPrimitives from '@scheigs/sylva/tokens/primitives';
import { BASE_PATH, withBasePath } from '@/lib/basePath';

// The splash and browser chrome use Sylva's canvas color, read from the token
// file so there is no color literal here.
const canvas = sylvaPrimitives.color.base['canvas-light'].$value;

// Where the app starts and what it covers: the base path itself, or `/`
// standalone. Next serves the home page there and redirects `/grimoire/` to it,
// so a start URL with a slash would begin with a redirect the offline shell
// cannot save, and `/grimoire` itself would sit outside a `/grimoire/` scope.
const ROOT = BASE_PATH || '/';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Grimoire',
        short_name: 'Grimoire',
        description: 'Your Magic: The Gathering collection, always with you.',
        // Mounted under the site the app lives at /grimoire; standalone, at /.
        id: ROOT,
        start_url: ROOT,
        scope: ROOT,
        display: 'standalone',
        background_color: canvas,
        theme_color: canvas,
        icons: [
            {
                src: withBasePath('/icons/icon-192.png'),
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: withBasePath('/icons/icon-512.png'),
                sizes: '512x512',
                type: 'image/png',
            },
            {
                src: withBasePath('/icons/icon-maskable-512.png'),
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable',
            },
        ],
    };
}
