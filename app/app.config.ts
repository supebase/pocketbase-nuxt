export default defineAppConfig({
  ui: {
    colors: {
      primary: "orange",
      neutral: "neutral",
    },
    icons: {
      chevronDown: "hugeicons:arrow-down-01",
      copy: "hugeicons:copy-02",
      copyCheck: "hugeicons:checkmark-square-03",
    },
    user: {
      variants: {
        size: {
          sm: {
            name: "text-sm",
          },
        },
        orientation: {
          vertical: {
            root: "flex-col items-center justify-center",
          },
        },
      },
    },
    empty: {
      slots: {
        avatar: "shrink-0 mb-2 bg-transparent",
      },
      variants: {
        size: {
          md: {
            title: "text-dimmed",
            description: "text-dimmed!",
            avatar: "text-3xl",
          },
        },
      },
    },
  },
});
