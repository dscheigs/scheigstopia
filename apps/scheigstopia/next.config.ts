import type { NextConfig } from 'next';
import path from 'path';
import { zoneRewrites } from './src/zones';

const nextConfig: NextConfig = {
    // sylva-ui ships as source, so Next compiles it.
    transpilePackages: ['@scheigs/sylva-ui'],
    // Trace workspace-root dependencies correctly from inside the monorepo.
    outputFileTracingRoot: path.join(__dirname, '../../'),
    // Apps mounted under this site (see src/zones.ts).
    async rewrites() {
        return zoneRewrites(process.env);
    },
};

export default nextConfig;
