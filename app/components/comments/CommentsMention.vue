<template>
  <div
    class="min-w-50 max-h-70 overflow-y-auto bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl border border-neutral-200/50 dark:border-neutral-800/50 shadow-xl rounded-xl p-1.5 select-none"
  >
    <div v-if="loading" class="flex flex-col items-center justify-center py-8 gap-2">
      <UIcon name="i-hugeicons:loading-03" class="animate-spin size-5 text-primary" />
      <span class="text-[11px] text-neutral-400">正在寻找...</span>
    </div>

    <div v-else-if="suggestions.length === 0" class="flex flex-col items-center justify-center py-8 gap-2">
      <UIcon name="i-hugeicons:user-search-01" class="size-6 text-neutral-300 dark:text-neutral-700" />
      <p class="text-[12px] text-neutral-400">暂无可提及用户</p>
    </div>

    <div v-else class="space-y-0.5">
      <div
        v-for="user in suggestions"
        :key="user.id"
        @click="$emit('select', user.name)"
        class="group relative flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer transition-all duration-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
      >
        <div
          class="absolute left-0 w-1 h-3/5 bg-primary rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity"
        />

        <div class="size-6 shrink-0 rounded-full overflow-hidden ring-1 ring-neutral-200/50 dark:ring-neutral-700/50">
          <CommonGravatar :avatar-id="user.avatar" :size="48" class="size-full object-cover" />
        </div>

        <div class="flex-1 min-w-0">
          <span class="text-[13px] font-semibold text-neutral-700 dark:text-neutral-200 truncate block">
            {{ user.name }}
          </span>
        </div>

        <UIcon
          name="i-hugeicons:arrow-right-01"
          class="size-3 text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity"
        />
      </div>

      <div class="mt-1.5 pt-1.5 border-t border-neutral-100 dark:border-neutral-800 flex justify-center">
        <span class="text-[10px] text-neutral-400 font-medium uppercase tracking-wider">选择用户</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  suggestions: any[];
  loading: boolean;
}>();

defineEmits<{
  (e: 'select', name: string): void;
}>();
</script>
