<template>
  <div class="p-1 w-48 max-h-60 overflow-y-auto">
    <div v-if="loading" class="p-2 text-center">
      <UIcon name="i-hugeicons:refresh" class="animate-spin size-4" />
    </div>
    <div v-else-if="suggestions.length === 0" class="p-2 text-sm text-center text-dimmed">
      暂无可提及的用户
    </div>
    <div v-else>
      <div
        v-for="user in suggestions"
        :key="user.id"
        @click="$emit('select', user.name)"
        class="flex items-center gap-2 p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded cursor-pointer transition-colors"
      >
        <div class="size-5 rounded-full overflow-hidden shrink-0">
          <CommonGravatar :avatar-id="user.avatar" :size="32" />
        </div>
        <span class="text-sm truncate">{{ user.name }}</span>
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
