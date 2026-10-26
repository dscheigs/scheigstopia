import type { NextConfig } from 'next';
import path from 'path';
import { grimoireRedirects } from './src/grimoire';

const nextConfig: NextConfig = {
    // sylva-ui ships as source, so Next compiles it.
    transpilePackages: ['@scheigs/sylva-ui'],
    experimental: {
        // Keeps the sylva-ui barrel (src/index.ts) cheap to compile as it grows:
        // named imports are resolved to the module that defines them.
        // lucide-react, re-exported through the barrel's icons, is already on
        // Next's default list, so it is not repeated here.
        optimizePackageImports: ['@scheigs/sylva-ui'],
    },
    // Trace workspace-root dependencies correctly from inside the monorepo.
    outputFileTracingRoot: path.join(__dirname, '../../'),
    // The old /grimoire path now lives on Grimoire's own origin (see src/grimoire.ts).
    async redirects() {
        return grimoireRedirects(process.env);
    },
};

export default nextConfig;
