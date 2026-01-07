<template>
  <ClientOnly>
    <UButton
      :icon="`${nextTheme === 'dark' ? 'i-hugeicons:sun-03' : 'i-hugeicons:moon-02'}`"
      color="neutral"
      variant="link"
      class="rounded-full cursor-pointer"
      tabindex="-1"
      @click="startViewTransition"
    />
    <template #fallback>
      <UIcon name="i-hugeicons:refresh" class="size-5 mx-1.5 text-muted animate-spin" />
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
const colorMode = useColorMode();

const nextTheme = computed(() => (colorMode.value === 'dark' ? 'light' : 'dark'));

const switchTheme = () => {
  colorMode.preference = nextTheme.value;
};

const startViewTransition = (event: MouseEvent) => {
  if (!document.startViewTransition) {
    switchTheme();
    return;
  }

  const x = event.clientX;
  const y = event.clientY;
  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  );

  const transition = document.startViewTransition(() => {
    switchTheme();
  });

  transition.ready.then(() => {
    const duration = 500;
    document.documentElement.animate(
      {
        clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`],
      },
      {
        duration: duration,
        easing: 'cubic-bezier(.76,.32,.29,.99)',
        pseudoElement: '::view-transition-new(root)',
      },
    );
  });
};

useHead({
  meta: [
    {
      id: 'theme-color',
      name: 'theme-color',
      content: () => (colorMode.value === 'dark' ? '#171717' : '#ffffff'),
    },
  ],
});
</script>
