import withNuxt from './.nuxt/eslint.config.mjs';
import pluginVue from 'eslint-plugin-vue';
import vueTsConfig from '@vue/eslint-config-typescript';
import skipFormatting from 'eslint-config-prettier';

export default withNuxt(
  // 1. 基础忽略文件
  {
    ignores: ['dist', '.output', '.nuxt', 'node_modules', 'public'],
  },

  // 2. 引入 Vue 和 TS 规则（withNuxt 内部通常已包含部分规则，这里做加强）
  ...pluginVue.configs['flat/essential'],
  ...vueTsConfig,

  // 3. 自定义规则配置
  {
    files: ['**/*.ts', '**/*.vue', '**/*.mts'],
    rules: {
      'max-len': [
        'error',
        {
          code: 120,
          tabWidth: 2,
          ignoreUrls: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
        },
      ],
      'vue/multi-word-component-names': 'off',
      'vue/html-indent': ['error', 2],

      // 这里的配置会覆盖上面 pluginVue 带来的冲突
      ...skipFormatting.rules,
    },
  },
);
