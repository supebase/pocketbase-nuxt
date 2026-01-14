<template>
  <UModal
    v-model:open="isOpen"
    :ui="{ overlay: 'backdrop-blur-xs', footer: 'justify-end' }"
    title="代码块（代码语言和文件名）"
    description="如果输入错误，代码块将无法正常显示。"
  >
    <template #body>
      <div class="flex items-center gap-4 w-full">
        <UFieldGroup label="代码语言" name="language" id="language-field" class="w-full">
          <UInput
            v-model="formData.language"
            variant="outline"
            color="neutral"
            size="lg"
            placeholder="语言: ts, js, css"
            autofocus
            class="w-full"
          />
        </UFieldGroup>

        <UFieldGroup label="文件名" name="filename" id="filename-field" class="w-full">
          <UInput
            v-model="formData.filename"
            variant="outline"
            color="neutral"
            size="lg"
            placeholder="文件名: example.ts, utils.js"
            class="w-full"
          />
        </UFieldGroup>
      </div>
    </template>

    <template #footer>
      <div class="flex items-center gap-3">
        <UButton label="取消" color="neutral" class="cursor-pointer" @click="isOpen = false" />
        <UButton label="确认" color="success" class="cursor-pointer" @click="handleConfirm" />
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

const handleConfirm = () => {
  emit('confirm', {
    language: formData.language.trim(),
    filename: formData.filename.trim(),
  });
  formData.language = '';
  formData.filename = '';
  isOpen.value = false;
};
</script>
