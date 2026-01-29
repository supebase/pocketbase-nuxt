export default defineAppConfig({
  ui: {
    colors: {
      neutral: 'neutral',
    },
    icons: {
      loading: 'i-hugeicons:loading-02',
      chevronDown: 'i-hugeicons:arrow-down-01',
      copy: 'i-hugeicons:copy-01',
      copyCheck: 'i-hugeicons:checkmark-square-03',
      close: 'i-hugeicons:cancel-01',
      search: 'i-hugeicons:search-01',
      check: 'i-hugeicons:tick-01',
      info: 'i-hugeicons:information-circle',
      tip: 'i-hugeicons:bulb',
      warning: 'i-hugeicons:alert-01',
      caution: 'i-hugeicons:alert-circle',
      drag: 'i-hugeicons:drag-drop-vertical',
    },
    header: {
      slots: {
        // container: 'max-w-xl',
      },
    },
    pageBody: {
      base: 'mt-6 pb-12 space-y-12',
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
    button: {
      slots: {
        base: 'rounded-full',
      },
    },
    input: {
      slots: {
        leadingIcon: 'size-5! ml-1!',
      },
      compoundVariants: [
        {
          class:
            'ring-default focus-visible:ring-black/10 dark:focus-visible:ring-white/10 transition-all duration-300',
        },
      ],
    },
    tabs: {
      slots: {
        list: 'rounded-full! h-12 mb-2',
        label: 'text-[15px]!',
        trigger: ['cursor-pointer'],
      },
      variants: {
        variant: {
          pill: {
            indicator: 'rounded-full',
          },
        },
      },
    },
    chip: {
      slots: {
        base: 'ring-2',
      },
    },
    empty: {
      slots: {
        root: 'bg-white! dark:bg-neutral-900! backdrop-blur-md',
        title: 'text-dimmed',
        description: 'text-dimmed/80!',
      },
    },
    separator: {
      slots: {
        label: 'text-sm text-dimmed/60',
      },
    },
    radioGroup: {
      slots: {
        item: 'rounded-lg w-full cursor-pointer',
        label: 'text-base',
        description: 'text-muted/70',
        fieldset: 'gap-3 justify-center',
      },
    },
    modal: {
      slots: {
        content: 'rounded-xl!',
      },
    },
    skeleton: {
      base: 'animate-none',
    },
    prose: {
      codeCollapse: {
        slots: {
          root: 'relative [&_pre]:h-[350px]',
          footer: 'h-16 absolute inset-x-4 bottom-px rounded-b-md flex items-center justify-end',
        },
      },
      pre: {
        slots: {
          base: 'text-[15px]/6 bg-transparent!',
          header: 'bg-muted!',
          filename: 'text-muted!',
        },
      },
    },
  },

  toaster: {
    position: 'bottom-right' as const,
    expand: false,
    duration: 4000,
  },
});
