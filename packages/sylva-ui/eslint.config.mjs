import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import baseConfig from '../../eslint.config.mjs';

export default [...baseConfig, ...nextVitals, ...nextTypescript];
