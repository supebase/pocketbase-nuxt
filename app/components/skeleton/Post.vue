<template>
  <div class="flex flex-col">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <USkeleton class="size-8 rounded-full" />
        <USkeleton class="h-4 w-40" />
      </div>
      <USkeleton class="h-4 w-18" />
    </div>

    <div class="space-y-6 mt-6">
      <USkeleton class="h-9 w-2/3" />

      <div class="space-y-3">
        <USkeleton class="h-4 w-full" />
        <USkeleton class="h-4 w-full" />
        <USkeleton class="h-4 w-5/6" />
        <USkeleton class="h-4 w-4/6" />
      </div>

      <div class="relative">
        <USkeleton class="h-64 w-full rounded-lg" />
      </div>

      <div class="space-y-3">
        <USkeleton class="h-4 w-full" />
        <USkeleton class="h-4 w-full" />
        <USkeleton class="h-4 w-5/6" />
        <USkeleton class="h-4 w-4/6" />
      </div>

      <div class="space-y-3">
        <USkeleton class="h-4 w-full" />
        <USkeleton class="h-4 w-full" />
        <USkeleton class="h-4 w-5/6" />
        <USkeleton class="h-4 w-4/6" />
      </div>
    </div>

    <div class="mt-10 pt-8 border-t border-neutral-100 dark:border-neutral-800 space-y-4">
      <USkeleton class="h-20 w-full rounded-lg" />
    </div>
  </div>
</template>
