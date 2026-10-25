// Flat ESLint base shared across the workspace.
// Project-level configs import this and extend it with their own rules.
import nx from '@nx/eslint-plugin';

export default [
    {
        ignores: [
            '**/node_modules/**',
            '**/dist/**',
            '**/.next/**',
            '**/out/**',
            '**/.nx/**',
            '**/coverage/**',
            '**/storybook-static/**',
        ],
    },
    {
        files: ['**/src/**/*.ts', '**/src/**/*.tsx'],
        plugins: { '@nx': nx },
        rules: {
            // Only apps may import sylva-ui, and it may only import Sylva.
            '@nx/enforce-module-boundaries': [
                'error',
                {
                    allow: [],
                    depConstraints: [
                        {
                            sourceTag: 'type:app',
                            onlyDependOnLibsWithTags: [
                                'scope:sylva',
                                'scope:sylva-ui',
                            ],
                        },
                        {
                            sourceTag: 'type:ui',
                            onlyDependOnLibsWithTags: ['scope:sylva'],
                        },
                        {
                            sourceTag: 'type:tokens',
                            onlyDependOnLibsWithTags: [],
                        },
                    ],
                },
            ],
        },
    },
];
