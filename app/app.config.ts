export default defineAppConfig({
  ui: {
    colors: {
      primary: 'orange',
      neutral: 'neutral',
    },
    icons: {
      loading: 'i-hugeicons:loading-02',
      chevronDown: 'i-hugeicons:arrow-down-01',
      copy: 'i-hugeicons:copy-02',
      copyCheck: 'i-hugeicons:checkmark-square-03',
    },
    user: {
      variants: {
        size: {
          sm: {
            name: 'text-sm',
          },
        },
        orientation: {
          vertical: {
            root: 'flex-col items-center justify-center',
          },
        },
      },
    },
    empty: {
      slots: {
        avatar: 'shrink-0 mb-2 bg-transparent',
      },
    },
    separator: {
      slots: {
        label: 'text-sm text-dimmed/60',
      },
    },
    radioGroup: {
      slots: {
        item: 'rounded-lg border has-data-[state=checked]:shadow-lg has-data-[state=checked]:shadow-primary/50 w-full cursor-pointer',
        label: 'text-base',
        description: 'text-muted/80',
        fieldset: 'gap-3 justify-center',
      },
    },
    prose: {
      codeCollapse: {
        slots: {
          root: 'relative [&_pre]:h-[350px]',
          footer: 'h-16 absolute inset-x-6 bottom-px rounded-b-md flex items-center justify-end',
        },
      },
    },
  },

  toaster: {
    position: 'bottom-right' as const,
    expand: false,
    duration: 4000,
    // progress: false,
  },
});
