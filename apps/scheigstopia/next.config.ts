import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
    // Trace workspace-root dependencies correctly from inside the monorepo.
    outputFileTracingRoot: path.join(__dirname, '../../'),
    // Animate client-side page navigations with the View Transitions API.
    experimental: {
        viewTransition: true,
    },
};

export default nextConfig;
