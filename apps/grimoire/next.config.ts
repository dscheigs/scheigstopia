import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
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
