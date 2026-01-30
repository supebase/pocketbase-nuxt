// @ts-check
// @ts-ignore - 忽略本地未生成文件时的导入报错
import withNuxt from './.nuxt/eslint.config.mjs';
import skipFormatting from 'eslint-config-prettier';

export default withNuxt(
  {
    // 补全了 Nuxt 常见的临时文件和构建目录
    ignores: ['dist', '.output', '.nuxt', 'node_modules', 'public', '.nitro', '.data', 'coverage'],
  },
  {
    // 增加对 .mts, .tsx 等格式的支持（如果你以后用到）
    files: ['**/*.ts', '**/*.vue', '**/*.mts', '**/*.tsx'],
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

      // 可以在这里显式关闭 console，生产环境更安全
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    },
  },
  // 必须放在最后，确保关闭所有与格式化冲突的规则
  skipFormatting,
);
