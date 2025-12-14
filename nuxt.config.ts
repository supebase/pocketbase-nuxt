// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  modules: ['nuxt-auth-utils'],
  runtimeConfig: {
    session: {
      name: 'pb-session',
      password: import.meta.env.ERIC_SESSION_PASSWORD,
      maxAge: 60 * 60 * 24 * 7
    },
    public: {
      POCKETBASE_URL: import.meta.env.POCKETBASE_URL
    }
  }
})