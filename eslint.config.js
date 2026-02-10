// @ts-check
// @ts-ignore
import withNuxt from './.nuxt/eslint.config.mjs';
import skipFormatting from 'eslint-config-prettier';

export default withNuxt(
  {
    // ESLint 10 推荐将 name 属性加入配置块，方便调试
    name: 'project-root-ignores',
    ignores: [
      'dist',
      '.output',
      '.nuxt',
      'node_modules',
      'public',
      '.nitro',
      '.data',
      'coverage',
      '**/*.min.js', // 建议增加对压缩文件的忽略
    ],
  },
  {
    name: 'project-custom-rules',
    files: ['**/*.ts', '**/*.vue', '**/*.mts', '**/*.tsx'],
    languageOptions: {
      // 显式指定全局变量，ESLint 10 不再支持在文件内用 /* eslint-env */
      globals: {
        process: 'readonly',
        console: 'readonly',
      },
    },
    rules: {
      'max-len': [
        'error',
        {
          code: 120,
          tabWidth: 2,
          ignoreUrls: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
          ignoreComments: true, // 建议忽略注释，防止因为长 URL 注释报错
        },
      ],
      'vue/multi-word-component-names': 'off',
      'vue/html-indent': ['error', 2],

      // 修改环境判断逻辑：ESLint 配置文件执行于 Node 环境
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',

      // ESLint 10 新推荐规则补齐（可选）
      'no-useless-assignment': 'warn',
    },
  },
  skipFormatting,
);
