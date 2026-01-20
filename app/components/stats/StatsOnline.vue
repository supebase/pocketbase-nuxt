<template>
  <div class="fixed bottom-6 right-6 z-50 select-none">
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="transform translate-y-4 opacity-0"
      enter-to-class="transform translate-y-0 opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="transform translate-y-0 opacity-100"
      leave-to-class="transform translate-y-4 opacity-0"
    >
      <UBadge
        v-if="count !== null"
        variant="subtle"
        color="primary"
        size="md"
        class="rounded-full px-3 py-1.5 font-bold ring-1 ring-primary/20 backdrop-blur-md bg-white/80 dark:bg-neutral-900/80"
      >
        <span class="relative flex h-2 w-2 mr-2">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
        </span>
        <span class="tabular-nums tracking-tight">{{ count }} 人在线</span>
      </UBadge>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { useOnlineStats } from '~/modules/stats/use-stats-logic';
const { count } = useOnlineStats();
</script>
