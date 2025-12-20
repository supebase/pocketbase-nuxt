import { defineConfig } from 'eslint-define-config';
import js from '@eslint/js';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import typescriptEslintParser from '@typescript-eslint/parser';
import vueEslint from 'eslint-plugin-vue';
import prettierConfig from '@vue/eslint-config-prettier';
import typescriptConfig from '@vue/eslint-config-typescript';

export default defineConfig([
  js.configs.recommended,
  {
    files: ['**/*.vue', '**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    plugins: {
      '@typescript-eslint': typescriptEslint,
      vue: vueEslint,
    },
    languageOptions: {
      parser: typescriptEslintParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'vue/multi-word-component-names': 'off',
      'vue/no-unused-vars': 'warn',
      'vue/no-v-html': 'off',
    },
  },
  typescriptConfig,
  prettierConfig,
]);