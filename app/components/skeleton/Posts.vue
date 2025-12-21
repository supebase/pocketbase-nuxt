<template>
  <div>
    <div v-for="i in count" :key="i" class="relative flex gap-4 mb-6">
      <div class="flex flex-col items-center">
        <USkeleton class="size-8 rounded-full shrink-0" />
        <div v-if="i !== count" class="w-0.5 grow bg-neutral-100 dark:bg-neutral-800 my-2"></div>
      </div>

      <div class="flex-1 space-y-4 pb-4">
        <div class="flex items-center justify-between mt-1">
          <USkeleton class="h-5 w-32" /> <USkeleton class="h-4 w-20" />
        </div>

        <div class="space-y-2">
          <USkeleton class="h-4 w-full" />
          <USkeleton class="h-4 w-[90%]" />
          <USkeleton class="h-4 w-[40%]" />
        </div>

        <USkeleton class="h-48 w-full rounded-xl" />

        <div class="flex gap-2">
          <USkeleton class="h-6 w-16 rounded-md" />
          <USkeleton class="h-6 w-16 rounded-md" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  defineProps({
    count: {
      type: Number,
      default: 1,
    },
  });
</script>
