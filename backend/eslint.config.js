// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import js from '@eslint/js';
import prettierPlugin from 'eslint-plugin-prettier';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import ununsedImport from 'eslint-plugin-unused-imports';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import pluginImport from 'eslint-plugin-import';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  // Global ignores
  globalIgnores([
    'dist',
    '**/route-tree.gen.ts',
    'src/infra/i18n/**/*',
    'src/i18n/*.ts',
    'src/infra/db/db.ts',
  ]),
  // Recommended configs
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // Main configuration
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      prettier: prettierPlugin,
      'simple-import-sort': simpleImportSort,
      'unused-imports': ununsedImport,
      import: pluginImport,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // --- Plugins Rules ---
      'import/no-duplicates': 'error',
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'prettier/prettier': ['error'],
      'unused-imports/no-unused-imports': 'error',

      // --- Basic Rules ---
      'no-trailing-spaces': 'error',
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          ignoreRestSiblings: true,
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
        },
      ],
      // Naming
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'method',
          modifiers: ['private'],
          format: ['camelCase'],
          leadingUnderscore: 'require',
        },
        {
          selector: 'classProperty',
          modifiers: ['private'],
          format: ['camelCase'],
          leadingUnderscore: 'require',
        },
      ],
      // empty line
      'no-multiple-empty-lines': [
        'error',
        {
          max: 1, // Maximum 1 empty line between code blocks
          maxEOF: 0, // No empty lines at the end of the file
          maxBOF: 0, // No empty lines at the beginning of the file
        },
      ],
    },
  },
  // Email template overrides
  {
    files: ['src/infra/global/email/template/**/*.tsx'],
    rules: {
      'prettier/prettier': 'off',
    },
  },
]);
