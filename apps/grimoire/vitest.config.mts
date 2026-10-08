import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    resolve: {
        alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    test: {
        environment: 'node',
        include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
        // PGlite boots a real Postgres in WASM; allow time on slow machines.
        testTimeout: 30_000,
        hookTimeout: 30_000,
    },
});
