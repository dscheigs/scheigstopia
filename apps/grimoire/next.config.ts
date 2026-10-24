import type { NextConfig } from 'next';
import path from 'path';
import { normalizeBasePath } from './src/lib/basePath';

// Empty when standalone, `/grimoire` when mounted under the main site. Next puts
// pages and `/_next` assets under it, so the site can proxy the whole path.
const basePath = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH);

const nextConfig: NextConfig = {
    basePath,
    async headers() {
        return [
            {
                // Next adds the base path to this source. The app's home is
                // `/grimoire`, which is outside the `/grimoire/` folder the
                // worker file sits in, so the worker needs this to control it.
                source: '/sw.js',
                headers: [
                    {
                        key: 'Service-Worker-Allowed',
                        value: basePath || '/',
                    },
                ],
            },
        ];
    },
    // sylva-ui ships as source, so Next compiles it.
    transpilePackages: ['@scheigs/sylva-ui'],
    // Trace workspace-root dependencies correctly from inside the monorepo.
    outputFileTracingRoot: path.join(__dirname, '../../'),
    turbopack: {
        // OpenCV.js (loaded lazily for the card rectangle check) mentions these
        // Node built-ins on a code path that only runs under Node.
        resolveAlias: {
            fs: { browser: './src/lib/emptyModule.ts' },
            path: { browser: './src/lib/emptyModule.ts' },
            crypto: { browser: './src/lib/emptyModule.ts' },
        },
    },
};

export default nextConfig;
