export default defineAppConfig({
  ui: {
    colors: {
      primary: "blue",
      secondary: "purple",
      neutral: "zinc",
    },
    icons: {
      light: "hugeicons:sun-03",
      dark: "hugeicons:moon-02",
    },
    header: {
      slots: {
        container: "max-w-xl mx-auto",
      },
    },
  },
});
