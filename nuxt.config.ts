// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: false },
  ssr: false,

  modules: ["@nuxt/ui", "@vueuse/nuxt"],

  runtimeConfig: {
    public: {
      pocketbaseUrl: process.env.POCKETBASE_URL,
    },
  },

  ui: {
    fonts: false,
  },

  icon: {
    serverBundle: {
      collections: ["hugeicons"],
      externalizeIconsJson: true,
    },
    clientBundle: {
      scan: true,
    },
  },

  css: ["~/assets/css/app.css"],
});
