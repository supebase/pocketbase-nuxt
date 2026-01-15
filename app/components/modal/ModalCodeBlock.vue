<template>
  <UModal
    v-model:open="isOpen"
    :ui="{ overlay: 'backdrop-blur-xs', footer: 'justify-end' }"
    title="插入代码块"
    description="请指定代码语言（用于高亮）和可选的文件名。"
  >
    <template #body>
      <div class="flex items-center gap-4 w-full" @keyup.enter="handleConfirm">
        <UFieldGroup label="代码语言" name="language" class="w-full">
          <UInput
            v-model="formData.language"
            variant="outline"
            color="neutral"
            size="lg"
            placeholder="例如: ts, js, vue"
            autofocus
            class="w-full"
          />
        </UFieldGroup>

        <UFieldGroup label="文件名" name="filename" class="w-full">
          <UInput
            v-model="formData.filename"
            variant="outline"
            color="neutral"
            size="lg"
            placeholder="例如: index.ts"
            class="w-full"
          />
        </UFieldGroup>
      </div>
    </template>

    <template #footer>
      <div class="flex items-center gap-3">
        <UButton label="取消" variant="ghost" color="neutral" @click="isOpen = false" />
        <UButton label="插入代码块" color="primary" :disabled="!formData.language" @click="handleConfirm" />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  confirm: [data: { language: string; filename: string }];
}>();

const isOpen = defineModel<boolean>('open', { default: false });

const formData = reactive({
  language: '',
  filename: '',
});

// 2. 监听弹窗关闭，彻底重置表单（防止取消后再打开仍有旧数据）
watch(isOpen, (val) => {
  if (!val) {
    formData.language = '';
    formData.filename = '';
  }
});

const handleConfirm = () => {
  // 3. 基础校验：如果没有语言，通常不建议提交（或者给个默认值）
  if (!formData.language.trim()) return;

  emit('confirm', {
    // 强制转换为小写，确保高亮插件能识别
    language: formData.language.trim().toLowerCase(),
    filename: formData.filename.trim(),
  });

  isOpen.value = false;
};
</script>
