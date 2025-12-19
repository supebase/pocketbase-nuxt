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
    separator: {
      slots: {
        label: "text-sm text-dimmed",
      },
    },
    radioGroup: {
      slots: {
        item: "rounded-lg border has-data-[state=checked]:shadow-lg has-data-[state=checked]:shadow-primary/30 w-full cursor-pointer",
        label: "text-base",
        description: "text-muted/80",
        fieldset: "gap-3 justify-center",
      },
    },
  },

  toaster: {
    position: "top-right" as const,
    expand: false,
    duration: 5000,
    progress: false,
  },
});
