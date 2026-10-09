import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import baseConfig from '../../eslint.config.mjs';

const eslintConfig = [
    ...baseConfig,
    { ignores: ['.next/**', 'out/**', 'next-env.d.ts'] },
    ...nextVitals,
    ...nextTypescript,
];

export default eslintConfig;
