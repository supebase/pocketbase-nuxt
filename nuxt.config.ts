// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: false },
  modules: ["nuxt-auth-utils", "@nuxt/ui", "@nuxtjs/mdc", "nuxt-emoji-picker"],
  runtimeConfig: {
    session: {
      name: "pb-session",
      password: import.meta.env.ERIC_SESSION_PASSWORD,
      maxAge: 60 * 60 * 24 * 7,
    },
    public: {
      POCKETBASE_URL: import.meta.env.POCKETBASE_URL,
    },
  },
  app: {
    keepalive: {
      max: 10,
    },
    head: {
      htmlAttrs: {
        lang: "zh-CN",
      },
      viewport:
        "width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover",
    },
  },
  ui: {
    fonts: false,
  },
  icon: {
    serverBundle: {
      collections: ["hugeicons", "svg-spinners", "vscode-icons"],
    },
    clientBundle: {
      scan: true,
    },
  },
  mdc: {
    headings: {
      anchorLinks: false,
    },
    highlight: {
      theme: {
        default: "github-light",
        dark: "github-dark",
      },
    },
  },
  colorMode: {
    preference: "dark",
  },
  css: ["~/assets/css/app.css"],
});