import typescriptEslint from '@typescript-eslint/eslint-plugin';
import prettier from 'eslint-plugin-prettier';
import tsParser from '@typescript-eslint/parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';
import globals from 'globals';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'src/diffRegistryData.ts'],
  },
  ...compat.extends(
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
    'prettier',
  ),
  {
    files: ['src/**/*.ts', 'jest.config.js'],

    plugins: {
      '@typescript-eslint': typescriptEslint,
      prettier,
    },

    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'prettier/prettier': 'error',
    },
  },
];
