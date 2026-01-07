<template>
  <UModal
    v-model:open="open"
    title="确认执行删除操作？"
    description="该操作不可逆，删除后数据将永久清除，请注意确认。"
    :ui="{ footer: 'justify-end' }"
  >
    <template #body>
      <slot />
    </template>

    <template #footer="{ close }">
      <div class="flex items-center gap-3">
        <UButton label="取消" color="neutral" class="cursor-pointer" @click="close" />
        <UButton
          label="确认删除"
          color="error"
          class="cursor-pointer"
          :loading="loading"
          @click="handleConfirm"
        />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const open = defineModel<boolean>('open', { default: false });

defineProps<{
  loading?: boolean;
}>();

const emit = defineEmits(['confirm']);

const handleConfirm = () => {
  emit('confirm');
  open.value = false;
};
</script>
