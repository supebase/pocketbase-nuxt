module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
    node: true,
    'vue/setup-compiler-macros': true
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:vue/vue3-recommended',
    '@vue/eslint-config-typescript',
    '@vue/eslint-config-prettier'
  ],
  ignorePatterns: ['dist', '.nuxt', 'node_modules'],
  parser: 'vue-eslint-parser',
  parserOptions: {
    ecmaVersion: 'latest',
    parser: '@typescript-eslint/parser',
    sourceType: 'module'
  },
  plugins: ['vue', '@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'vue/multi-word-component-names': 'off',
    'vue/no-unused-vars': 'warn',
    'vue/no-v-html': 'off',
    'no-undef': 'off'
  },
  globals: {
    'defineNuxtConfig': 'readonly',
    'defineAppConfig': 'readonly',
    'defineEventHandler': 'readonly',
    'defineNuxtRouteMiddleware': 'readonly',
    'useUserSession': 'readonly',
    'getUserSession': 'readonly',
    'setUserSession': 'readonly',
    'clearUserSession': 'readonly',
    'navigateTo': 'readonly',
    'readBody': 'readonly',
    'createError': 'readonly',
    'getQuery': 'readonly',
    'getRouterParam': 'readonly',
    'useRuntimeConfig': 'readonly',
    'useState': 'readonly',
    'refreshNuxtData': 'readonly'
  }
}