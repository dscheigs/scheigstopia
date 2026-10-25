import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import type { StorybookConfig } from '@storybook/react-vite';

const here = path.dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
    framework: '@storybook/react-vite',
    stories: ['../src/**/*.stories.@(ts|tsx)'],
    addons: [],
    core: { disableTelemetry: true },
    viteFinal: async (viteConfig) => ({
        ...viteConfig,
        // Tailwind scans the package's source (see @source in styles/index.css).
        plugins: [...(viteConfig.plugins ?? []), react(), tailwindcss()],
        resolve: {
            ...viteConfig.resolve,
            alias: {
                ...viteConfig.resolve?.alias,
                // NavAnchor imports next/link. Storybook has no Next router,
                // so a plain anchor stands in for it.
                'next/link': path.join(here, 'nextLinkStub.tsx'),
            },
        },
    }),
};

export default config;
