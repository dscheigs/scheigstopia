// Flat ESLint config shared across the workspace.
// Project-level configs import this and extend it with their own rules.
export default [
    {
        ignores: [
            '**/node_modules/**',
            '**/dist/**',
            '**/.next/**',
            '**/out/**',
            '**/.nx/**',
            '**/coverage/**',
        ],
    },
];
