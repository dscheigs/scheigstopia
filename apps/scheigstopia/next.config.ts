import type { NextConfig } from 'next';
import path from 'path';
import { grimoireRedirects } from './src/grimoire';

const nextConfig: NextConfig = {
    // sylva-ui ships as source, so Next compiles it.
    transpilePackages: ['@scheigs/sylva-ui'],
    // Trace workspace-root dependencies correctly from inside the monorepo.
    outputFileTracingRoot: path.join(__dirname, '../../'),
    // The old /grimoire path now lives on Grimoire's own origin (see src/grimoire.ts).
    async redirects() {
        return grimoireRedirects(process.env);
    },
};

export default nextConfig;
