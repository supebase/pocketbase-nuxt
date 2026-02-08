// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  modules: ['nuxt-auth-utils', '@nuxt/ui', '@nuxtjs/mdc', 'nuxt-emoji-picker'],
  runtimeConfig: {
    session: {
      name: 'pb-session',
      password:
        process.env.NUXT_SESSION_PASSWORD ||
        (() => {
          throw new Error('NUXT_SESSION_PASSWORD 环境变量必须设置且至少32字符');
        })(),
      maxAge: 60 * 60 * 24 * 7,
    },
    pocketbaseBackend: process.env.NUXT_POCKETBASE_URL,
    ipDataPath: process.env.NUXT_IPDATA_PATH || '',
    public: {
      partykitHost: process.env.NUXT_PUBLIC_PARTYKIT_HOST,
    },
  },
  app: {
    keepalive: {
      max: 10,
    },
    head: {
      title: 'Eric',
      meta: [
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0, viewport-fit=cover',
        },
        {
          name: 'apple-mobile-web-app-status-bar-style',
          content: 'default',
        },
      ],
    },
  },
  experimental: {
    payloadExtraction: false,
    renderJsonPayloads: true,
    typedPages: true,
    asyncContext: true,
    componentIslands: true,
  },
  vue: {
    propsDestructure: true,
  },
  vite: {
    build: {
      cssMinify: 'lightningcss',
      sourcemap: false,
      target: 'esnext',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('prosemirror')) {
              return 'editor-bundle';
            }
          },
        },
      },
    },
    optimizeDeps: {
      include: [
        'prosemirror-state',
        'prosemirror-transform',
        'prosemirror-model',
        'prosemirror-view',
        'prosemirror-gapcursor',
        'partysocket',
      ],
    },
  },
  // 压缩配置
  nitro: {
    esbuild: {
      options: {
        target: 'esnext',
      },
    },
    compressPublicAssets: {
      brotli: true,
      gzip: true,
    },
    minify: true,
    imports: {
      dirs: ['./server/services'],
    },
    routeRules: {
      '/api/realtime': {
        cache: false,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
        },
      },
    },
  },
  // UI配置
  ui: {
    fonts: false,
    experimental: {
      componentDetection: true,
    },
  },
  // 图标配置
  icon: {
    // 禁用本地包，改为从 CDN 加载
    provider: 'iconify',
    serverBundle: {
      // 显式声明只从这些本地包里找图标
      collections: ['hugeicons', 'simple-icons', 'vscode-icons', 'heroicons'],
    },
    // 依然可以配置自定义
    clientBundle: {
      scan: true, // 仅扫描代码中用到的图标，不会全量打包
    },
  },
  // MDC配置
  mdc: {
    headings: {
      anchorLinks: true,
    },
    highlight: {
      theme: {
        default: 'github-light-default',
        light: 'github-light-default',
        dark: 'github-dark-default',
      },
    },
    components: {
      prose: true,
    },
  },
  components: [
    // 1. 只有放在这个文件夹里的组件才会全局注册，供 MDC 使用
    {
      path: './components/prose',
      global: true,
    },
    // 2. 其他组件仅使用自动导入（不设为 global），消除冲突
    {
      path: './components',
      global: false, // 关键：关闭通用的全局注册
    },
  ],
  // 颜色模式配置
  colorMode: {
    classSuffix: '',
    preference: 'dark',
  },
  // CSS配置
  css: ['~/assets/css/app.css'],
});
