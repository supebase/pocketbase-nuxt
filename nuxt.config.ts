// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  modules: ['nuxt-auth-utils', '@nuxt/ui', '@nuxtjs/mdc', 'nuxt-emoji-picker', '@nuxt/image'],
  runtimeConfig: {
    session: {
      name: 'pb-session',
      password: process.env.NUXT_SESSION_PASSWORD || '',
      maxAge: 60 * 60 * 24 * 7,
    },
    pocketbaseBackend: process.env.NUXT_POCKETBASE_URL,
    public: {
      geoLocation: process.env.NUXT_GEOLOCATION_URL,
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
          content:
            'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0, viewport-fit=cover',
        },
      ],
    },
  },
  experimental: {
    // 启用路由预获取，当鼠标悬停在链接上时提前下载数据
    payloadExtraction: true, // 开启它，有助于快速导航
    renderJsonPayloads: true,
    typedPages: true, // 提升开发和构建时的路由分析速度
    // 💡 建议开启：支持在异步逻辑中更稳定地使用全局状态，对你的更新追踪器很有帮助
    asyncContext: true,
    componentIslands: true,
  },
  vue: {
    propsDestructure: true,
  },
  vite: {
    build: {
      cssMinify: 'lightningcss', // 比传统压缩更快更小
      // 禁用 CSS 的 Source Map 生成，从而消除插件警告
      sourcemap: false,
      target: 'esnext',
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
  },
  // 图片优化
  image: {
    // 1. 预设尺寸（关键）：解决重复加载
    // 如果你定义了预设，放大时和缩略图使用同一个预设，URL 就会完全一致，直接从缓存读取
    presets: {
      preview: {
        modifiers: {
          width: 600,
          format: 'webp',
          quality: 80,
        },
      },
      large: {
        modifiers: {
          width: 1200, // 放大后的尺寸
          format: 'webp',
          quality: 90,
        },
      },
    },

    // 2. 默认格式
    format: ['webp', 'jpg'],

    // 3. 响应式断点：自动根据屏幕宽度生成 srcset，防止小屏幕下载大图
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
    },

    // 4. 提供者（如果你没有特殊后端，默认是 'ipx'）
    provider: 'ipx',
  },
  // UI配置
  ui: {
    fonts: false,
  },
  // 图标配置
  icon: {
    // 禁用本地包，改为从 CDN 加载
    provider: 'iconify',
    serverBundle: 'remote',
    // 将超时时间延长，例如 3000ms 或 5000ms
    fetchTimeout: 5000,
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
        default: 'github-light',
        dark: 'github-dark',
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
  },
  // CSS配置
  css: ['~/assets/css/app.css'],
});
