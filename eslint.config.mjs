import { defineFlatConfig } from 'eslint-define-config'; // 如果你想用原生，直接导出一个数组即可
import vueParser from 'vue-eslint-parser';
import tsParser from '@typescript-eslint/parser';
import pluginVue from 'eslint-plugin-vue';
import configPrettier from '@vue/eslint-config-prettier';
import tsEslint from 'typescript-eslint';

export default tsEslint.config(
  // 1. 忽略文件
  {
    ignores: ['.nuxt', 'dist', 'node_modules', '.output'],
  },
  
  // 2. 基础配置与 Vue 支持
  ...pluginVue.configs['flat/recommended'],
  
  // 3. TypeScript 支持
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsParser,
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
  },

  // 4. Prettier 冲突解决 (放在最后)
  configPrettier,

  // 5. 自定义规则
  {
    rules: {
      'vue/multi-word-component-names': 'off',
    },
  }
);