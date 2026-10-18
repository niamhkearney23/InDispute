import coreWebVitals from 'eslint-config-next/core-web-vitals';
import typescriptConfig from 'eslint-config-next/typescript';

const config = [
  ...coreWebVitals,
  ...typescriptConfig,
  {
    ignores: ['.next/**', '.next-it/**', '.next-qa/**', 'node_modules/**', 'next-env.d.ts', 'video/*/assets/**'],
  },
];

export default config;
