import { configs } from '@solana/ms-tools-config/eslint.config.react.mjs'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  configs.react,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    files: [
      'src/**/*.{ts,tsx,js,jsx,json,mjs,cjs}',
      '.storybook/preview.ts',
      '.storybook/main.ts',
      'eslint.config.mjs',
      'prettier.config.js',
      '*.config.ts',
      '*.config.js',
      '*.config.mjs',
    ],
    rules: {
      // Add any UI-specific overrides here
    },
  },
])
