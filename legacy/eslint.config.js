import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh, { rules } from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';
import pluginPrettier from 'eslint-plugin-prettier/recommended';
import tailwind from 'eslint-plugin-tailwindcss';

export default defineConfig([
  globalIgnores(['dist']),
  js.configs.recommended,
  pluginPrettier,
  ...tailwind.configs['flat/recommended'],
  reactHooks.configs['recommended-latest'],
  reactRefresh.configs.vite,

  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z]' }],
      quotes: ['error', 'single'],
      'react/react-in-jsx-scope': 'off',
      'tailwindcss/classnames-order': 'off',
    },
  },
]);
