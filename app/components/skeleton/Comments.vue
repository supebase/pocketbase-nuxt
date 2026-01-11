<template>
  <div class="w-full">
    <div class="flex items-center gap-4 mb-6 opacity-50">
      <div class="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
      <div class="h-4 w-16 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
      <div class="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
    </div>

    <div class="flex flex-col gap-10">
      <div v-for="i in 3" :key="i" class="flex gap-4">
        <div class="flex-none">
          <div class="size-8 rounded-full bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
        </div>

        <div class="flex-1 pt-1">
          <div class="flex justify-between items-center mb-3">
            <div class="h-4 w-24 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
            <div class="flex gap-4">
              <div class="h-4 w-10 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
            </div>
          </div>

          <div class="space-y-2 mb-3">
            <div class="h-4 w-full bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
            <div class="h-4 w-[90%] bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
          </div>

          <div class="h-3 w-32 bg-neutral-100 dark:bg-neutral-900 rounded animate-pulse" />
        </div>
      </div>
    </div>
  </div>
</template>
