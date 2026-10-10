import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const alias = { '@': fileURLToPath(new URL('./src', import.meta.url)) };

export default defineConfig({
    test: {
        // Two projects: logic and database tests run in node; React component
        // tests (*.test.tsx) run in jsdom with Testing Library set up.
        projects: [
            {
                resolve: { alias },
                test: {
                    name: 'node',
                    environment: 'node',
                    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
                    // PGlite boots a real Postgres in WASM; allow time on slow machines.
                    testTimeout: 30_000,
                    hookTimeout: 30_000,
                },
            },
            {
                resolve: { alias },
                oxc: { jsx: { runtime: 'automatic' } },
                test: {
                    name: 'dom',
                    environment: 'jsdom',
                    include: ['src/**/*.test.tsx'],
                    setupFiles: ['./vitest.setup.dom.ts'],
                },
            },
        ],
    },
});
