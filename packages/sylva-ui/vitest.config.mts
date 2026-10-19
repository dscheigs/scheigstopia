import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        // Two projects: logic and scan tests run in node; React component
        // tests (*.test.tsx) run in jsdom with Testing Library set up.
        projects: [
            {
                test: {
                    name: 'node',
                    environment: 'node',
                    include: ['src/**/*.test.ts'],
                },
            },
            {
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
